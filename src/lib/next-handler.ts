// Run a Next.js pages-router API handler (req, res) inside an Astro endpoint.
// Lets the original SkyJo server code run unchanged.
import type { APIRoute } from 'astro';

type NextHandler = (req: any, res: any) => unknown | Promise<unknown>;

export function fromNextHandler(handler: NextHandler): APIRoute {
  return async ({ request, url }) => {
    let body: unknown = {};
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try { body = await request.json(); } catch { body = {}; }
    }
    const req = {
      method: request.method,
      query: Object.fromEntries(url.searchParams),
      body,
      headers: Object.fromEntries(request.headers),
    };

    return await new Promise<Response>((resolve, reject) => {
      let status = 200;
      const headers = new Headers();
      const res = {
        setHeader(k: string, v: string) { headers.set(k, v); return res; },
        status(code: number) { status = code; return res; },
        json(data: unknown) {
          headers.set('Content-Type', 'application/json');
          resolve(new Response(JSON.stringify(data), { status, headers }));
          return res;
        },
        send(data: string) { resolve(new Response(data, { status, headers })); return res; },
        end(data?: string) { resolve(new Response(data ?? null, { status, headers })); return res; },
      };
      Promise.resolve(handler(req, res)).catch(reject);
    });
  };
}
