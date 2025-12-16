# Copilot Instructions

- Never run `npm run dev` or start the dev server,and assume that it's always already running.
- Unit tests or e2e tests shall not be suggested or created unless directly specified in the prompt
- Whenever an 'npx prisma' command is needed, alwasy use the package json scripts - example "npm run db:docker:dev"
- No need to handle backwards compatibility at the moment, this site is stil in development and has no users. We can just make destructive changes and re-seed the database.