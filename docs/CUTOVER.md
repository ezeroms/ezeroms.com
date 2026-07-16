# Cutover checklist (Hugo/Netlify → Next/Vercel/Supabase)

1. Supabase migrations applied; `npm run migrate:supabase` succeeded
2. Vercel project linked to this repo; env vars set (see ENV_SETUP.md)
3. Preview deploy: spot-check /, /diary/, /column/, /chronicle/, /search/, RSS /index.xml/
4. Point ezeroms.com DNS to Vercel
5. Disable Netlify site / stop Contentful → Netlify webhooks
6. After stable period, remove Hugo leftovers:
   - layouts/, archetypes/, config.toml, netlify.toml
   - content/ (after backup), Hugo scripts under scripts/contentful*
   - generated Hugo HTML under public/ (keep images/css/js or move to public from static/)
7. Update any remaining docs that mention microCMS / Hugo as primary
