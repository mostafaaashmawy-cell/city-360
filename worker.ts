export interface Env {
  ASSETS: { fetch: typeof fetch };
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // ─── Secure Gemini Live WebSocket API Proxy ─────────────────────────────────────────
    if (url.pathname === '/api/gemini-session') {
      const apiKey = env.GEMINI_API_KEY;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'GEMINI_API_KEY environment variable is not configured on Cloudflare Worker.' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      const upgradeHeader = request.headers.get('Upgrade');
      
      // If WebSocket upgrade is requested by client
      if (upgradeHeader === 'websocket') {
        const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        const geminiWs = new WebSocket(geminiUrl);

        // @ts-ignore
        const pair = new WebSocketPair();
        const client = pair[0];
        const server = pair[1];
        server.accept();

        // 1. Pipe client audio/messages to Gemini API
        server.addEventListener('message', (event: MessageEvent) => {
          if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(event.data);
          }
        });

        server.addEventListener('close', () => {
          geminiWs.close();
        });

        // 2. Pipe Gemini audio/tool response back to client
        geminiWs.addEventListener('message', (event: MessageEvent) => {
          if (server.readyState === WebSocket.OPEN) {
            server.send(event.data);
          }
        });

        geminiWs.addEventListener('close', () => {
          server.close();
        });

        geminiWs.addEventListener('error', () => {
          server.close();
        });

        return new Response(null, {
          status: 101,
          webSocket: client,
        } as ResponseInit);
      }

      // HTTP GET fallback: return secure target URL
      const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      return new Response(JSON.stringify({ url: geminiUrl }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // ─── Static Assets Handler ────────────────────────────────────────────────────────
    // All other requests pass through to Cloudflare Static Assets (out/ directory)
    return env.ASSETS.fetch(request);
  },
};
