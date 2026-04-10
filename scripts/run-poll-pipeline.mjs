import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SCRIPTS_DIR = path.join(ROOT, 'scripts')
const DATA_DIR = path.join(ROOT, 'data', 'polls')
const REPORTS_DIR = path.join(DATA_DIR, 'reports')
const QUARANTINE_DIR = path.join(DATA_DIR, 'quarantine')

const WIKI_RAW = path.join(DATA_DIR, 'wikipedia.json')
const YOUGOV_RAW = path.join(DATA_DIR, 'yougov.json')
const OPINIUM_RAW = path.join(DATA_DIR, 'opinium.json')
const MORE_IN_COMMON_RAW = path.join(DATA_DIR, 'more-in-common.json')
const FIND_OUT_NOW_RAW = path.join(DATA_DIR, 'find-out-now.json')
const JL_PARTNERS_RAW = path.join(DATA_DIR, 'jl-partners.json')
const FOCALDATA_RAW = path.join(DATA_DIR, 'focaldata.json')
const DELTAPOLL_RAW = path.join(DATA_DIR, 'deltapoll.json')

const WIKI_VALID = path.join(DATA_DIR, 'wikipedia.validated.json')
const YOUGOV_VALID = path.join(DATA_DIR, 'yougov.validated.json')
const OPINIUM_VALID = path.join(DATA_DIR, 'opinium.validated.json')
const MORE_IN_COMMON_VALID = path.join(DATA_DIR, 'more-in-common.validated.json')
const FIND_OUT_NOW_VALID = path.join(DATA_DIR, 'find-out-now.validated.json')
const JL_PARTNERS_VALID = path.join(DATA_DIR, 'jl-partners.validated.json')
const FOCALDATA_VALID = path.join(DATA_DIR, 'focaldata.validated.json')
const DELTAPOLL_VALID = path.join(DATA_DIR, 'deltapoll.validated.json')

const MERGED_OUT = path.join(DATA_DIR, 'merged.json')
const MERGED_QUARANTINE = path.join(QUARANTINE_DIR, 'merged.quarantine.json')

const WIKI_QUARANTINE = path.join(QUARANTINE_DIR, 'wikipedia.quarantine.json')
const YOUGOV_QUARANTINE = path.join(QUARANTINE_DIR, 'yougov.quarantine.json')
const OPINIUM_QUARANTINE = path.join(QUARANTINE_DIR, 'opinium.quarantine.json')
const MORE_IN_COMMON_QUARANTINE = path.join(QUARANTINE_DIR, 'more-in-common.quarantine.json')
const FIND_OUT_NOW_QUARANTINE = path.join(QUARANTINE_DIR, 'find-out-now.quarantine.json')
const JL_PARTNERS_QUARANTINE = path.join(QUARANTINE_DIR, 'jl-partners.quarantine.json')
const FOCALDATA_QUARANTINE = path.join(QUARANTINE_DIR, 'focaldata.quarantine.json')
const DELTAPOLL_QUARANTINE = path.join(QUARANTINE_DIR, 'deltapoll.quarantine.json')

const WIKI_REPORT = path.join(REPORTS_DIR, 'wikipedia.report.json')
const YOUGOV_REPORT = path.join(REPORTS_DIR, 'yougov.report.json')
const OPINIUM_REPORT = path.join(REPORTS_DIR, 'opinium.report.json')
const MORE_IN_COMMON_REPORT = path.join(REPORTS_DIR, 'more-in-common.report.json')
const FIND_OUT_NOW_REPORT = path.join(REPORTS_DIR, 'find-out-now.report.json')
const JL_PARTNERS_REPORT = path.join(REPORTS_DIR, 'jl-partners.report.json')
const FOCALDATA_REPORT = path.join(REPORTS_DIR, 'focaldata.report.json')
const DELTAPOLL_REPORT = path.join(REPORTS_DIR, 'deltapoll.report.json')

