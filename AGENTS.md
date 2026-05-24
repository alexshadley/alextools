<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Database migrations

This project is pre-production. Use `pnpm db:push` to sync schema changes directly to the database — no need to generate migration files. Skip `db:generate`/`db:migrate` unless explicitly asked.

If `db:push` hits a TTY prompt (e.g. a table rename/drop conflict), resolve the conflict directly via SQL (drop/rename the table) and re-run push, rather than trying to feed input to the prompt.
