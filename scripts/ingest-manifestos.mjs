#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { POLICY_TAXONOMY } from '../src/data/policy/policyTaxonomy.js'
import { getSourcePriority, normalizeSourceType } from '../src/data/policy/sourcePriority.js'
import { getStanceLabel } from '../src/data/policy/stanceUtils.js'

// Manifesto ingestion scaffold.
// This is intentionally deterministic and review-first: it shapes source text
// into policyRecords-like objects, but every generated record should still be
// checked before being saved to the backend content section.

const UPDATED_AT = new Date().toISOString().slice(0, 10)

function slug(value) {
  return String(value || 'policy')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseArgs(argv) {
  const args = {
    party: 'Unknown party',
    sourceTitle: 'Official manifesto',
    sourceUrl: '',
    sourceType: 'manifesto',
    input: '',
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--party') args.party = argv[++i] || args.party
    else if (arg === '--source-title') args.sourceTitle = argv[++i] || args.sourceTitle
    else if (arg === '--source-url') args.sourceUrl = argv[++i] || args.sourceUrl
    else if (arg === '--source-type') args.sourceType = argv[++i] || args.sourceType
    else if (arg === '--input') args.input = argv[++i] || args.input
  }

  return args
}

async function loadSourceText(inputPath) {
  if (!inputPath || inputPath === '-') {
    return new Promise((resolve) => {
      let input = ''
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', (chunk) => {
        input += chunk
      })
      process.stdin.on('end', () => resolve(input))
    })
  }

  return readFile(inputPath, 'utf8')
}

function splitIntoSections(rawText) {
  const text = String(rawText || '').replace(/\r/g, '').trim()
  if (!text) return []

  const sections = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.replace(/\s+/g, ' ').trim())
    .filter((chunk) => chunk.length > 60)

  if (sections.length > 1) return sections

  const headingSections = text
    .split(/\n(?=.{0,90}(?:\n|$))/)
    .map((chunk) => chunk.replace(/\s+/g, ' ').trim())
    .filter((chunk) => chunk.length > 60)

  return headingSections.length ? headingSections : [text.replace(/\s+/g, ' ').trim()]
}

function scoreTaxonomyMatch(text, area, subtopics) {
  const lower = String(text || '').toLowerCase()
  const terms = [area, ...subtopics]
  return terms.reduce((score, term) => {
    const safe = String(term).toLowerCase()
    if (!safe) return score
    return lower.includes(safe) ? score + (safe === area ? 2 : 1) : score
  }, 0)
}

function mapToTaxonomy(text) {
  const ranked = Object.entries(POLICY_TAXONOMY)
    .map(([area, subtopics]) => ({
      area,
      score: scoreTaxonomyMatch(text, area, subtopics),
      topic:
        subtopics.find((subtopic) => String(text || '').toLowerCase().includes(subtopic.toLowerCase())) ||
        subtopics[0] ||
        area,
    }))
    .sort((a, b) => b.score - a.score)

  return ranked[0]?.score > 0 ? ranked[0] : { area: 'democracy', topic: 'constitutional reform', score: 0 }
}

function summarize(chunk) {
  const sentence = String(chunk || '').split(/(?<=[.!?])\s+/)[0] || chunk
  return sentence.length > 170 ? `${sentence.slice(0, 167).trim()}...` : sentence.trim()
}

function detailsFromChunk(chunk) {
  return String(chunk || '')
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter((line) => line.length > 20)
    .slice(0, 4)
}

function generatePolicyRecord({ party, sourceTitle, sourceUrl, sourceType, chunk, index }) {
  const taxonomy = mapToTaxonomy(chunk)
  const normalizedSourceType = normalizeSourceType(sourceType)
  const source = {
    type: normalizedSourceType,
    title: sourceTitle,
    url: sourceUrl,
    priority: getSourcePriority(normalizedSourceType),
  }

  return {
    id: `${slug(party)}-${taxonomy.area}-${slug(taxonomy.topic)}-${index + 1}`,
    party,
    area: taxonomy.area,
    topic: taxonomy.topic,
    title: taxonomy.topic,
    summary: summarize(chunk),
    stanceScore: 0,
    stanceLabel: getStanceLabel(0),
    pledgeType: normalizedSourceType === 'manifesto' ? 'manifesto_pledge' : 'policy_position',
    status: 'active',
    details: detailsFromChunk(chunk),
    rawClaims: [
      {
        sourceTitle,
        claim: chunk,
      },
    ],
    sources: [source],
    confidence: taxonomy.score > 0 ? 'needs-review' : 'low',
    coverage: 'machine-shaped-review-required',
    updatedAt: UPDATED_AT,
  }
}

export async function shapeManifestoText({
  party,
  sourceTitle,
  sourceUrl = '',
  sourceType = 'manifesto',
  rawText,
}) {
  const chunks = splitIntoSections(rawText)
  return chunks.map((chunk, index) =>
    generatePolicyRecord({ party, sourceTitle, sourceUrl, sourceType, chunk, index })
  )
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = parseArgs(process.argv)
  const rawText = await loadSourceText(args.input)
  const sourceTitle = args.sourceTitle || basename(args.input || 'Official manifesto')
  const records = await shapeManifestoText({ ...args, sourceTitle, rawText })
  process.stdout.write(`${JSON.stringify(records, null, 2)}\n`)
}
