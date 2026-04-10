import fs from 'node:fs'
import path from 'node:path'
import fetchJLPartnersPolls from './sources/jlpartners.mjs'

function getArgValue(flag) {
  const args = process.argv.slice(2)
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1] || null
}

async function main() {
  const outPath = getArgValue('--out')
  const polls = await fetchJLPartnersPolls()

  if (!outPath) {
    console.log(JSON.stringify(polls, null, 2))
    return
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(polls, null, 2), 'utf-8')
  console.log(`[ingest-jl-partners] Saved to ${outPath}`)
}

main().catch((error) => {
  console.error('[ingest-jl-partners] Failed:', error.message)
  process.exit(1)
})
