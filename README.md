# Quality Motors

This is a Next.js server application. It cannot be hosted with GitHub Pages because the app uses server-rendered routes, API routes, Prisma/PostgreSQL, MercadoPago webhooks, and OpenAI.

## Deploy

Use Vercel, Render, Railway, or another Node.js host. For Vercel: import `Monster-ProShop/Quality-Motors`, keep the root directory `/`, and use the default Next.js build settings. Add the variables from `.env.example` in the host's environment settings. Provision PostgreSQL separately, then run `npx prisma db push` against the production database.

Disable GitHub Pages for this repository, or leave it unused. The GitHub Pages URL will continue to return 404 because there is no static `index.html` build in this server application.
