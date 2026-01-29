
export function generateSlug(text: string | null | undefined): string {
    if (!text) return 'desconocido';

    return text.toString().toLowerCase()
        .trim()
        .replace(/ø/g, 'o').replace(/Ø/g, 'O')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        // Normalize accents (NFD) and remove diacritics
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        // Replace spaces with hyphens
        .replace(/\s+/g, '-')
        // Remove any character that is not a-z, 0-9, or hyphen
        .replace(/[^a-z0-9\-]+/g, '')
        // Remove multiple hyphens
        .replace(/\-\-+/g, '-')
        // Remove trailing/leading hyphens
        .replace(/^-+|-+$/g, '');
}
