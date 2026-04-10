import { POLICY_RECORDS } from './policyRecords'
import { POLICY_AREAS } from './policyTaxonomy'

function norm(value) {
  return String(value || '').trim().toLowerCase()
}

export function getPartyPolicies(partyName, area, records = POLICY_RECORDS) {
  const partyKey = norm(partyName)
  const areaKey = area ? norm(area) : null

  return (records || [])
    .filter((record) => norm(record.party) === partyKey)
    .filter((record) => !areaKey || norm(record.area) === areaKey)
}

export function getAvailablePolicyAreasForParty(partyName, records = POLICY_RECORDS) {
  const available = new Set(getPartyPolicies(partyName, null, records).map((record) => record.area))
  return POLICY_AREAS.filter((area) => available.has(area))
}

export function groupPoliciesByArea(partyName, records = POLICY_RECORDS) {
  return getPartyPolicies(partyName, null, records).reduce((groups, record) => {
    const area = record.area || 'other'
    groups[area] = groups[area] || []
    groups[area].push(record)
    return groups
  }, {})
}
