export function getStanceLabel(score) {
  const value = Number(score)
  if (value <= -4) return 'Maximum restriction'
  if (value <= -2) return 'Hard restriction'
  if (value <= 1) return 'Controlled'
  if (value <= 3) return 'Moderate'
  return 'Open / liberal'
}
