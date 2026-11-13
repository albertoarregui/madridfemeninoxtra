export function runtimeEnv(key: string): string | undefined {
    const buildEnv = import.meta.env?.[key] as string | undefined;
    if (typeof buildEnv === 'string' && buildEnv.length > 0) return buildEnv;

    const processEnv = process.env[key];
    if (processEnv?.length) return processEnv;

    if (key === 'APP_ENV') return process.env.VERCEL_ENV || undefined;
    return undefined;
}
