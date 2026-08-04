#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { cma, esperar, exigirCredenciales, LOCALE, subirBinario, todasLasEntradas } from "./cma.mjs";

const TIPOS = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
};

const AYUDA = `
Uso:  npm run og -- <imagen> <ruta>

Ejemplos:
  npm run og -- ~/Desktop/premios.jpg /premios
  npm run og -- ~/Desktop/plantilla.png /plantilla
  npm run og -- ~/Desktop/jugadoras.jpg "/jugadoras/*"     (toda la sección)
  npm run og -- ~/Desktop/portada.jpg /                    (la home)

Otras opciones:
  npm run og -- --lista            ver las miniaturas configuradas
  npm run og -- --borrar /premios  quitar la miniatura de una ruta

La imagen ideal es de 1200x630 px, pero vale cualquiera: se recorta
automáticamente a ese tamaño al servirla.
`;

function normalizarRuta(ruta) {
    let r = String(ruta).trim().toLowerCase();
    if (!r.startsWith("/")) r = `/${r}`;
    if (r.length > 1) r = r.replace(/\/+$/, "");
    return r || "/";
}

async function asegurarTipo() {
    try {
        await cma("/content_types/ogImage");
        return;
    } catch (e) {
        if (!e.message.includes("404")) throw e;
    }

    await cma("/content_types/ogImage", {
        method: "PUT",
        body: {
            name: "Miniatura para compartir (og:image)",
            description:
                "Imagen que se ve al compartir una página en redes o WhatsApp. La ruta es la de la web, por ejemplo /premios o /jugadoras/* para toda la sección.",
            displayField: "ruta",
            fields: [
                {
                    id: "ruta",
                    name: "Ruta de la página",
                    type: "Symbol",
                    required: true,
                    validations: [{ unique: true }],
                },
                {
                    id: "imagen",
                    name: "Miniatura (1200x630)",
                    type: "Link",
                    linkType: "Asset",
                    required: true,
                    validations: [{ linkMimetypeGroup: ["image"] }],
                },
            ],
        },
    });

    const tipo = await cma("/content_types/ogImage");
    await cma("/content_types/ogImage/published", {
        method: "PUT",
        headers: { "X-Contentful-Version": String(tipo.sys.version) },
    });
    await esperar("/content_types/ogImage", (t) => Boolean(t.sys.publishedVersion));

    console.log("✅ Tipo de contenido 'Miniatura para compartir' creado en Contentful");
}

async function subirImagen(archivo, ruta) {
    const ext = path.extname(archivo).toLowerCase();
    const contentType = TIPOS[ext];
    if (!contentType) throw new Error(`Formato no soportado: ${ext} (usa jpg, png o webp)`);

    const upload = await subirBinario(fs.readFileSync(archivo));

    const asset = await cma("/assets", {
        method: "POST",
        body: {
            fields: {
                title: { [LOCALE]: `og${ruta === "/" ? "/home" : ruta}` },
                description: { [LOCALE]: `Miniatura para compartir de ${ruta}` },
                file: {
                    [LOCALE]: {
                        contentType,
                        fileName: `og-${normalizarRuta(ruta).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "home"}${ext}`,
                        uploadFrom: { sys: { type: "Link", linkType: "Upload", id: upload.sys.id } },
                    },
                },
            },
        },
    });

    await cma(`/assets/${asset.sys.id}/files/${LOCALE}/process`, {
        method: "PUT",
        headers: { "X-Contentful-Version": String(asset.sys.version) },
    });

    const procesado = await esperar(
        `/assets/${asset.sys.id}`,
        (a) => Boolean(a.fields?.file?.[LOCALE]?.url),
    );

    await cma(`/assets/${asset.sys.id}/published`, {
        method: "PUT",
        headers: { "X-Contentful-Version": String(procesado.sys.version) },
    });

    return procesado;
}

async function buscarEntrada(ruta) {
    const entradas = await todasLasEntradas("ogImage");
    return entradas.find((e) => normalizarRuta(e.fields?.ruta?.[LOCALE] ?? "") === ruta) || null;
}

async function asignar(archivo, rutaCruda) {
    const ruta = normalizarRuta(rutaCruda);
    const local = path.resolve(archivo.replace(/^~/, process.env.HOME || "~"));
    if (!fs.existsSync(local)) throw new Error(`No existe la imagen: ${local}`);

    await asegurarTipo();

    console.log(`\n📤 Subiendo ${path.basename(local)} para la ruta ${ruta}...`);
    const asset = await subirImagen(local, ruta);

    const enlace = { sys: { type: "Link", linkType: "Asset", id: asset.sys.id } };
    const existente = await buscarEntrada(ruta);

    const entrada = existente
        ? await cma(`/entries/${existente.sys.id}`, {
              method: "PUT",
              headers: { "X-Contentful-Version": String(existente.sys.version) },
              body: {
                  fields: { ...existente.fields, imagen: { [LOCALE]: enlace } },
              },
          })
        : await cma("/entries", {
              method: "POST",
              headers: { "X-Contentful-Content-Type": "ogImage" },
              body: {
                  fields: { ruta: { [LOCALE]: ruta }, imagen: { [LOCALE]: enlace } },
              },
          });

    await cma(`/entries/${entrada.sys.id}/published`, {
        method: "PUT",
        headers: { "X-Contentful-Version": String(entrada.sys.version) },
    });

    console.log(`
✅ Listo. La página ${ruta} ya comparte esta miniatura.

   Imagen: https:${asset.fields.file[LOCALE].url}
   Se aplica sola en unos minutos (o al instante si redespliegas).

   Compruébalo en: https://www.opengraph.xyz/url/${encodeURIComponent(
       `https://www.madridfemeninoxtra.com${ruta === "/" ? "" : ruta}`,
   )}
`);
}

async function listar() {
    await asegurarTipo();
    const entradas = await todasLasEntradas("ogImage");
    if (!entradas.length) {
        console.log("\nNo hay miniaturas configuradas todavía.\n");
        return;
    }
    console.log(`\n🖼  ${entradas.length} miniaturas configuradas:\n`);
    for (const e of entradas) {
        const publicada = e.sys.publishedVersion ? "" : "  (sin publicar)";
        console.log(`   ${e.fields?.ruta?.[LOCALE]}${publicada}`);
    }
    console.log("");
}

async function borrar(rutaCruda) {
    const ruta = normalizarRuta(rutaCruda);
    const entrada = await buscarEntrada(ruta);
    if (!entrada) {
        console.log(`No hay miniatura configurada para ${ruta}`);
        return;
    }
    if (entrada.sys.publishedVersion) {
        await cma(`/entries/${entrada.sys.id}/published`, {
            method: "DELETE",
            headers: { "X-Contentful-Version": String(entrada.sys.version) },
        });
    }
    const actual = await cma(`/entries/${entrada.sys.id}`);
    await cma(`/entries/${entrada.sys.id}`, {
        method: "DELETE",
        headers: { "X-Contentful-Version": String(actual.sys.version) },
    });
    console.log(`🗑  Miniatura de ${ruta} eliminada`);
}

async function main() {
    exigirCredenciales();
    const args = process.argv.slice(2);

    if (args.includes("--lista")) return listar();
    if (args.includes("--borrar")) return borrar(args[args.indexOf("--borrar") + 1]);

    const [archivo, ruta] = args.filter((a) => !a.startsWith("--"));
    if (!archivo || !ruta) {
        console.log(AYUDA);
        process.exit(1);
    }
    return asignar(archivo, ruta);
}

main().catch((e) => {
    console.error("❌", e.message);
    process.exit(1);
});
