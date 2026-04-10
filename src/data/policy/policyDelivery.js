// Delivery tracking foundation for future promise-monitoring.
// These records intentionally mirror policy record ids so the UI/backend can
// later join manifesto commitments to delivery status without rewriting data.
export const POLICY_DELIVERY = [
  {
    id: 'lab-immigration-legal',
    party: 'Labour',
    status: 'partial',
    notes: 'Student dependant restrictions and salary threshold changes are in place; wider skills and enforcement reform remains ongoing.',
    sources: [],
    updatedAt: '2026-04-10',
  },
  {
    id: 'con-immigration-cap',
    party: 'Conservative',
    status: 'not-in-government',
    notes: 'Policy retained as an opposition benchmark rather than a live delivery programme.',
    sources: [],
    updatedAt: '2026-04-10',
  },
]
