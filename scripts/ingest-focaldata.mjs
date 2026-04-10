import fs from 'node:fs'
import path from 'node:path'
import fetchFocaldataPolls from './sources/focaldata.mjs'

function getArgValue(flag) {
  const args = process.argv.slice(2)
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1] || null
}

async function main() {
  const outPath = getArgValue('--out')
  const polls = await fetchFocaldataPolls()

  if (!outPath) {
    console.log(JSON.stringify(polls, null, 2))
    return
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(polls, null, 2), 'utf-8')
  console.log(`[ingest-focaldata] Saved to ${outPath}`)
}

main().catch((error) => {
  console.error('[ingest-focaldata] Failed:', error.message)
  process.exit(1)
})