const MERGED_REPORT = path.join(REPORTS_DIR, 'merged.report.json')
const COVERAGE_REPORT = path.join(REPORTS_DIR, 'coverage.txt')

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function runNodeScript(scriptName, args = []) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName)
  if (!fs.existsSync(scriptPath)) throw new Error(`Missing script: ${scriptPath}`)

  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    encoding: 'utf-8',
  })

  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${scriptName} failed with exit code ${result.status}`)
}

function verifyFile(filePath, label) {
  if (!fs.existsSync(filePath)) throw new Error(`${label} output file was not created: ${filePath}`)
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  if (!Array.isArray(parsed)) throw new Error(`${label} output is not a JSON array: ${filePath}`)
  return parsed.length
}

function renderCoverageReport(reportPath, outPath) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
  const provenance = report.provenance || {}
  const directOnly = provenance.directOnlyPollsters || []
  const fallbackOnly = provenance.fallbackOnlyPollsters || []
  const mixed = provenance.mixedPollsters || []

  const lines = [
    `Generated: ${report.generatedAt}`,
    `Merged polls: ${report.mergedCount}`,
    `Quarantined: ${report.quarantinedCount}`,
    '',
    'Source provenance:',
    `- Direct-backed merged rows: ${provenance.directRows || 0}`,
    `- Fallback-backed merged rows: ${provenance.fallbackRows || 0}`,
    `- Manual-backed merged rows: ${provenance.manualRows || 0}`,
    '',
    `Direct-only pollsters (${directOnly.length}): ${directOnly.join(', ') || 'none'}`,
    `Fallback-only pollsters (${fallbackOnly.length}): ${fallbackOnly.join(', ') || 'none'}`,
    `Mixed pollsters (${mixed.length}): ${mixed.join(', ') || 'none'}`,
    '',
    'Coverage:',
  ]

  for (const [pollster, info] of Object.entries(report.coverage || {})) {
    const tiers = (info.sourceTiers || []).join(', ') || 'unknown'
    const types = (info.sourceTypes || []).join(', ') || 'unknown source'
    lines.push(`- ${pollster}: ${info.count} polls (latest: ${info.latestDate || 'n/a'}) [tiers: ${tiers}] [sources: ${types}] [direct=${info.directCount || 0}, fallback=${info.fallbackCount || 0}, manual=${info.manualCount || 0}]`)
  }

  fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf-8')
}

function main() {
  ensureDir(DATA_DIR)
  ensureDir(REPORTS_DIR)
  ensureDir(QUARANTINE_DIR)

  console.log('[pipeline] Running Wikipedia ingestor...')
  runNodeScript('ingest-wikipedia.mjs', ['--out', WIKI_RAW])
  const wikiRawCount = verifyFile(WIKI_RAW, 'Wikipedia raw')

  console.log('[pipeline] Validating Wikipedia...')
  runNodeScript('validate-polls.mjs', ['--in', WIKI_RAW, '--accepted-out', WIKI_VALID, '--quarantine-out', WIKI_QUARANTINE, '--report-out', WIKI_REPORT])
  const wikiCount = verifyFile(WIKI_VALID, 'Wikipedia validated')

  console.log('[pipeline] Running YouGov ingestor...')
  runNodeScript('ingest-yougov.mjs', ['--out', YOUGOV_RAW])
  const yougovRawCount = verifyFile(YOUGOV_RAW, 'YouGov raw')

  console.log('[pipeline] Validating YouGov...')
  runNodeScript('validate-polls.mjs', ['--in', YOUGOV_RAW, '--accepted-out', YOUGOV_VALID, '--quarantine-out', YOUGOV_QUARANTINE, '--report-out', YOUGOV_REPORT])
  const yougovCount = verifyFile(YOUGOV_VALID, 'YouGov validated')

  console.log('[pipeline] Running Opinium ingestor...')
  runNodeScript('ingest-opinium.mjs', ['--out', OPINIUM_RAW])
  const opiniumRawCount = verifyFile(OPINIUM_RAW, 'Opinium raw')

  console.log('[pipeline] Validating Opinium...')
  runNodeScript('validate-polls.mjs', ['--in', OPINIUM_RAW, '--accepted-out', OPINIUM_VALID, '--quarantine-out', OPINIUM_QUARANTINE, '--report-out', OPINIUM_REPORT])
  const opiniumCount = verifyFile(OPINIUM_VALID, 'Opinium validated')

  console.log('[pipeline] Running More in Common ingestor...')
  runNodeScript('ingest-more-in-common.mjs', ['--out', MORE_IN_COMMON_RAW])
  const micRawCount = verifyFile(MORE_IN_COMMON_RAW, 'More in Common raw')

  console.log('[pipeline] Validating More in Common...')
  runNodeScript('validate-polls.mjs', ['--in', MORE_IN_COMMON_RAW, '--accepted-out', MORE_IN_COMMON_VALID, '--quarantine-out', MORE_IN_COMMON_QUARANTINE, '--report-out', MORE_IN_COMMON_REPORT])
  const micCount = verifyFile(MORE_IN_COMMON_VALID, 'More in Common validated')

  console.log('[pipeline] Running Find Out Now ingestor...')
  runNodeScript('ingest-find-out-now.mjs', ['--out', FIND_OUT_NOW_RAW])
  const fonRawCount = verifyFile(FIND_OUT_NOW_RAW, 'Find Out Now raw')

  console.log('[pipeline] Validating Find Out Now...')
  runNodeScript('validate-polls.mjs', ['--in', FIND_OUT_NOW_RAW, '--accepted-out', FIND_OUT_NOW_VALID, '--quarantine-out', FIND_OUT_NOW_QUARANTINE, '--report-out', FIND_OUT_NOW_REPORT])
  const fonCount = verifyFile(FIND_OUT_NOW_VALID, 'Find Out Now validated')

  console.log('[pipeline] Running JL Partners ingestor...')
  runNodeScript('ingest-jl-partners.mjs', ['--out', JL_PARTNERS_RAW])
  const jlpRawCount = verifyFile(JL_PARTNERS_RAW, 'JL Partners raw')

  console.log('[pipeline] Validating JL Partners...')
  runNodeScript('validate-polls.mjs', ['--in', JL_PARTNERS_RAW, '--accepted-out', JL_PARTNERS_VALID, '--quarantine-out', JL_PARTNERS_QUARANTINE, '--report-out', JL_PARTNERS_REPORT])
  const jlpCount = verifyFile(JL_PARTNERS_VALID, 'JL Partners validated')

  console.log('[pipeline] Running Focaldata ingestor...')
  runNodeScript('ingest-focaldata.mjs', ['--out', FOCALDATA_RAW])
  const focaldataRawCount = verifyFile(FOCALDATA_RAW, 'Focaldata raw')

  console.log('[pipeline] Validating Focaldata...')
  runNodeScript('validate-polls.mjs', [
    '--in', FOCALDATA_RAW,
    '--accepted-out', FOCALDATA_VALID,
    '--quarantine-out', FOCALDATA_QUARANTINE,
    '--report-out', FOCALDATA_REPORT,
  ])
  const focaldataCount = verifyFile(FOCALDATA_VALID, 'Focaldata validated')

  // Deltapoll is temporarily disabled because it is still breaking the pipeline.
  // console.log('[pipeline] Running Deltapoll ingestor...')
  // runNodeScript('ingest-deltapoll.mjs', ['--out', DELTAPOLL_RAW])
  // const deltapollRawCount = verifyFile(DELTAPOLL_RAW, 'Deltapoll raw')

  // console.log('[pipeline] Validating Deltapoll...')
  // runNodeScript('validate-polls.mjs', ['--in', DELTAPOLL_RAW, '--accepted-out', DELTAPOLL_VALID, '--quarantine-out', DELTAPOLL_QUARANTINE, '--report-out', DELTAPOLL_REPORT])
  // const deltapollCount = verifyFile(DELTAPOLL_VALID, 'Deltapoll validated')

  console.log('[pipeline] Merging validated sources...')
  runNodeScript('merge-polls.mjs', [
    '--wiki', WIKI_VALID,
    '--yougov', YOUGOV_VALID,
    '--opinium', OPINIUM_VALID,
    '--more-in-common', MORE_IN_COMMON_VALID,
    '--find-out-now', FIND_OUT_NOW_VALID,
    '--jl-partners', JL_PARTNERS_VALID,
    '--focaldata', FOCALDATA_VALID,
    // '--deltapoll', DELTAPOLL_VALID,
    '--out', MERGED_OUT,
    '--quarantine-out', MERGED_QUARANTINE,
    '--report-out', MERGED_REPORT
  ])
  const mergedCount = verifyFile(MERGED_OUT, 'Merged')
  renderCoverageReport(MERGED_REPORT, COVERAGE_REPORT)

  console.log('[pipeline] Done.')
  console.log(`[pipeline] Wikipedia raw/validated: ${wikiRawCount}/${wikiCount}`)
  console.log(`[pipeline] YouGov raw/validated: ${yougovRawCount}/${yougovCount}`)
  console.log(`[pipeline] Opinium raw/validated: ${opiniumRawCount}/${opiniumCount}`)
  console.log(`[pipeline] More in Common raw/validated: ${micRawCount}/${micCount}`)
  console.log(`[pipeline] Find Out Now raw/validated: ${fonRawCount}/${fonCount}`)
  console.log(`[pipeline] JL Partners raw/validated: ${jlpRawCount}/${jlpCount}`)
  console.log(`[pipeline] Focaldata raw/validated: ${focaldataRawCount}/${focaldataCount}`)
  // console.log(`[pipeline] Deltapoll raw/validated: ${deltapollRawCount}/${deltapollCount}`)
  console.log(`[pipeline] Merged records: ${mergedCount}`)
  console.log(`[pipeline] Coverage report: ${COVERAGE_REPORT}`)
}

try { main() } catch (error) {
  console.error('[pipeline] Failed:', error.message)
  process.exit(1)
}
