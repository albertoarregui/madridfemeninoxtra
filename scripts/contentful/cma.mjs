import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
export const LOCALE = "en-US";

export function loadEnv() {
    const file = path.join(ROOT, ".env.local");
    if (!fs.existsSync(file)) return {};
    return Object.fromEntries(
        fs
            .readFileSync(file, "utf8")
            .split("\n")
            .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
            .map((l) => {
                const i = l.indexOf("=");
                return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
            }),
    );
}

const env = loadEnv();
const SPACE = env.CONTENTFUL_SPACE_ID || process.env.CONTENTFUL_SPACE_ID;
const TOKEN = env.CONTENTFUL_MANAGEMENT_TOKEN || process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const ENVIRONMENT = env.CONTENTFUL_ENVIRONMENT || "master";

export { env, SPACE, ENVIRONMENT };

export function exigirCredenciales() {
    if (!SPACE || !TOKEN) {
        console.error(`
❌ Faltan credenciales.

Necesitas un token de gestión (Content Management API):
  1. Entra en https://app.contentful.com/account/profile/cma_tokens
  2. "Create personal access token"
  3. Añade la línea a .env.local:

     CONTENTFUL_MANAGEMENT_TOKEN=CFPAT-...
`);
        process.exit(1);
    }
}

export async function cma(ruta, { method = "GET", body, headers = {}, raw } = {}) {
    const base = `https://api.contentful.com/spaces/${SPACE}/environments/${ENVIRONMENT}`;
    const url = ruta.startsWith("http") ? ruta : `${base}${ruta}`;

    const res = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            ...(raw ? {} : { "Content-Type": "application/vnd.contentful.management.v1+json" }),
            ...headers,
        },
        body: raw ?? (body ? JSON.stringify(body) : undefined),
        duplex: raw ? "half" : undefined,
    });

    if (res.status === 204) return null;

    const texto = await res.text();
    const datos = texto ? JSON.parse(texto) : null;

    if (!res.ok) {
        const detalle = datos?.details ? ` ${JSON.stringify(datos.details)}` : "";
        throw new Error(`${method} ${url} → ${res.status} ${datos?.message || texto}${detalle}`);
    }
    return datos;
}

export async function subirBinario(buffer) {
    const res = await fetch(`https://upload.contentful.com/spaces/${SPACE}/uploads`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/octet-stream",
        },
        body: buffer,
    });
    if (!res.ok) throw new Error(`Subida fallida: ${res.status} ${await res.text()}`);
    return res.json();
}

export async function esperar(ruta, condicion, { intentos = 30, espera = 1000 } = {}) {
    for (let i = 0; i < intentos; i++) {
        const datos = await cma(ruta);
        if (condicion(datos)) return datos;
        await new Promise((r) => setTimeout(r, espera));
    }
    throw new Error(`Tiempo de espera agotado en ${ruta}`);
}

export async function todasLasEntradas(contentType) {
    const items = [];
    let skip = 0;
    while (true) {
        const pagina = await cma(
            `/entries?content_type=${contentType}&limit=100&skip=${skip}&order=sys.createdAt`,
        );
        items.push(...pagina.items);
        skip += 100;
        if (skip >= pagina.total) break;
    }
    return items;
}

export function estaPublicada(entrada) {
    const publicada = entrada.sys.publishedVersion;
    return Boolean(publicada) && entrada.sys.version <= publicada + 1;
}
