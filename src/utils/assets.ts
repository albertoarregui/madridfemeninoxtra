
import type { ImageMetadata } from "astro";

const assets = {
    jugadoras: import.meta.glob<{ default: ImageMetadata }>("/src/assets/jugadoras/*.{png,jpg,jpeg,webp}", { eager: true }),
    jugadorasPerfil: import.meta.glob<{ default: ImageMetadata }>("/src/assets/jugadoras-perfil/*.{png,jpg,jpeg,webp}", { eager: true }),
    escudos: import.meta.glob<{ default: ImageMetadata }>("/src/assets/escudos/*.{png,jpg,jpeg,webp,svg}", { eager: true }),
    banderas: import.meta.glob<{ default: ImageMetadata }>("/src/assets/banderas/*.{png,jpg,jpeg,webp,svg}", { eager: true }),
    estadios: import.meta.glob<{ default: ImageMetadata }>("/src/assets/estadios/*.{png,jpg,jpeg,webp}", { eager: true }),
    entrenadores: import.meta.glob<{ default: ImageMetadata }>("/src/assets/entrenadores/*.{png,jpg,jpeg,webp}", { eager: true }),
    competiciones: import.meta.glob<{ default: ImageMetadata }>("/src/assets/competiciones/*.{png,jpg,jpeg,webp,svg}", { eager: true }),
    sidebar: import.meta.glob<{ default: ImageMetadata }>("/src/assets/sidebar/*.{png,jpg,jpeg,webp,svg}", { eager: true }),
    premios: import.meta.glob<{ default: ImageMetadata }>("/src/assets/awards/*.{png,jpg,jpeg,webp}", { eager: true }),
    intro: import.meta.glob<{ default: ImageMetadata }>("/src/assets/intro/*.{png,jpg,jpeg,webp}", { eager: true }),
    background: import.meta.glob<{ default: ImageMetadata }>("/src/assets/background/*.{png,jpg,jpeg,webp}", { eager: true }),
    galeria: import.meta.glob<{ default: ImageMetadata }>("/src/assets/galeria/*.{png,jpg,jpeg,webp}", { eager: true }),
    redes: import.meta.glob<{ default: ImageMetadata }>("/src/assets/redes/*.{png,jpg,jpeg,webp,svg}", { eager: true }),
    main: import.meta.glob<{ default: ImageMetadata }>("/src/assets/main/*.{png,jpg,jpeg,webp,svg}", { eager: true }),
};

type AssetType = keyof typeof assets;

function normalizeName(name: string): string {
    return name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ø/g, 'o')
        .replace(/ø/g, 'o')
        .replace(/[-\s]+/g, '_')
        .replace(/[^a-z0-9_.-]/g, '');
}

export function getAssetUrl(type: AssetType, fileName: string | null | undefined): string {
    if (!fileName) return "";

    let cleanFileName = fileName;
    if (fileName.startsWith('/assets/')) {
        const parts = fileName.split('/');
        cleanFileName = parts[parts.length - 1];
    }

    const normalized = normalizeName(cleanFileName);
    const folder = type === 'jugadorasPerfil' ? 'jugadoras-perfil' :
        type === 'jugadoras' ? 'jugadoras' : type;

    const directPath = `/src/assets/${folder}/${cleanFileName}`;
    if (assets[type] && assets[type][directPath]) {
        return assets[type][directPath].default.src;
    }

    const normalizedPath = `/src/assets/${folder}/${normalized}`;
    if (assets[type] && assets[type][normalizedPath]) {
        return assets[type][normalizedPath].default.src;
    }

    if (!cleanFileName.includes('.')) {
        for (const ext of ['.png', '.jpg', '.svg', '.webp']) {
            const originalPathExt = `/src/assets/${folder}/${cleanFileName}${ext}`;
            if (assets[type] && assets[type][originalPathExt]) {
                return assets[type][originalPathExt].default.src;
            }
            const normalizedPathExt = `/src/assets/${folder}/${normalized}${ext}`;
            if (assets[type] && assets[type][normalizedPathExt]) {
                return assets[type][normalizedPathExt].default.src;
            }
        }
    }

    if (type === 'jugadoras' || type === 'jugadorasPerfil') {
        const placeholderPath = type === 'jugadoras' ? '/src/assets/jugadoras/placeholder.png' : '/src/assets/jugadoras-perfil/placeholder.png';
        return assets[type][placeholderPath]?.default.src || `https://media.madridfemeninoxtra.com/${folder}/placeholder.png`;
    }

    if (cleanFileName) {
        let normalizedFallback = normalizeName(cleanFileName);

        if (!normalizedFallback.includes('.')) {
            normalizedFallback += '.webp';
        }
        
        return `https://media.madridfemeninoxtra.com/${folder}/${normalizedFallback}`;
    }

    return "";
}

export function getAssetMetadata(type: AssetType, fileName: string | null | undefined): ImageMetadata | null {
    if (!fileName) return null;

    const normalized = normalizeName(fileName);
    const folder = type === 'jugadorasPerfil' ? 'jugadoras-perfil' :
        type === 'jugadoras' ? 'jugadoras' : type;

    const pathsToTry = [
        `/src/assets/${folder}/${fileName}`,
        `/src/assets/${folder}/${normalized}`,
    ];

    if (!fileName.includes('.')) {
        for (const ext of ['.png', '.jpg', '.webp', '.svg']) {
            pathsToTry.push(`/src/assets/${folder}/${fileName}${ext}`);
            pathsToTry.push(`/src/assets/${folder}/${normalized}${ext}`);
        }
    }

    for (const path of pathsToTry) {
        if (assets[type] && assets[type][path]) {
            return assets[type][path].default;
        }
    }

    return null;
}


