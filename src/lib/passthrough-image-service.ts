import { baseService, type LocalImageService } from 'astro/assets';

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
