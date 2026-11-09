export function runtimeEnv(key: string): string | undefined {
    const workerEnv = (globalThis as typeof globalThis & {
        __MFX_WORKER_ENV__?: Record<string, unknown>;
    }).__MFX_WORKER_ENV__?.[key];
    if (typeof workerEnv === 'string' && workerEnv.length > 0) return workerEnv;

    const buildEnv = import.meta.env?.[key] as string | undefined;
    if (typeof buildEnv === 'string' && buildEnv.length > 0) return buildEnv;

    const processEnv = process.env[key];
    return processEnv?.length ? processEnv : undefined;
}
