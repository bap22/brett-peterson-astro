import { config, collection, singleton, fields } from '@keystatic/core';

// Local mode while developing; GitHub mode in production so edits at /keystatic
// commit straight to the repo and Vercel redeploys.
const storage = import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_GITHUB === '1'
  ? ({ kind: 'github', repo: { owner: 'bap22', name: 'brett-peterson-astro' } } as const)
  : ({ kind: 'local' } as const);

export default config({
  storage,
  ui: { brand: { name: 'brett-peterson.com' } },
  singletons: {
    site: singleton({
      label: 'Site settings',
      path: 'src/content/site/',
      format: { data: 'json' },
      schema: {
        lede: fields.text({ label: 'Hero intro', multiline: true }),
        now: fields.text({ label: 'Currently (short line)' }),
        location: fields.text({ label: 'Location' }),
        email: fields.text({ label: 'Email' }),
        socials: fields.array(
          fields.object({ label: fields.text({ label: 'Label' }), url: fields.url({ label: 'URL' }) }),
          { label: 'Social links', itemLabel: (p) => p.fields.label.value }
        ),
        toolbox: fields.array(fields.text({ label: 'Tool' }), { label: 'Toolbox', itemLabel: (p) => p.value }),
      },
    }),
  },
  collections: {
    posts: collection({
      label: 'Writing',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      columns: ['title', 'date'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        date: fields.date({ label: 'Published', validation: { isRequired: true } }),
        summary: fields.text({ label: 'Summary', multiline: true }),
        tags: fields.array(fields.text({ label: 'Tag' }), { label: 'Tags', itemLabel: (p) => p.value }),
        legacyPath: fields.text({ label: 'Old WordPress path (for redirects)' }),
        condensed: fields.checkbox({ label: 'Condensed from the original WordPress post', defaultValue: false }),
        content: fields.markdoc({ label: 'Body', extension: 'md' }),
      },
    }),
    projects: collection({
      label: 'Work',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { data: 'json' },
      columns: ['title', 'year'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        year: fields.text({ label: 'Year or range' }),
        role: fields.text({ label: 'Role' }),
        summary: fields.text({ label: 'Summary', multiline: true }),
        stack: fields.array(fields.text({ label: 'Tech' }), { label: 'Stack', itemLabel: (p) => p.value }),
        url: fields.url({ label: 'Link' }),
        featured: fields.checkbox({ label: 'Show on home page', defaultValue: false }),
        order: fields.integer({ label: 'Sort order', defaultValue: 10 }),
      },
    }),
    timeline: collection({
      label: 'Timeline',
      slugField: 'title',
      path: 'src/content/timeline/*',
      format: { data: 'json' },
      columns: ['title', 'start'],
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        start: fields.text({ label: 'Start year' }),
        end: fields.text({ label: 'End year (blank = now)' }),
        org: fields.text({ label: 'Organization' }),
        body: fields.text({ label: 'What happened', multiline: true }),
      },
    }),
    archive: collection({
      label: 'Client archive',
      slugField: 'name',
      path: 'src/content/archive/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Site name' } }),
        year: fields.text({ label: 'Year' }),
        note: fields.text({ label: 'Note' }),
      },
    }),
  },
});
