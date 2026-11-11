import { baseService, type LocalImageService } from 'astro/assets';

// Las imágenes ya se suben optimizadas. En lugar del endpoint `/_image`
// (que en Vercel no sirve archivos con el servicio noop), cada <Image>
// apunta directamente al archivo original: el de `/_astro/` para las
// importaciones locales y la URL remota tal cual para el resto.
const passthroughImageService: LocalImageService = {
    ...baseService,
    getURL(options) {
        return typeof options.src === 'string' ? options.src : options.src.src;
    },
    async transform(inputBuffer, transform) {
        return { data: inputBuffer, format: transform.format };
    },
};

export default passthroughImageService;
