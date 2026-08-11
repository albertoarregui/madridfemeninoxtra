#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const BUCKET = "realmadridfem-database";
const PREFIX = "galerias";
const CDN = "https://media.madridfemeninoxtra.com";
const UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const TAIL_BYTES = 48000;
const CONCURRENCY = 24;

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const overrides = JSON.parse(
    fs.readFileSync(path.join(ROOT, "scripts/galerias/overrides.json"), "utf8"),
);

function loadEnv() {
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

function slugify(text) {
    if (!text) return "desconocida";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/ø/g, "o")
        .replace(/Ø/g, "O")
        .replace(/ö/g, "o")
        .replace(/Ö/g, "O")
        .replace(/ß/g, "ss")
        .replace(/ẞ/g, "SS")
        .replace(/\s+/g, "-")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
}

const SIGLAS = ["rcd", "fc", "sd", "cd", "ud", "cf", "ca", "rc", "ea"];
function galleryTitleish(seg) {
    const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
    return seg
        .split("-")
        .map((w) => {
            if (w.length <= 2) return w.toUpperCase();
            const s = SIGLAS.find((s) => w.startsWith(s) && w.length > s.length + 2);
            return s ? `${s.toUpperCase()} ${cap(w.slice(s.length))}` : cap(w);
        })
        .join(" ");
}

const rclone = (args) =>
    execFileSync("rclone", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

function listGalleries() {
    const out = rclone(["lsf", "-R", "--dirs-only", `r2:${BUCKET}/${PREFIX}`]);
    const dirs = out.split("\n").map((d) => d.replace(/\/$/, "")).filter(Boolean);
    return dirs.filter((d) => !dirs.some((o) => o !== d && o.startsWith(d + "/")));
}

function listPhotos(route) {
    const out = rclone(["lsf", `r2:${BUCKET}/${PREFIX}/${route}`]);
    return out
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}

async function fetchTail(url) {
    const res = await fetch(url, {
        headers: { Range: `bytes=-${TAIL_BYTES}`, "User-Agent": UA },
    });
    if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}

function parseXmp(buf) {
    const i = buf.indexOf("XMP ");
    if (i === -1) return null;
    const xmp = buf.slice(i).toString("utf8");

    const names = new Set();
    const faces = {};

    for (const m of xmp.matchAll(/mwg-rs:Name="([^"]+)"[^>]*mwg-rs:Type="Face"/g)) {
        names.add(m[1]);
    }
    for (const m of xmp.matchAll(
        /mwg-rs:Name="([^"]+)"[\s\S]{0,400}?stArea:x="([\d.]+)"\s+stArea:y="([\d.]+)"\s+stArea:w="([\d.]+)"\s+stArea:h="([\d.]+)"/g,
    )) {
        names.add(m[1]);
        faces[m[1]] = [+m[2], +m[3], +m[4], +m[5]].map((n) => +n.toFixed(4));
    }

    const subj = xmp.match(/<dc:subject>[\s\S]*?<\/dc:subject>/);
    if (subj) for (const m of subj[0].matchAll(/<rdf:li>([^<]+)<\/rdf:li>/g)) names.add(m[1].trim());
    for (const m of xmp.matchAll(/<rdf:li>People[|/]([^<]+)<\/rdf:li>/g)) names.add(m[1].trim());

    const rating = xmp.match(/xmp:Rating="(\d+)"/);
    const date = xmp.match(/(?:exif:DateTimeOriginal|xmp:CreateDate)="([^"]+)"/);

    return {
        names: [...names],
        faces,
        rating: rating ? +rating[1] : null,
        date: date ? date[1] : null,
    };
}

async function mapLimit(items, limit, fn) {
    const out = new Array(items.length);
    let idx = 0;
    await Promise.all(
        Array.from({ length: Math.min(limit, items.length) }, async () => {
            while (idx < items.length) {
                const i = idx++;
                out[i] = await fn(items[i], i);
            }
        }),
    );
    return out;
}

