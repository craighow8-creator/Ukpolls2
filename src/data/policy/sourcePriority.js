// Source ranking for policy intelligence records.
// Higher scores win when the same policy claim appears in multiple places.
export const SOURCE_PRIORITY = {
  official_policy_paper: 100,
  manifesto: 90,
  official_policy_page: 80,
  official_pledge_page: 70,
  speech: 60,
  official_speech: 60,
  maintained_analysis: 50,
  analysis: 45,
  inference: 20,
}

const TYPE_ALIASES = {
  'policy-paper': 'official_policy_paper',
  policy: 'official_policy_page',
  maintained: 'maintained_analysis',
  official_policy_paper: 'official_policy_paper',
  official_policy_page: 'official_policy_page',
  official_pledge_page: 'official_pledge_page',
  official_speech: 'speech',
}

export function normalizeSourceType(type = 'inference') {
  return TYPE_ALIASES[type] || type || 'inference'
}

export function getSourcePriority(type = 'inference') {
  const normalized = normalizeSourceType(type)
  return SOURCE_PRIORITY[normalized] ?? SOURCE_PRIORITY.inference
}

export function prioritizeSources(sources = []) {
  return [...(sources || [])]
    .filter(Boolean)
    .map((source) => {
      const type = normalizeSourceType(source.type)
      return {
        ...source,
        type,
        priority: Number.isFinite(Number(source.priority))
          ? Number(source.priority)
          : getSourcePriority(type),
      }
    })
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
}

export function chooseControllingSource(sources = []) {
  return prioritizeSources(sources)[0] || null
}

// Keeps raw claims available for audit while exposing the strongest source as
// the controlling reference for display and future conflict resolution.
export function resolveSourceEvidence({ sources = [], rawClaims = [] }) {
  const rankedSources = prioritizeSources(sources)
  return {
    sources: rankedSources,
    controllingSource: rankedSources[0] || null,
    rawClaims: Array.isArray(rawClaims) ? rawClaims.filter(Boolean) : [],
  }
}
