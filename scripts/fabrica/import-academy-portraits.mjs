import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.TURSO_STATS_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const databaseToken = process.env.TURSO_STATS_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const bucket = process.env.CLOUDFLARE_R2_BUCKET || 'realmadridfem-database';
const mediaDomain = process.env.CLOUDFLARE_IMAGES_DOMAIN || 'media.madridfemeninoxtra.com';

if (!databaseUrl || !databaseToken) throw new Error('Faltan credenciales de Turso.');
if (!accountId || !apiToken) throw new Error('Faltan credenciales de Cloudflare.');

const client = createClient({ url: databaseUrl, authToken: databaseToken });

const slugify = (text) => String(text || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function extractPortraitAsset(html) {
    const decoded = html
        .replace(/\\u002F/g, '/')
        .replace(/\\u0026/g, '&')
        .replace(/&amp;/g, '&');

    const matches = decoded.match(
        /https:\/\/assets\.realmadrid\.com\/is\/image\/realmadrid\/[A-Za-z0-9_\-]+/g,
    );

    if (!matches?.length) return null;

    // En las fichas de jugadora el primer recurso individual de assets.realmadrid.com
    // es el portrait principal. Se devuelve sin parámetros para poder pedir tamaño/formato.
    return [...new Set(matches)][0];
}

async function fetchPortrait(profileUrl) {
    const profileResponse = await fetch(profileUrl, {
        headers: {
            'User-Agent': 'MadridFemeninoXtra/1.0 (+https://www.madridfemeninoxtra.com)',
            'Accept-Language': 'es-ES,es;q=0.9',
        },
    });

    if (!profileResponse.ok) {
        throw new Error(`Ficha HTTP ${profileResponse.status}`);
    }

    const html = await profileResponse.text();
    const baseAsset = extractPortraitAsset(html);

    if (!baseAsset) {
        throw new Error('No se encontró el portrait oficial en la ficha');
    }

    // Adobe Dynamic Media admite conversión bajo demanda. Intentamos WebP
    // y, si no lo devuelve realmente como WebP, usamos el formato original.
    const webpUrl = `${baseAsset}?fmt=webp&fit=wrap&wid=840`;
    let imageResponse = await fetch(webpUrl);
    let contentType = (imageResponse.headers.get('content-type') || '').split(';')[0].toLowerCase();

    if (!imageResponse.ok || !contentType.startsWith('image/')) {
        imageResponse = await fetch(`${baseAsset}?fit=wrap&wid=840`);
        contentType = (imageResponse.headers.get('content-type') || '').split(';')[0].toLowerCase();
    }

    if (!imageResponse.ok || !contentType.startsWith('image/')) {
        throw new Error(`Portrait HTTP ${imageResponse.status}`);
    }

    const bytes = new Uint8Array(await imageResponse.arrayBuffer());
    const extension =
        contentType === 'image/webp' ? 'webp'
        : contentType === 'image/png' ? 'png'
        : contentType === 'image/avif' ? 'avif'
        : 'jpg';

    return { bytes, contentType, extension, sourceAssetUrl: baseAsset };
}

async function uploadToR2(key, bytes, contentType) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${key}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': contentType,
        },
        body: bytes,
    });

    if (!response.ok) {
        throw new Error(`R2 HTTP ${response.status}: ${await response.text()}`);
    }

    return `https://${mediaDomain}/${key}`;
}

async function main() {
    // Una sola lectura: solo jugadoras con presencia en 2026/27 y sin portrait propio.
    const result = await client.execute(`
        SELECT DISTINCT
            fj.id_fabrica_jugadora,
            fj.nombre,
            fj.slug,
            fj.portrait_source_url
        FROM fabrica_jugadoras fj
        JOIN fabrica_plantillas fp
          ON fp.id_fabrica_jugadora = fj.id_fabrica_jugadora
        WHERE fp.temporada = '2026/27'
          AND NULLIF(TRIM(fj.portrait_url), '') IS NULL
          AND fj.portrait_source_url LIKE 'https://www.realmadrid.com/%'
        ORDER BY fj.nombre
    `);

    const pending = result.rows.map((row) => ({
        id: Number(row.id_fabrica_jugadora),
        name: String(row.nombre),
        slug: String(row.slug),
        profileUrl: String(row.portrait_source_url),
    }));

    console.log(`Portraits pendientes 2026/27: ${pending.length}`);

    const updates = [];
    const failures = [];

    for (const player of pending) {
        try {
            const portrait = await fetchPortrait(player.profileUrl);
            const filename = `${slugify(player.name)}.${portrait.extension}`;
            const key = `la-fabrica/jugadoras/2026-27/${filename}`;
            const publicUrl = await uploadToR2(
                key,
                portrait.bytes,
                portrait.contentType,
            );

            updates.push({
                id: player.id,
                publicUrl,
            });

            console.log(`✓ ${player.name} -> ${publicUrl}`);
        } catch (error) {
            failures.push({
                id: player.id,
                name: player.name,
                reason: error instanceof Error ? error.message : String(error),
            });
            console.warn(`✗ ${player.name}: ${failures.at(-1).reason}`);
        }
    }

    // Escrituras solo para las que han subido correctamente; se agrupan en una transacción.
    if (updates.length) {
        await client.batch(
            updates.map((item) => ({
                sql: `
                    UPDATE fabrica_jugadoras
                    SET portrait_url = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id_fabrica_jugadora = ?
                `,
                args: [item.publicUrl, item.id],
            })),
            'write',
        );
    }

    console.log(
        `Completado: ${updates.length} portraits subidos, ${failures.length} pendientes.`,
    );

    if (failures.length) {
        console.log(JSON.stringify(failures, null, 2));
    }
}

main()
    .finally(() => client.close())
    .catch((error) => {
        console.error('ERROR:', error);
        process.exitCode = 1;
    });
