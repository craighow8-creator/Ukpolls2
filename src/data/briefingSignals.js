export const briefingSignals = [
  {
    id: 'green-polanski-win',
    date: '2025-09-02',
    party: 'Green',
    type: 'leadership',
    title: 'Zack Polanski wins Green leadership',
    summary:
      'The Green leadership change gave the party a clearer media identity and helped turn a soft rise into a more serious national breakthrough story.',
    weight: 0.95,
    tags: ['leadership', 'greens', 'membership'],
  },
  {
    id: 'green-membership-surge',
    date: '2025-10-01',
    party: 'Green',
    type: 'membership',
    title: 'Green membership surge becomes a real political signal',
    summary:
      'Rapid membership growth moved the Greens out of novelty territory and made them look more like a durable insurgent force.',
    weight: 0.85,
    tags: ['greens', 'membership', 'organisation'],
  },
  {
    id: 'gorton-denton-byelection',
    date: '2026-02-13',
    party: 'Green',
    type: 'byelection',
    title: 'Greens win Gorton and Denton by-election',
    summary:
      'That result changed the tone around the Greens by giving them a Westminster breakthrough moment rather than just a polling story.',
    weight: 1.0,
    tags: ['greens', 'byelection', 'westminster'],
  },
  {
    id: 'reform-lowe-split',
    date: '2026-03-07',
    party: 'Reform UK',
    type: 'split',
    title: 'Reform split around Rupert Lowe',
    summary:
      'The rupture around Rupert Lowe created the first serious test of whether Reform can hold together under pressure as a national vehicle.',
    weight: 1.0,
    tags: ['reform', 'split', 'rupert-lowe', 'restore-britain'],
  },
  {
    id: 'restore-britain-councillor-breakaway',
    date: '2026-03-28',
    party: 'Restore Britain',
    type: 'defection',
    title: 'Former Reform councillors break away toward Restore Britain',
    summary:
      'The councillor defections made the Reform split feel organisational as well as personal, which matters more than a one-week row.',
    weight: 0.8,
    tags: ['restore-britain', 'reform', 'defections', 'councils'],
  },
  {
    id: 'reform-moderation-shift',
    date: '2026-01-15',
    party: 'Reform UK',
    type: 'policy',
    title: 'Reform softens parts of its economic posture',
    summary:
      'Moves to reassure around institutional stability suggested Reform was trying to look more government-adjacent and less purely insurgent.',
    weight: 0.7,
    tags: ['reform', 'policy', 'economy', 'obr'],
  },
  {
    id: 'labour-winter-fuel-retreat',
    date: '2025-09-15',
    party: 'Labour',
    type: 'retreat',
    title: 'Labour forced into visible retreat on winter fuel',
    summary:
      'The retreat fed the idea that Labour was governing defensively and struggling to control the political weather.',
    weight: 0.75,
    tags: ['labour', 'government', 'retreat', 'winter-fuel'],
  },
  {
    id: 'labour-welfare-reform-retreat',
    date: '2025-11-18',
    party: 'Labour',
    type: 'retreat',
    title: 'Labour welfare reform push runs into resistance',
    summary:
      'That added to a broader pattern of Labour appearing squeezed between fiscal caution, party management and voter dissatisfaction.',
    weight: 0.8,
    tags: ['labour', 'welfare', 'government', 'retreat'],
  },
  {
    id: 'labour-tax-row',
    date: '2026-01-10',
    party: 'Labour',
    type: 'tax',
    title: 'Tax and spending rows deepen Labour pressure',
    summary:
      'Repeated rows over tax and spending choices reinforced the sense that Labour had not settled on a confident governing story.',
    weight: 0.7,
    tags: ['labour', 'tax', 'government', 'economy'],
  },
  {
    id: 'conservative-local-collapse',
    date: '2025-05-02',
    party: 'Conservative',
    type: 'elections',
    title: 'Conservatives slump in local elections',
    summary:
      'The local election collapse confirmed the Conservatives were no longer the automatic vessel for anti-government frustration.',
    weight: 0.9,
    tags: ['conservatives', 'locals', 'elections'],
  },
  {
    id: 'conservative-leakage-to-reform',
    date: '2025-07-01',
    party: 'Conservative',
    type: 'realignment',
    title: 'Conservative coalition keeps leaking to Reform',
    summary:
      'The central strategic problem for the Conservatives remains how to stop Reform turning protest energy into a semi-permanent realignment.',
    weight: 0.85,
    tags: ['conservatives', 'reform', 'realignment'],
  },
  {
    id: 'may-2026-election-test',
    date: '2026-05-07',
    party: 'system',
    type: 'milestone',
    title: 'May 2026 elections become the next major test',
    summary:
      'Holyrood, the Senedd and English local contests are the next moment when narrative, organisation and polling all collide in public.',
    weight: 0.9,
    tags: ['elections', 'holyrood', 'senedd', 'locals'],
  },
]

export function getSignalsInRange({
  signals = briefingSignals,
  fromDate = null,
  toDate = null,
  parties = [],
  tags = [],
} = {}) {
  const fromTs = fromDate ? Date.parse(`${fromDate}T00:00:00Z`) : null
  const toTs = toDate ? Date.parse(`${toDate}T23:59:59Z`) : null
  const partySet = new Set((parties || []).map((p) => String(p || '').toLowerCase()))
  const tagSet = new Set((tags || []).map((t) => String(t || '').toLowerCase()))

  return (signals || []).filter((signal) => {
    const ts = Date.parse(`${signal.date}T00:00:00Z`)
    if (!Number.isFinite(ts)) return false
    if (fromTs != null && ts < fromTs) return false
    if (toTs != null && ts > toTs) return false

    if (partySet.size) {
      const party = String(signal.party || '').toLowerCase()
      if (!partySet.has(party)) return false
    }

    if (tagSet.size) {
      const signalTags = (signal.tags || []).map((t) => String(t).toLowerCase())
      const hasTag = signalTags.some((tag) => tagSet.has(tag))
      if (!hasTag) return false
    }

    return true
  })
}

export function getTopSignals({
  signals = briefingSignals,
  limit = 5,
  parties = [],
  tags = [],
  fromDate = null,
  toDate = null,
} = {}) {
  return getSignalsInRange({ signals, fromDate, toDate, parties, tags })
    .sort((a, b) => {
      const weightDiff = (b.weight || 0) - (a.weight || 0)
      if (weightDiff !== 0) return weightDiff
      return String(b.date).localeCompare(String(a.date))
    })
    .slice(0, limit)
}