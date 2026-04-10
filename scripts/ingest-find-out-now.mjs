import fs from 'node:fs'
import path from 'node:path'
import { fetchFindOutNowPolls } from './sources/findoutnow.mjs'

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
  const records = await fetchFindOutNowPolls()

  if (!records.length) {
    throw new Error('No Find Out Now records were produced.')
  }

  const normalised = records.map((record) => ({
    ...record,
    sourceType: record.sourceType || 'find out now',
    confidence: record.confidence || 'high',
    verificationStatus: record.verificationStatus || 'verified',
    suspect: !!record.suspect,
  }))

  if (outPath) {
    ensureDirForFile(outPath)
    fs.writeFileSync(outPath, JSON.stringify(normalised, null, 2), 'utf-8')
    console.log(`[ingest-find-out-now] Saved to ${outPath}`)
    return
  }

  console.log(JSON.stringify(normalised, null, 2))
}

main().catch((error) => {
  console.error('[ingest-find-out-now] Failed:', error.message)
  process.exit(1)
})
