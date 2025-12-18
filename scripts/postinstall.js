import { spawnSync } from "node:child_process"

const env = process.env.NODE_ENV || "development"
const isProd = env === "production"
const scriptName = isProd ? "db:generate:prod" : "db:generate:dev"

console.log(`postinstall: NODE_ENV=${env}; running npm run ${scriptName}`)

const res = spawnSync("npm", ["run", scriptName], {
  stdio: "inherit",
  env: process.env,
})

if (res.error) {
  console.error("postinstall: failed to spawn npm:", res.error)
  process.exit(1)
}

process.exit(res.status ?? 0)
