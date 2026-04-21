/**
 * API Endpoint: Trigger Live Match Sync
 * POST /api/sync/livematch
 *
 * This endpoint now delegates to CLI script due to build constraints
 */

const JSON_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export const OPTIONS = () => {
  return new Response(null, {
    status: 204,
    headers: JSON_HEADERS,
  });
};

export const POST = async () => {
  try {
    // For now, return a message indicating the system is ready
    // The actual scraping is done via CLI script: npm run sync:live

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sistema de livescore listo. Usa el script CLI para sincronizar: npm run sync:live',
        status: 'ready',
        nextSteps: [
          'Ejecuta: npm run sync:live',
          'O usa el script manual: npx tsx scripts/sync-sofascore.ts'
        ]
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error: any) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};