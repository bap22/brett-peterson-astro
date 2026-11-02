import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().default(''),
    tags: z.array(z.string()).default([]),
    legacyPath: z.string().default(''),
    condensed: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    year: z.string(),
    role: z.string().default(''),
    summary: z.string(),
    stack: z.array(z.string()).default([]),
    url: z.string().nullable().optional(),
    featured: z.boolean().default(false),
    order: z.number().nullable().default(10),
  }),
});

const timeline = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/timeline' }),
  schema: z.object({
    title: z.string(),
    start: z.string(),
    end: z.string().default(''),
    org: z.string().default(''),
    body: z.string(),
  }),
});

const archive = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/archive' }),
  schema: z.object({ name: z.string(), year: z.string(), note: z.string().default('') }),
});

const site = defineCollection({
  loader: file('./src/content/site/index.json', { parser: (t) => ({ site: JSON.parse(t) }) }),
  schema: z.object({
    lede: z.string(),
    now: z.string(),
    location: z.string(),
    email: z.string(),
    socials: z.array(z.object({ label: z.string(), url: z.string() })),
    toolbox: z.array(z.string()),
  }),
});

export const collections = { posts, projects, timeline, archive, site };
