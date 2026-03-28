export const fmt = (n) =>
  n >= 1000000 ? (n / 1000000).toFixed(1) + 'm' :
  n >= 1000    ? (n / 1000).toFixed(0) + 'k'    : String(n)

export const daysTo = (dateStr) =>
  Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / 86400000))

export const impliedProb = (str) => {
  const [n, d] = str.split('/').map(Number)
  return Math.round(d / (n + d) * 100)
}

export const LS = {
  get: (k)   => { try { return localStorage.getItem(k) }   catch (e) { return null } },
  set: (k,v) => { try { localStorage.setItem(k, v) }       catch (e) {} },
}

export function getDeviceId() {
  let id = LS.get('politiscope_device_id')
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    LS.set('politiscope_device_id', id)
  }
  return id
}

export const getMyVote  = ()      => LS.get('my_vote')
export const setMyVote  = (party) => LS.set('my_vote', party)
