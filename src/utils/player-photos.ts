import { fetchPlayersDirectly, getPlayerImageUrl } from "./players";

export async function fetchPlayerPhotoMap(): Promise<Record<string, string>> {
    const players = await fetchPlayersDirectly();
    return Object.fromEntries(players.map((player: any) => {
        const seasons = Object.keys(player.season_photos || {}).sort().reverse();
        const photo = seasons.map((s) => player.season_photos?.[s]).find(Boolean);
        const url = photo
            ? getPlayerImageUrl({ ...player, foto_url: photo, foto_perfil_url: undefined })
            : getPlayerImageUrl({ ...player, foto_url: player.foto_url || player.nombre, foto_perfil_url: undefined });
        return [player.slug, url];
    }));
}
