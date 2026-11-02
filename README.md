# brett-peterson.com

Personal site for Brett Peterson. Astro 7, Tailwind 4, GSAP, Keystatic, deployed on Vercel.

## Run it

```bash
npm install
npm run dev        # http://localhost:4321, CMS at http://localhost:4321/keystatic
npm run build
```

Node 22+.

## Editing content

All content lives in this repo under `src/content/`:

| Folder | What |
| --- | --- |
| `site/index.json` | Hero intro, "now" line, email, socials, toolbox |
| `posts/*.md` | Writing |
| `projects/*.json` | Work (set `featured` to show on the home page) |
| `timeline/*.json` | The "Since 2009" chapters |
| `archive/*.json` | 2014 client archive |

Edit the files directly, or use the Keystatic admin at `/keystatic`:

- **Locally** it reads and writes files on disk.
- **In production** it runs in GitHub mode: you sign in with GitHub, and each save is a commit to `main`, which Vercel deploys.

### One-time Keystatic GitHub setup

1. Run `PUBLIC_KEYSTATIC_GITHUB=1 npm run dev` and open http://localhost:4321/keystatic.
2. Click **Create GitHub App**, name it, and install it on `bap22/brett-peterson-astro`.
3. Keystatic writes four variables to `.env` (see `.env.example`). Add the same four to the Vercel project (Settings → Environment Variables) and redeploy.
4. In the GitHub App settings, add `https://brett-peterson.com/api/keystatic/github/oauth/callback` as a callback URL.

## Restoring full blog posts

The older posts were condensed during the move. To bring back the original bodies, export from WordPress (Tools → Export → Posts) **before the domain is switched**, then:

```bash
node scripts/import-wordpress.mjs ~/Downloads/wordpress-export.xml
```

## Things worth knowing

- Pages are prerendered static HTML. Only `/keystatic` and its API run as a serverless function.
- `vercel.json` redirects every old WordPress URL (`/2015/08/07/ssl-on-aws/` → `/writing/ssl-on-aws`, `/blog`, `/portfolio`, `/byu`, `/contact`, `/feed`).
- Motion lives in `src/scripts/site.ts`. Everything respects `prefers-reduced-motion`.
- Easter eggs: press `X` for x-ray mode, `⌘K` for the command menu, and the Konami code for gameday mode.
