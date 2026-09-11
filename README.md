# Quality Motors

## Render deployment

The repository root contains package.json; preserve all directories when uploading.
Build: `npm install && npm run build`. Start: `npm start`.
Set DATABASE_URL in Render and initialize the database with `npm run db:push`
from a trusted environment before using the service form.
The canonical schema is prisma/schema.prisma.

This remains a development application: administrator authentication is not
implemented, and the existing payment webhook must be secured and verified
against MercadoPago before accepting live payments or real customer data.

This is a Next.js server application. It cannot be hosted with GitHub Pages because the app uses server-rendered routes, API routes, Prisma/PostgreSQL, MercadoPago webhooks, and OpenAI.

## Deploy

Use Vercel, Render, Railway, or another Node.js host. For Vercel: import `Monster-ProShop/Quality-Motors`, keep the root directory `/`, and use the default Next.js build settings. Add the variables from `.env.example` in the host's environment settings. Provision PostgreSQL separately, then run `npx prisma db push` against the production database.

Disable GitHub Pages for this repository, or leave it unused. The GitHub Pages URL will continue to return 404 because there is no static `index.html` build in this server application.
