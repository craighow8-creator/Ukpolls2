export const POLLSTER_REGISTRY = {
  yougov: {
    id: 'yougov',
    label: 'YouGov',
    aliases: ['yougov', 'yougov plc'],
    bpc: true,
  },
  ipsos: {
    id: 'ipsos',
    label: 'Ipsos',
    aliases: ['ipsos'],
    bpc: true,
  },
  more_in_common: {
    id: 'more_in_common',
    label: 'More in Common',
    aliases: ['more in common'],
    bpc: true,
  },
  opinium: {
    id: 'opinium',
    label: 'Opinium',
    aliases: ['opinium'],
    bpc: true,
  },
  techne: {
    id: 'techne',
    label: 'Techne',
    aliases: ['techne'],
    bpc: true,
  },
  find_out_now: {
    id: 'find_out_now',
    label: 'Find Out Now',
    aliases: ['find out now', 'findoutnow'],
    bpc: true,
  },
  survation: {
    id: 'survation',
    label: 'Survation',
    aliases: ['survation'],
    bpc: true,
  },
  focaldata: {
    id: 'focaldata',
    label: 'Focaldata',
    aliases: ['focaldata'],
    bpc: true,
  },
  verian: {
    id: 'verian',
    label: 'Verian',
    aliases: ['verian', 'kantar'],
    bpc: true,
  },
  jl_partners: {
    id: 'jl_partners',
    label: 'JL Partners',
    aliases: ['jl partners', 'j.l. partners'],
    bpc: true,
  },
  deltapoll: {
    id: 'deltapoll',
    label: 'Deltapoll',
    aliases: ['deltapoll'],
    bpc: true,
  },
  savanta: {
    id: 'savanta',
    label: 'Savanta',
    aliases: ['savanta'],
    bpc: true,
  },
  redfield_wilton: {
    id: 'redfield_wilton',
    label: 'Redfield & Wilton',
    aliases: ['redfield & wilton', 'redfield and wilton', 'redfield'],
    bpc: true,
  },
  lord_ashcroft: {
    id: 'lord_ashcroft',
    label: 'Lord Ashcroft Polls',
    aliases: ['lord ashcroft polls', 'lord ashcroft', 'ashcroft'],
    bpc: false,
  },
  bmg: {
    id: 'bmg',
    label: 'BMG Research',
    aliases: ['bmg', 'bmg research'],
    bpc: true,
  },
  freshwater: {
    id: 'freshwater',
    label: 'Freshwater Strategy',
    aliases: ['freshwater strategy', 'freshwater'],
    bpc: false,
  },
  good_growth_foundation: {
    id: 'good_growth_foundation',
    label: 'Good Growth Foundation',
    aliases: ['good growth foundation'],
    bpc: false,
  },
  whitestone: {
    id: 'whitestone',
    label: 'Whitestone Insight',
    aliases: ['whitestone insight', 'whitestone'],
    bpc: false,
  },
  stonehaven: {
    id: 'stonehaven',
    label: 'Stonehaven',
    aliases: ['stonehaven'],
    bpc: false,
  },
  we_think: {
    id: 'we_think',
    label: 'We Think',
    aliases: ['we think'],
    bpc: false,
  },
  stack_data_strategy_mrp: {
    id: 'stack_data_strategy_mrp',
    label: 'Stack Data Strategy (MRP)',
    aliases: ['stack data strategy', 'stack data strategy (mrp)'],
    bpc: false,
  },
}

function clean(value) {
  return String(value || '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const FLAT = Object.values(POLLSTER_REGISTRY).flatMap((entry) =>
  entry.aliases.map((alias) => ({ alias: clean(alias), entry })),
)

export function resolvePollster(rawLabel) {
  const cleaned = clean(rawLabel)
  if (!cleaned) return null

  const exact = FLAT.find((item) => item.alias === cleaned)
  if (exact) return exact.entry

  const partial = FLAT.find((item) => cleaned.includes(item.alias))
  if (partial) return partial.entry

  return null
}

export function normalisePollster(rawLabel) {
  const resolved = resolvePollster(rawLabel)
  return resolved?.label || null
}

export function pollsterId(rawLabel) {
  const resolved = resolvePollster(rawLabel)
  return resolved?.id || null
}
