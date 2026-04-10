import { normalisePollster, resolvePollster } from './pollsterRegistry.mjs'

function cleanSourceLabel(value) {
  return String(value || '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function mapPollster(rawLabel) {
  return normalisePollster(rawLabel)
}

export function extractClient(rawLabel, canonicalPollster) {
  const cleaned = cleanSourceLabel(rawLabel)
  if (!cleaned || !canonicalPollster) return null

  let remainder = cleaned

  remainder = remainder.replace(new RegExp(canonicalPollster.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
  remainder = remainder.replace(/^[-–—/|:,()\s]+/, '').replace(/[-–—/|:,()\s]+$/, '')

  if (!remainder) return null

  const useless = [
    'voting intention',
    'westminster voting intention',
    'general election voting intention',
    'poll',
    'polling',
    'uk',
  ]

  const reduced = remainder
    .split(/[/|–—,-]+/)
    .map((part) => part.trim())
    .find((part) => {
      if (!part) return false
      const lower = part.toLowerCase()
      return !useless.includes(lower)
    })

  return reduced || remainder || null
}

export function getPollsterMeta(rawLabel) {
  return resolvePollster(rawLabel)
}
