/**
 * Entity Layer — src/data/entities/index.js
 *
 * Read-only projections over the existing flat data.js structure.
 * data.js is NEVER modified. This layer only reshapes what already exists.
 *
 * Exports:
 *   getParty(name)       — party polling, trend, demographic breakdown
 *   getLeader(name)      — leader approval, bio, policy positions
 *   getCouncil(name)     — council summary and available detail
 *   getDemographic(key)  — demographic segment voting breakdown
 *   getByElection(id)    — by-election full record
 *   getRegion(id)        — election region with council list
 *
 * Each getter returns { summary, breakdown, detail } where:
 *   summary   — the minimum needed to render a card
 *   breakdown — structured sub-data for a screen view
 *   detail    — full available data; null fields mean data does not exist
 *
 * If an entity is not found, getters return null — callers must guard.
 */

export { getParty }       from './party.js'
export { getLeader }      from './leader.js'
export { getCouncil }     from './council.js'
export { getDemographic } from './demographic.js'
export { getByElection }  from './byelection.js'
export { getRegion }      from './region.js'
