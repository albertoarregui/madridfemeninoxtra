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

if (!databaseUrl || !databaseToken) throw new Error('Faltan credenciales de Turso.');
if (!accountId || !apiToken) throw new Error('Faltan CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN.');

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
WITH season_photos AS (
    SELECT
        d.id_jugadora,
        t.temporada,
        d.id_categoria,
        COALESCE(
            NULLIF(TRIM(d.foto_perfil_url), ''),
            NULLIF(TRIM(d.foto_url), '')
        ) AS foto_url,
        ROW_NUMBER() OVER (
            PARTITION BY d.id_jugadora, t.temporada, d.id_categoria
            ORDER BY
                CASE WHEN NULLIF(TRIM(d.foto_perfil_url), '') IS NOT NULL THEN 0 ELSE 1 END,
                d.id_dorsal DESC
        ) AS rn_categoria,
        ROW_NUMBER() OVER (
            PARTITION BY d.id_jugadora, t.temporada
            ORDER BY
                CASE WHEN d.id_categoria = 4 THEN 0 ELSE 1 END,
                CASE WHEN NULLIF(TRIM(d.foto_perfil_url), '') IS NOT NULL THEN 0 ELSE 1 END,
                d.id_dorsal DESC
        ) AS rn_temporada
    FROM dorsales d
    JOIN temporadas t ON t.id_temporada = d.id_temporada
    WHERE COALESCE(
        NULLIF(TRIM(d.foto_perfil_url), ''),
        NULLIF(TRIM(d.foto_url), '')
    ) IS NOT NULL
),
latest_player_photo AS (
    SELECT id_jugadora, foto_url
    FROM (
        SELECT
            id_jugadora,
            foto_url,
            ROW_NUMBER() OVER (
                PARTITION BY id_jugadora
                ORDER BY temporada DESC, rn_temporada ASC
            ) AS rn
        FROM season_photos
        WHERE rn_temporada = 1
    )
    WHERE rn = 1
),
official_debuts AS (
    SELECT
        a.id_jugadora,
        MIN(p.fecha) AS fecha_debut_oficial
    FROM alineaciones a
    JOIN partidos p ON p.id_partido = a.id_partido
    JOIN competiciones c ON c.id_competicion = p.id_competicion
    WHERE
        (a.titular = 1 OR COALESCE(a.minutos_jugados, 0) > 0 OR a.minuto_entrada IS NOT NULL)
        AND c.competicion IN ('Liga F', 'Primera Iberdrola', 'UWCL', 'Copa de la Reina', 'Supercopa de España')
    GROUP BY a.id_jugadora
),
first_team_status AS (
    SELECT
        j.id_jugadora,
        MAX(CASE WHEN d.id_categoria = 4 THEN 1 ELSE 0 END) AS permanently_promoted,
        CASE
            WHEN MAX(CASE WHEN NULLIF(TRIM(d.fecha_debut), '') IS NOT NULL THEN 1 ELSE 0 END) = 1
              OR od.id_jugadora IS NOT NULL
            THEN 1 ELSE 0
        END AS debuted,
        COALESCE(
            MIN(CASE WHEN NULLIF(TRIM(d.fecha_debut), '') IS NOT NULL THEN d.fecha_debut END),
            od.fecha_debut_oficial
        ) AS debut_date
    FROM jugadoras j
    LEFT JOIN dorsales d ON d.id_jugadora = j.id_jugadora
    LEFT JOIN official_debuts od ON od.id_jugadora = j.id_jugadora
    GROUP BY j.id_jugadora, od.id_jugadora, od.fecha_debut_oficial
)
SELECT
    fj.id_fabrica_jugadora,
    fj.nombre,
    fj.slug,
    fj.posicion AS posicion_base,
    COALESCE(NULLIF(TRIM(fj.portrait_url), ''), latest.foto_url) AS portrait_url,
    fj.portrait_source_url,
    fj.id_jugadora,
    j.nombre AS nombre_primer_equipo,
    COALESCE(fts.permanently_promoted, 0) AS permanently_promoted,
    COALESCE(fts.debuted, 0) AS debuted,
    fts.debut_date,
    fp.temporada,
    fp.equipo,
    fp.posicion,
    fp.dorsal,
    fp.vinculo,
    fp.confianza,
    COALESCE(
        NULLIF(TRIM(fp.foto_url), ''),
        team_photo.foto_url,
        season_photo.foto_url,
        NULLIF(TRIM(fj.portrait_url), ''),
        latest.foto_url
    ) AS roster_photo_url,
    CASE
        WHEN NULLIF(TRIM(fp.foto_url), '') IS NOT NULL
          OR team_photo.foto_url IS NOT NULL
          OR season_photo.foto_url IS NOT NULL
        THEN 1 ELSE 0
    END AS season_photo_specific
