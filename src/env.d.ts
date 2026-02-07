/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly TURSO_DATABASE_URL: string;
    readonly TURSO_AUTH_TOKEN: string;
    readonly TURSO_STATS_DATABASE_URL?: string;
    readonly TURSO_STATS_AUTH_TOKEN?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.mp3" {
    const src: string;
    export default src;
}
