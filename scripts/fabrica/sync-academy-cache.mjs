import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const env = (key) => process.env[key];

const databaseUrl = env('TURSO_STATS_DATABASE_URL') || env('TURSO_DATABASE_URL');
const databaseToken = env('TURSO_STATS_AUTH_TOKEN') || env('TURSO_AUTH_TOKEN');
const accountId = env('CLOUDFLARE_ACCOUNT_ID');
const apiToken = env('CLOUDFLARE_API_TOKEN');
const bucket = env('CLOUDFLARE_R2_BUCKET') || 'realmadridfem-database';
const objectKey = 'data/la-fabrica/academy.json';
const zoneId = env('CLOUDFLARE_ZONE_ID') || '2b76fb725b13b447aa89c146f80fa059';
const publicCacheUrl = `https://${env('CLOUDFLARE_IMAGES_DOMAIN') || 'media.madridfemeninoxtra.com'}/${objectKey}`;

if (!databaseUrl || !databaseToken) {
    throw new Error('Faltan credenciales de Turso.');
}
if (!accountId || !apiToken) {
    throw new Error('Faltan CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN.');
}

const client = createClient({ url: databaseUrl, authToken: databaseToken });

const slugify = (text) => String(text || '')
    .toLowerCase()
    .trim()
    .replace(/ø/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');

const query = `
WITH latest_player_photo AS (
    SELECT id_jugadora, foto_url
    FROM (
        SELECT
            d.id_jugadora,
            COALESCE(
                NULLIF(TRIM(d.foto_perfil_url), ''),
                NULLIF(TRIM(d.foto_url), '')
            ) AS foto_url,
            ROW_NUMBER() OVER (
                PARTITION BY d.id_jugadora
                ORDER BY
                    t.temporada DESC,
                    CASE WHEN NULLIF(TRIM(d.foto_perfil_url), '') IS NOT NULL THEN 0 ELSE 1 END,
                    d.id_dorsal DESC
            ) AS rn
        FROM dorsales d
        JOIN temporadas t ON t.id_temporada = d.id_temporada
        WHERE COALESCE(
            NULLIF(TRIM(d.foto_perfil_url), ''),
            NULLIF(TRIM(d.foto_url), '')
        ) IS NOT NULL
    )
    WHERE rn = 1
),
first_team_status AS (
    SELECT
        d.id_jugadora,
        MAX(CASE WHEN d.id_categoria = 4 THEN 1 ELSE 0 END) AS permanently_promoted,
        MAX(CASE WHEN NULLIF(TRIM(d.fecha_debut), '') IS NOT NULL THEN 1 ELSE 0 END) AS debuted
    FROM dorsales d
    GROUP BY d.id_jugadora
)
SELECT
    fj.id_fabrica_jugadora,
    fj.nombre,
    fj.slug,
    fj.posicion AS posicion_base,
    COALESCE(NULLIF(TRIM(fj.portrait_url), ''), ph.foto_url) AS portrait_url,
    fj.portrait_source_url,
    fj.id_jugadora,
    j.nombre AS nombre_primer_equipo,
    COALESCE(fts.permanently_promoted, 0) AS permanently_promoted,
    COALESCE(fts.debuted, 0) AS debuted,
    fp.temporada,
    fp.equipo,
    fp.posicion,
    fp.dorsal,
    fp.vinculo,
    fp.confianza
FROM fabrica_plantillas fp
JOIN fabrica_jugadoras fj
    ON fj.id_fabrica_jugadora = fp.id_fabrica_jugadora
LEFT JOIN jugadoras j
    ON j.id_jugadora = fj.id_jugadora
LEFT JOIN latest_player_photo ph
    ON ph.id_jugadora = fj.id_jugadora
LEFT JOIN first_team_status fts
    ON fts.id_jugadora = fj.id_jugadora
ORDER BY
    fp.temporada DESC,
    CASE fp.equipo
        WHEN 'Real Madrid B' THEN 1
        WHEN 'Juvenil' THEN 2
        WHEN 'Cadete' THEN 3
        ELSE 4
    END,
    fj.nombre ASC
`;

async function main() {
    // Una sola lectura de Turso para reconstruir todo el archivo público.
    const result = await client.execute(query);
    const rows = result.rows.map((row) => Object.fromEntries(
        result.columns.map((column) => [column, row[column]]),
    ));

    const players = {};
    const rosters = [];
    const seasonSet = new Set();

    for (const row of rows) {
        const academySlug = String(row.slug);
        const firstTeamName = row.nombre_primer_equipo ? String(row.nombre_primer_equipo) : null;
        const hasFirstTeamPage = row.id_jugadora != null && Boolean(firstTeamName);
        const profileUrl = hasFirstTeamPage
            ? `/jugadoras/${slugify(firstTeamName)}`
            : `/la-fabrica/jugadoras/${academySlug}`;

        if (!players[academySlug]) {
            players[academySlug] = {
                id: Number(row.id_fabrica_jugadora),
                name: String(row.nombre),
                slug: academySlug,
                position: row.posicion_base ? String(row.posicion_base) : null,
                portraitUrl: row.portrait_url ? String(row.portrait_url) : null,
                portraitSourceUrl: row.portrait_source_url ? String(row.portrait_source_url) : null,
                firstTeamPlayerId: row.id_jugadora == null ? null : Number(row.id_jugadora),
                firstTeamStatus: Number(row.permanently_promoted) === 1
                    ? 'permanent'
                    : Number(row.debuted) === 1
                        ? 'debut'
                        : null,
                profileUrl,
                hasFirstTeamPage,
            };
        }

        seasonSet.add(String(row.temporada));
        rosters.push({
            season: String(row.temporada),
            team: String(row.equipo),
            playerId: Number(row.id_fabrica_jugadora),
            slug: academySlug,
            name: String(row.nombre),
            position: row.posicion ? String(row.posicion) : players[academySlug].position,
            number: row.dorsal == null ? null : String(row.dorsal),
            membership: String(row.vinculo || 'Plantilla nominal'),
            photoUrl: players[academySlug].portraitUrl,
            profileUrl,
            hasFirstTeamPage,
            firstTeamStatus: players[academySlug].firstTeamStatus,
            confidence: String(row.confianza || 'Alta'),
        });
    }

    const seasons = [...seasonSet].sort().reverse();
    const payload = JSON.stringify({
        version: new Date().toISOString(),
        teams: ['Real Madrid B', 'Juvenil', 'Cadete'],
        seasons,
        players,
        rosters,
    });

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${objectKey}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: payload,
    });

    if (!response.ok) {
        throw new Error(`Cloudflare R2 respondió ${response.status}: ${await response.text()}`);
    }

    const purgeResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ files: [publicCacheUrl] }),
        },
    );

    if (!purgeResponse.ok) {
        console.warn(
            `La caché de R2 se actualizó, pero no se pudo purgar CDN (${purgeResponse.status}).`,
        );
    }

    console.log(
        `La Fábrica cache actualizada: ${Object.keys(players).length} jugadoras, ${rosters.length} relaciones, ${Buffer.byteLength(payload)} bytes.`,
    );
}

main()
    .finally(() => client.close())
    .catch((error) => {
        console.error('ERROR:', error);
        process.exitCode = 1;
    });
