import type { ImageMetadata } from 'astro';

// Import assets
const playerImages = import.meta.glob<{ default: ImageMetadata }>('/src/assets/jugadoras/*.{png,jpg,jpeg,webp}');
const competitionLogos = import.meta.glob<{ default: ImageMetadata }>('/src/assets/competiciones/*.{png,jpg,jpeg,webp}');

const slugify = (text: string): string => {
    return text.toLowerCase().replace(/ /g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export async function getPlayerImage(id: string): Promise<string> {
    const path = `/src/assets/jugadoras/${id}.png`;
    const imageLoader = playerImages[path];
    if (imageLoader) {
        const mod = await imageLoader();
        return mod.default.src;
    }
    return '/assets/img/default-player.png';
}

export async function getShield(teamName: string): Promise<string> {
    const slug = slugify(teamName);
    // Since images are now in public/assets/escudos, we return the direct path
    return `/assets/escudos/${slug}.png`;
}

export async function getCompetitionLogo(compName: string): Promise<string> {
    const slug = slugify(compName);
    let path = `/src/assets/competiciones/${slug}.png`;

    if (slug.includes('liga')) {
        path = '/src/assets/competiciones/liga_f.png';
    } else if (slug.includes('uwcl') || slug.includes('champions')) {
        path = '/src/assets/competiciones/uwcl.png';
    } else if (slug.includes('copa')) {
        path = '/src/assets/competiciones/copa_de_la_reina.png';
    } else if (slug.includes('supercopa')) {
        path = '/src/assets/competiciones/supercopa_de_espana.png';
    }

    const loader = competitionLogos[path];
    if (loader) {
        const mod = await loader();
        return mod.default.src;
    }
    return '';
}
