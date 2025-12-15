# Copilot Instructions

- Never run `npm run dev` or start the dev server,and assume that it's always already running.
- Unit tests or e2e tests shall not be suggested or created unless directly specified in the prompt
- If you ever need to run prisma, use the package json scripts, don't tail any of the output
- No need to handle backwards compatibility at the moment, this site is stil in development and has no users. We can just make destructive changes and re-seed the database.