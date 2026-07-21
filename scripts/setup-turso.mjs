// One-time Turso provisioning: creates the production database and prints
// every secret with its destination. Run: node scripts/setup-turso.mjs [db-name]
// --dry-run prints the plan without calling the turso CLI.
import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const dbName = args.find(a => !a.startsWith('--')) ?? 'wedding'

const run = cmd => execFileSync('turso', cmd, { encoding: 'utf8' }).trim()

const commands = [
  `turso db create ${dbName}`,
  `turso db show ${dbName} --url`,
  `turso db tokens create ${dbName}`,
]

let url = '<TURSO_DATABASE_URL>'
let token = '<TURSO_AUTH_TOKEN>'

if (dryRun) {
  console.log('Dry run — would execute:')
  for (const cmd of commands) console.log(`  ${cmd}`)
}
else {
  run(['db', 'create', dbName])
  url = run(['db', 'show', dbName, '--url'])
  token = run(['db', 'tokens', 'create', dbName])
}

console.log(`
Secrets and where they go (see SECRETS.md):

  TURSO_DATABASE_URL = ${url}
    -> GitHub Actions secret TURSO_DATABASE_URL (deploy migrations)
    -> infra/terraform.tfvars turso_database_url (Amplify runtime NUXT_DB_URL)

  TURSO_AUTH_TOKEN = ${token}
    -> GitHub Actions secret TURSO_AUTH_TOKEN (deploy migrations)
    -> infra/terraform.tfvars turso_auth_token (Amplify runtime NUXT_DB_AUTH_TOKEN)

After updating terraform.tfvars, run terraform apply in infra/.
`)
