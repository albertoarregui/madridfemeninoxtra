import { contentfulClient } from '../lib/contentful';
import { cached, TTL } from './cache';

export type TipoFicha = 'jugadora' | 'entrenador' | 'arbitra' | 'club' | 'estadio';

export interface FichaTexto {
    visible: string;
    resto: string;
}

function partir(html: string): FichaTexto {
    const parrafos = html.match(/<p>[\s\S]*?<\/p>/g) || [];
    if (parrafos.length <= 2) return { visible: html, resto: '' };
    const corte = html.indexOf(parrafos[1]) + parrafos[1].length;
    return { visible: html.slice(0, corte), resto: html.slice(corte) };
}

async function listar(contentType: string, focusType: string): Promise<any[]> {
    return cached(`contentful:${contentType}:${focusType}`, TTL.medio, async () => {
        try {
            const entries = await contentfulClient.getEntries({
                content_type: contentType,
                'fields.focusType': focusType,
                limit: 500,
            } as any);
            return entries.items as any[];
        } catch {
            return [];
        }
    });
}

function buscar(items: any[], claves: (string | number | null | undefined)[]) {
    const buscadas = claves
        .filter((c) => c !== null && c !== undefined && String(c).trim() !== '')
        .map((c) => String(c).trim());
    if (!buscadas.length) return null;
    return (
        items.find((item: any) => {
            const ref = String(item.fields?.referenceId ?? item.fields?.id ?? '').trim();
            return ref !== '' && buscadas.includes(ref);
        }) || null
    );
}

async function renderizar(entrada: any): Promise<FichaTexto | null> {
    if (!entrada?.fields?.body) return null;
    const { documentToHtmlString } = await import('@contentful/rich-text-html-renderer');
    const html = documentToHtmlString(entrada.fields.body);
    if (!html.trim()) return null;
    return partir(html);
}

export async function fetchFicha(
    tipo: TipoFicha,
    claves: (string | number | null | undefined)[],
): Promise<FichaTexto | null> {
    const items = await listar('ficha', tipo);
    if (!items.length) return null;
    return renderizar(buscar(items, claves));
}

export async function fetchCronicaPartido(
    claves: (string | number | null | undefined)[],
): Promise<FichaTexto | null> {
    const items = await listar('noticia', 'match');
    if (!items.length) return null;
    return renderizar(buscar(items, claves));
}
