import { contentfulClient } from '../lib/contentful';
import { cached, TTL } from './cache';

const TRANSFORMACION = 'w=1200&h=630&fit=fill&fm=jpg&q=80';

interface Miniaturas {
    exactas: Record<string, string>;
    comodines: [string, string][];
}

function normalizar(ruta: string): string {
    const limpia = String(ruta ?? '').trim().toLowerCase();
    const conBarra = limpia.startsWith('/') ? limpia : `/${limpia}`;
    const sinFinal = conBarra.length > 1 ? conBarra.replace(/\/+$/, '') : conBarra;
    return sinFinal || '/';
}

function urlDeAsset(imagen: any): string | null {
    const url = imagen?.fields?.file?.url;
    if (!url) return null;
    const absoluta = url.startsWith('//') ? `https:${url}` : url;
    return `${absoluta}?${TRANSFORMACION}`;
}

async function cargarMiniaturas(): Promise<Miniaturas> {
    return cached('contentful:ogImage', TTL.medio, async () => {
        const vacio: Miniaturas = { exactas: {}, comodines: [] };
        try {
            const entries = await contentfulClient.getEntries({
                content_type: 'ogImage',
                limit: 500,
                include: 1,
            } as any);

            const exactas: Record<string, string> = {};
            const comodines: [string, string][] = [];

            for (const item of entries.items as any[]) {
                const ruta = item.fields?.ruta;
                const url = urlDeAsset(item.fields?.imagen);
                if (!ruta || !url) continue;

                if (String(ruta).trim().endsWith('/*')) {
                    const prefijo = normalizar(String(ruta).trim().slice(0, -2));
                    comodines.push([prefijo === '/' ? '' : prefijo, url]);
                } else {
                    exactas[normalizar(ruta)] = url;
                }
            }

            comodines.sort((a, b) => b[0].length - a[0].length);
            return { exactas, comodines };
        } catch {
            return vacio;
        }
    });
}

export async function resolverOgImage(
    pathname: string,
    imagenDeLaPagina?: string,
): Promise<string | null> {
    const ruta = normalizar(pathname);
    const { exactas, comodines } = await cargarMiniaturas();

    if (exactas[ruta]) return exactas[ruta];
    if (imagenDeLaPagina) return null;

    const comodin = comodines.find(
        ([prefijo]) => prefijo === '' || ruta === prefijo || ruta.startsWith(`${prefijo}/`),
    );
    return comodin ? comodin[1] : null;
}
