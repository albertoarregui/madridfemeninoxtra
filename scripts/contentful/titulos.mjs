#!/usr/bin/env node
import { createClient } from "@libsql/client";
import {
    cma,
    env,
    esperar,
    estaPublicada,
    exigirCredenciales,
    LOCALE,
    todasLasEntradas,
} from "./cma.mjs";

const SECO = process.argv.includes("--seco");

const ETIQUETAS = {
    jugadora: "Jugadora",
    entrenador: "Entrenador",
    arbitra: "Árbitra",
    club: "Club",
    estadio: "Estadio",
    match: "Partido",
};

const FUENTES = {
    jugadora: { tabla: "jugadoras", id: "id_jugadora" },
    entrenador: { tabla: "entrenadores", id: "id_entrenador" },
    arbitra: { tabla: "arbitras", id: "id_arbitra" },
    club: { tabla: "clubes", id: "id_club" },
    estadio: { tabla: "estadios", id: "id_estadio" },
};

function slugify(text) {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/ø/g, "o")
        .replace(/ö/g, "o")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function cargarNombres() {
    const url = env.TURSO_STATS_DATABASE_URL || env.TURSO_DATABASE_URL;
    const authToken = env.TURSO_STATS_AUTH_TOKEN || env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
        console.error("❌ Faltan credenciales de Turso en .env.local");
        process.exit(1);
    }

    const db = createClient({ url, authToken });
    const mapas = {};

    for (const [tipo, { tabla, id }] of Object.entries(FUENTES)) {
        const mapa = new Map();
        const columnas = await db.execute(`SELECT name FROM pragma_table_info('${tabla}')`);
        const tieneSlug = columnas.rows.some((r) => r.name === "slug");
        const res = await db.execute(
            `SELECT ${id}, nombre${tieneSlug ? ", slug" : ""} FROM ${tabla}`,
        );

        for (const fila of res.rows) {
            const nombre = String(fila.nombre || "").trim();
            if (!nombre) continue;
            mapa.set(String(fila[id]), nombre);
            const slugNombre = slugify(nombre);
            if (slugNombre && !mapa.has(slugNombre)) mapa.set(slugNombre, nombre);
            if (fila.slug && !mapa.has(String(fila.slug))) mapa.set(String(fila.slug), nombre);
        }
        mapas[tipo] = mapa;
    }

    return mapas;
}

async function asegurarCampoTitulo() {
    const tipo = await cma("/content_types/ficha");
    const existente = tipo.fields.find(
        (f) => ["titulo", "title"].includes(f.id) && ["Symbol", "Text"].includes(f.type),
    );
    const campoTitulo = existente?.id ?? "titulo";

    if (existente && tipo.displayField === campoTitulo) {
        console.log(`✔️  El tipo 'ficha' ya usa '${campoTitulo}' como nombre de entrada`);
        return campoTitulo;
    }
    if (SECO) {
        console.log(
            existente
                ? `🔎 [seco] Pondría '${campoTitulo}' como nombre de entrada`
                : "🔎 [seco] Añadiría el campo 'titulo' y lo pondría como nombre de entrada",
        );
        return campoTitulo;
    }

    const campos = existente
        ? tipo.fields
        : [
              {
                  id: "titulo",
                  name: "Título (interno)",
                  type: "Symbol",
                  localized: false,
                  required: false,
                  disabled: false,
                  omitted: false,
              },
              ...tipo.fields,
          ];

    await cma("/content_types/ficha", {
        method: "PUT",
        headers: { "X-Contentful-Version": String(tipo.sys.version) },
        body: {
            name: tipo.name,
            description: tipo.description,
            displayField: campoTitulo,
            fields: campos,
        },
    });

    const actualizado = await cma("/content_types/ficha");
    await cma("/content_types/ficha/published", {
        method: "PUT",
        headers: { "X-Contentful-Version": String(actualizado.sys.version) },
    });
    await esperar("/content_types/ficha", (t) => t.sys.publishedVersion >= actualizado.sys.version);

    console.log(
        existente
            ? `✅ '${campoTitulo}' puesto como nombre de entrada`
            : "✅ Campo 'titulo' creado y puesto como nombre de entrada",
    );
    return campoTitulo;
}

function calcularTitulo(entrada, mapas) {
    const focus = entrada.fields?.focusType?.[LOCALE];
    const ref = entrada.fields?.referenceId?.[LOCALE];
    const etiqueta = ETIQUETAS[focus] || focus || "Ficha";
    const nombre = focus && ref != null ? mapas[focus]?.get(String(ref).trim()) : null;

    if (!nombre) return `${etiqueta} · sin identificar (${ref ?? "sin id"})`;
    return `${etiqueta} · ${nombre}`;
}

async function main() {
    exigirCredenciales();

    const campoTitulo = await asegurarCampoTitulo();

    const mapas = await cargarNombres();
    const entradas = await todasLasEntradas("ficha");
    console.log(`\n📋 ${entradas.length} fichas encontradas\n`);

    let cambiadas = 0;
    let sinIdentificar = 0;

    for (const entrada of entradas) {
        const titulo = calcularTitulo(entrada, mapas);
        const actual = entrada.fields?.[campoTitulo]?.[LOCALE];
        if (titulo.includes("sin identificar")) sinIdentificar++;
        if (actual === titulo) continue;

        cambiadas++;
        console.log(`${SECO ? "🔎" : "✏️ "} ${entrada.sys.id} → ${titulo}`);
        if (SECO) continue;

        const publicada = estaPublicada(entrada);
        const guardada = await cma(`/entries/${entrada.sys.id}`, {
            method: "PUT",
            headers: { "X-Contentful-Version": String(entrada.sys.version) },
            body: {
                fields: { ...entrada.fields, [campoTitulo]: { [LOCALE]: titulo } },
            },
        });

        if (publicada) {
            await cma(`/entries/${entrada.sys.id}/published`, {
                method: "PUT",
                headers: { "X-Contentful-Version": String(guardada.sys.version) },
            });
        }
        await new Promise((r) => setTimeout(r, 150));
    }

    console.log(`
${SECO ? "🔎 Simulación" : "✅ Listo"}: ${cambiadas} fichas ${SECO ? "cambiarían" : "actualizadas"}${
        sinIdentificar ? `\n⚠️  ${sinIdentificar} con referenceId que no existe en la base de datos` : ""
    }

Vuelve a lanzarlo cuando crees fichas nuevas:  npm run contentful:titulos
`);
}

main().catch((e) => {
    console.error("❌", e.message);
    process.exit(1);
});