FROM fabrica_plantillas fp
JOIN fabrica_jugadoras fj
    ON fj.id_fabrica_jugadora = fp.id_fabrica_jugadora
LEFT JOIN jugadoras j
    ON j.id_jugadora = fj.id_jugadora
LEFT JOIN latest_player_photo latest
    ON latest.id_jugadora = fj.id_jugadora
LEFT JOIN first_team_status fts
    ON fts.id_jugadora = fj.id_jugadora
LEFT JOIN season_photos team_photo
    ON team_photo.id_jugadora = fj.id_jugadora
   AND team_photo.temporada = fp.temporada
   AND team_photo.id_categoria = CASE fp.equipo
        WHEN 'Real Madrid B' THEN 3
        WHEN 'Juvenil' THEN 2
        WHEN 'Cadete' THEN 1
        ELSE -1
   END
   AND team_photo.rn_categoria = 1
LEFT JOIN season_photos season_photo
    ON season_photo.id_jugadora = fj.id_jugadora
   AND season_photo.temporada = fp.temporada
   AND season_photo.rn_temporada = 1
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
    // Una única consulta reconstruye toda la caché. La web nunca consulta Turso en runtime.
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
                seasonPhotos: {},
                firstTeamPlayerId: row.id_jugadora == null ? null : Number(row.id_jugadora),
                firstTeamStatus: Number(row.permanently_promoted) === 1
                    ? 'permanent'
                    : Number(row.debuted) === 1
                        ? 'debut'
                        : null,
                debutDate: row.debut_date ? String(row.debut_date) : null,
                profileUrl,
                hasFirstTeamPage,
            };
        }

        const season = String(row.temporada);
        seasonSet.add(season);

        if (Number(row.season_photo_specific) === 1 && row.roster_photo_url) {
            players[academySlug].seasonPhotos[season] = String(row.roster_photo_url);
        }

        rosters.push({
            season,
            team: String(row.equipo),
            playerId: Number(row.id_fabrica_jugadora),
            slug: academySlug,
            name: String(row.nombre),
            position: row.posicion ? String(row.posicion) : players[academySlug].position,
            number: row.dorsal == null ? null : String(row.dorsal),
            membership: String(row.vinculo || 'Plantilla nominal'),
            photoUrl: row.roster_photo_url ? String(row.roster_photo_url) : players[academySlug].portraitUrl,
            photoIsSeasonSpecific: Number(row.season_photo_specific) === 1,
            profileUrl,
            hasFirstTeamPage,
            firstTeamStatus: players[academySlug].firstTeamStatus,
            debutDate: players[academySlug].debutDate,
            confidence: String(row.confianza || 'Alta'),
        });
    }

    const seasons = [...seasonSet].sort().reverse();
    const latestSeason = seasons[0];

    // Los portraits oficiales importados de la temporada actual también cuentan como foto de esa temporada.
    for (const player of Object.values(players)) {
        if (latestSeason && player.portraitUrl && !player.seasonPhotos[latestSeason]) {
            const hasLatestRoster = rosters.some((row) => row.slug === player.slug && row.season === latestSeason);
            if (hasLatestRoster) player.seasonPhotos[latestSeason] = player.portraitUrl;
        }
    }

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
        headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: payload,
    });
    if (!response.ok) throw new Error(`Cloudflare R2 respondió ${response.status}: ${await response.text()}`);

    const purgeResponse = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: [publicCacheUrl] }),
        },
    );
    if (!purgeResponse.ok) {
        console.warn(`La caché de R2 se actualizó, pero no se pudo purgar CDN (${purgeResponse.status}).`);
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
