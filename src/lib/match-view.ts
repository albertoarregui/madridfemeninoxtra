// Ayudas de presentación compartidas por la ficha de partido y sus fragmentos.
import { getAssetUrl } from '../utils/assets';
import { slugify } from '../utils/partidos';

export function matchShieldSrc(teamName: string | null | undefined, remoteUrl?: string | null | undefined): string {
    if (
        remoteUrl &&
        typeof remoteUrl === 'string' &&
        (remoteUrl.startsWith('http://') || remoteUrl.startsWith('https://'))
    ) {
        return remoteUrl;
    }
    return getAssetUrl('escudos', teamName || 'placeholder');
}

export function matchPlayerHref(player: { name?: string; slug?: string } | string | null | undefined): string | null {
    const name = typeof player === 'string' ? player : player?.name;
    const playerSlug = typeof player === 'string' ? slugify(player) : (player?.slug || slugify(name || ''));
    return playerSlug && playerSlug !== '#' ? `/jugadoras/${playerSlug}` : null;
}

export function matchRatingsUrl(game: { id_partido?: unknown; club_local?: unknown; club_visitante?: unknown; fecha?: unknown }): string {
    const ratingSlug = `${game.club_local}-vs-${game.club_visitante}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `/valoraciones/${game.id_partido}-${ratingSlug}-${String(game.fecha ?? '').slice(0, 10)}`;
}
