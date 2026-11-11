export function runtimeEnv(key: string): string | undefined {
    const buildEnv = import.meta.env?.[key] as string | undefined;
    if (typeof buildEnv === 'string' && buildEnv.length > 0) return buildEnv;

    const processEnv = process.env[key];
    if (processEnv?.length) return processEnv;

    // Vercel identifica el entorno (production/preview/development) sin
    // configuración adicional; las vistas previas nunca se tratan como producción.
    if (key === 'APP_ENV') return process.env.VERCEL_ENV || undefined;
    return undefined;
}
