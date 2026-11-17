// URL de una imagen de Contentful lista para <img>. Acepta "//images.ctfassets.net/…"
// o una URL absoluta y, si es de images.ctfassets.net, pide a Contentful una versión
// reducida en WebP: el servicio de imágenes de la web no redimensiona, así que sin
// esto el navegador descarga el original (a veces de varios MB o en un formato que
// Safari no muestra).
export function contentfulImageUrl(
    raw: unknown,
    size: { width: number; height: number; quality?: number },
    fallback = "/og.png",
): string {
    const value = String(raw ?? "").trim();
    if (!value) return fallback;
    try {
        const url = new URL(value.startsWith("//") ? `https:${value}` : value);
        if (url.hostname === "images.ctfassets.net") {
            url.searchParams.set("fm", "webp");
            url.searchParams.set("w", String(size.width));
            url.searchParams.set("h", String(size.height));
            url.searchParams.set("q", String(size.quality ?? 72));
            url.searchParams.set("fit", "fill");
        }
        return url.toString();
    } catch {
        return fallback;
    }
}
