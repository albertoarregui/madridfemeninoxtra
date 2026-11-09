type NotificationType = 'URL_UPDATED' | 'URL_DELETED';

type GoogleCredentials = {
    clientEmail?: string;
    privateKey?: string;
};

function base64Url(value: string | ArrayBuffer): string {
    const bytes = typeof value === 'string'
        ? new TextEncoder().encode(value)
        : new Uint8Array(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToPkcs8(pem: string): ArrayBuffer {
    const binary = atob(pem
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes.buffer;
}

async function accessToken(credentials: Required<GoogleCredentials>): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claim = base64Url(JSON.stringify({
        iss: credentials.clientEmail,
        scope: 'https://www.googleapis.com/auth/indexing',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
    }));
    const unsigned = `${header}.${claim}`;
    const key = await crypto.subtle.importKey(
        'pkcs8',
        pemToPkcs8(credentials.privateKey),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
    const assertion = `${unsigned}.${base64Url(signature)}`;
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
    });
    const body = await response.json() as { access_token?: string; error_description?: string };
    if (!response.ok || !body.access_token) {
        throw new Error(body.error_description || `Google OAuth devolvió ${response.status}`);
    }
    return body.access_token;
}

export async function notifyGoogleIndexing(
    url: string,
    type: NotificationType,
    credentials: GoogleCredentials,
): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const clientEmail = credentials.clientEmail;
    const privateKey = credentials.privateKey?.replace(/\\n/g, '\n');
    if (!clientEmail || !privateKey) {
        return { success: false, error: 'Credenciales de Google no configuradas' };
    }

    try {
        const token = await accessToken({ clientEmail, privateKey });
        const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ url, type }),
        });
        const result = await response.json();
        return { success: response.ok, result };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
