const WORDPRESS_URL = import.meta.env.WORDPRESS_API_URL || 'https://cms.madridfemeninoxtra.com';
const WP_API_ENDPOINT = `${WORDPRESS_URL}/wp-json/wp/v2/posts`;

const WP_API_ENDPOINT_HTTP = WP_API_ENDPOINT.replace('https://', 'http://');

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

export const OPTIONS = () => {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
};

export const GET = async ({ url }) => {
    try {
        const page = url.searchParams.get('page') || '1';
        const perPage = url.searchParams.get('per_page') || '10';

        const wpUrl = new URL(WP_API_ENDPOINT);
        wpUrl.searchParams.set('page', page);
        wpUrl.searchParams.set('per_page', perPage);
        wpUrl.searchParams.set('_embed', 'true');

        console.log('Fetching from:', wpUrl.toString());

        let response;
        try {
            response = await fetch(wpUrl.toString());
        } catch (error) {
            console.warn('HTTPS fetch failed, trying HTTP:', error.message);
            const wpUrlHttp = new URL(WP_API_ENDPOINT_HTTP);
            wpUrlHttp.searchParams.set('page', page);
            wpUrlHttp.searchParams.set('per_page', perPage);
            wpUrlHttp.searchParams.set('_embed', 'true');
            response = await fetch(wpUrlHttp.toString());
        }

        if (!response.ok) {
            throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
        }

        const posts = await response.json();

        const transformedPosts = posts.map(post => ({
            id: post.id,
            title: post.title.rendered,
            excerpt: post.excerpt.rendered,
            content: post.content.rendered,
            slug: post.slug,
            date: post.date,
            modified: post.modified,
            author: post._embedded?.author?.[0]?.name || 'Desconocido',
            featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
            featuredImageAlt: post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || '',
            categories: post._embedded?.['wp:term']?.[0]?.map(cat => cat.name) || [],
            link: post.link
        }));

        const totalPosts = response.headers.get('X-WP-Total');
        const totalPages = response.headers.get('X-WP-TotalPages');

        return new Response(
            JSON.stringify({
                posts: transformedPosts,
                pagination: {
                    currentPage: parseInt(page),
                    perPage: parseInt(perPage),
                    totalPosts: totalPosts ? parseInt(totalPosts) : null,
                    totalPages: totalPages ? parseInt(totalPages) : null
                }
            }),
            { status: 200, headers: CORS_HEADERS }
        );

    } catch (error) {
        console.error('WordPress API Error:', error.message);

        return new Response(
            JSON.stringify({
                error: 'Error al obtener noticias de WordPress',
                details: error.message,
                wpUrl: WORDPRESS_URL
            }),
            { status: 500, headers: CORS_HEADERS }
        );
    }
};
