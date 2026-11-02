import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('posts')).sort((a, b) => +b.data.date - +a.data.date);
  const base = site!.toString().replace(/\/$/, '');
  const items = posts.map((p) => `<item><title>${esc(p.data.title)}</title><link>${base}/writing/${p.id}</link><guid>${base}/writing/${p.id}</guid><pubDate>${p.data.date.toUTCString()}</pubDate><description>${esc(p.data.summary)}</description></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Brett Peterson, writing</title><link>${base}</link><description>Notes on building for the web.</description>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
