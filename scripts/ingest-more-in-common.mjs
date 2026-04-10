import fs from 'node:fs'
import path from 'node:path'
import fetchMoreInCommonPolls from './sources/moreInCommon.mjs'

function getArgValue(flag) {
  const args = process.argv.slice(2)
  const index = args.indexOf(flag)
  return index === -1 ? null : args[index + 1] || null
}

function ensureDirForFile(filePath) {
  if (!filePath) return
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

async function main() {
  const outPath = getArgValue('--out')
  const records = await fetchMoreInCommonPolls()
  if (!records.length) throw new Error('No More in Common records were produced.')

  if (outPath) {
    ensureDirForFile(outPath)
    fs.writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf-8')
    console.log(`[ingest-more-in-common] Saved to ${outPath}`)
    return
  }

  console.log(JSON.stringify(records, null, 2))
}

main().catch((error) => {
  console.error('[ingest-more-in-common] Failed:', error.message)
  process.exit(1)
})
