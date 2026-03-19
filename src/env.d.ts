


interface ImportMetaEnv {
    readonly TURSO_DATABASE_URL: string;
    readonly TURSO_AUTH_TOKEN: string;
    readonly TURSO_STATS_DATABASE_URL?: string;
    readonly TURSO_STATS_AUTH_TOKEN?: string;
    readonly CONTENTFUL_SPACE_ID?: string;
    readonly CONTENTFUL_ACCESS_TOKEN?: string;
    readonly CLOUDFLARE_IMAGES_DOMAIN?: string;
    readonly CLOUDFLARE_ACCOUNT_ID?: string;
    readonly CLOUDFLARE_API_TOKEN?: string;
    readonly PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
    readonly CLERK_SECRET_KEY?: string;
    readonly GOOGLE_GENERATIVE_AI_API_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.mp3" {
    const src: string;
    export default src;
}


