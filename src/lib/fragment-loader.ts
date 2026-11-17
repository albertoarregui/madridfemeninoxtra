export function insertFragment(target: HTMLElement, html: string): void {
    const template = document.createElement('template');
    template.innerHTML = html;
    const scripts = [...template.content.querySelectorAll('script')];
    target.replaceChildren(template.content);
    for (const old of scripts) {
        const type = old.getAttribute('type');
        if (type && type !== 'module' && type !== 'text/javascript') continue;
        const script = document.createElement('script');
        for (const attr of [...old.attributes]) script.setAttribute(attr.name, attr.value);
        script.textContent = old.textContent;
        old.replaceWith(script);
    }
    document.dispatchEvent(new CustomEvent('mfx:fragment', { detail: target }));
}

export async function loadFragment(target: HTMLElement, src: string): Promise<void> {
    const response = await fetch(src, { headers: { Accept: 'text/html' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    insertFragment(target, await response.text());
}