function uploadJson(obj, destPath) {
    const tmp = path.join(os.tmpdir(), `mfx-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    fs.writeFileSync(tmp, JSON.stringify(obj));
    rclone([
        "copyto",
        tmp,
        `r2:${BUCKET}/${destPath}`,
        "--s3-no-check-bucket",
        "--header-upload",
        "Content-Type: application/json",
    ]);
    fs.unlinkSync(tmp);
}

async function main() {
    const args = process.argv.slice(2);
    const only = args.filter((a) => !a.startsWith("-"));
    const dryRun = args.includes("--dry-run");

    const env = loadEnv();
    const db = createClient({
        url: env.TURSO_DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN,
    });
    const { rows } = await db.execute("SELECT id_jugadora, nombre FROM jugadoras");
    const bySlug = new Map(rows.map((r) => [slugify(r.nombre), r]));

    const partidosInfo = new Map();
    const { rows: pr } = await db.execute(`
        SELECT p.id_partido, t.temporada, c.competicion
        FROM partidos p
        LEFT JOIN temporadas t ON p.id_temporada = t.id_temporada
        LEFT JOIN competiciones c ON p.id_competicion = c.id_competicion
    `);
    for (const r of pr) {
        partidosInfo.set(r.id_partido, {
            temporada: r.temporada || null,
            competicion: r.competicion || null,
        });
    }

    const aliasBySlug = new Map(
        Object.entries(overrides.alias).map(([from, to]) => [slugify(from), slugify(to)]),
    );
    const ignorar = new Set(Object.values(overrides.ignorar).map((n) => slugify(n)));

    const resolve = (raw) => {
        let s = slugify(raw);
        if (aliasBySlug.has(s)) s = aliasBySlug.get(s);
        if (ignorar.has(s)) return null;
        return bySlug.has(s) ? s : { unresolved: raw };
    };

    const galleries = (only.length ? only : listGalleries()).filter(Boolean);
    console.log(`Galerías a indexar: ${galleries.length}\n`);

    const globalEntries = [];
    const perPlayer = new Map();
    const unresolvedAll = new Map();

    for (const route of galleries) {
        const files = listPhotos(route);
        if (!files.length) {
            console.log(`· ${route} — sin fotos, saltada`);
            continue;
        }
        process.stdout.write(`· ${route} (${files.length} fotos) `);

        const base = `${CDN}/${PREFIX}/${route}/`;
        const metas = await mapLimit(files, CONCURRENCY, async (f) => {
            try {
                return parseXmp(await fetchTail(base + encodeURIComponent(f)));
            } catch {
                return null;
            }
        });

        const photos = [];
        const players = {};
        let fecha = null;

        files.forEach((f, i) => {
            const m = metas[i];
            const slugs = [];
            const faces = {};
            if (m) {
                if (!fecha && m.date) fecha = m.date;
                for (const raw of m.names) {
                    const r = resolve(raw);
                    if (r === null) continue;
                    if (typeof r === "object") {
                        unresolvedAll.set(raw, (unresolvedAll.get(raw) || 0) + 1);
                        continue;
                    }
                    if (!slugs.includes(r)) slugs.push(r);
                    if (m.faces[raw]) faces[r] = m.faces[raw];
                }
            }
            const entry = { f, p: slugs };
            if (m?.rating) entry.r = m.rating;
            if (Object.keys(faces).length) entry.faces = faces;
            const idx = photos.push(entry) - 1;
            for (const s of slugs) (players[s] ||= []).push(idx);
        });

        const idMatch = route.split("/").pop().match(/^(\d+)-/);
        const idPartido = idMatch ? +idMatch[1] : null;

        const info = idPartido ? partidosInfo.get(idPartido) : null;
        const segs = route.split("/");
        const temporada =
            info?.temporada || (/^\d{4}-\d{2}$/.test(segs[0]) ? segs[0].replace("-", "/") : null);
        const competicion =
            info?.competicion ||
            (segs.length >= 3 && segs[1] === "partidos" ? galleryTitleish(segs[2]) : null) ||
            (segs.some((s) => s === "entrenamientos") ? "Entrenamiento" : null);

        const galleryIndex = {
            route,
            idPartido,
            count: photos.length,
            fecha,
            temporada,
            competicion,
            generatedAt: new Date().toISOString(),
            photos,
            players,
        };

        if (!dryRun) uploadJson(galleryIndex, `${PREFIX}/${route}/_index.json`);

        globalEntries.push({
            route,
            idPartido,
            count: photos.length,
            fecha,
            temporada,
            competicion,
            cover: photos[0]?.f ?? null,
            players: Object.fromEntries(
                Object.entries(players).map(([s, arr]) => [s, arr.length]),
            ),
        });

        for (const [slug, idxs] of Object.entries(players)) {
            const list = perPlayer.get(slug) || [];
            for (const i of idxs) {
                list.push({
                    route,
                    f: photos[i].f,
                    r: photos[i].r ?? null,
                    face: photos[i].faces?.[slug] ?? null,
                    fecha,
                    idPartido,
                    temporada,
                    competicion,
                });
            }
            perPlayer.set(slug, list);
        }

        const conJugadora = photos.filter((p) => p.p.length).length;
        console.log(`→ ${conJugadora} con jugadoras, ${Object.keys(players).length} distintas`);
    }

    if (!dryRun) {
        for (const [slug, list] of perPlayer) {
            list.sort((a, b) => (b.r ?? 0) - (a.r ?? 0) || a.f.localeCompare(b.f, "es", { numeric: true }));
            uploadJson({ slug, total: list.length, photos: list }, `${PREFIX}/_players/${slug}.json`);
        }
        globalEntries.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
        uploadJson(
            { generatedAt: new Date().toISOString(), galleries: globalEntries },
            `${PREFIX}/_index.json`,
        );
    }

    console.log(`\n✅ ${globalEntries.length} galerías · ${perPlayer.size} jugadoras indexadas`);
    if (unresolvedAll.size) {
        console.log(`\n⚠️  Nombres NO reconocidos (añádelos a scripts/galerias/overrides.json):`);
        for (const [n, c] of [...unresolvedAll].sort((a, b) => b[1] - a[1])) {
            console.log(`   ${String(c).padStart(4)}×  ${n}`);
        }
    }
    if (dryRun) console.log("\n(dry-run: no se ha subido nada)");
}

main().catch((e) => {
    console.error("\n❌ Error:", e.message);
    process.exit(1);
});
