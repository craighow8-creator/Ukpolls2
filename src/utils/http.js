export async function parseJsonResponse(res, label = 'Request', options = {}) {
  const { allowEmpty = false } = options
  const contentType = res?.headers?.get('content-type') || ''

  if (!res?.ok) {
    const text = await res?.text?.().catch(() => '')
    throw new Error(`${label} failed (${res?.status || 'unknown'})${text ? `: ${text.slice(0, 160)}` : ''}`)
  }

  if (!contentType.includes('application/json')) {
    const length = res?.headers?.get('content-length')
    if (allowEmpty && (res?.status === 204 || length === '0' || length == null)) return {}
    const text = await res?.text?.().catch(() => '')
    throw new Error(`${label} returned non-JSON (${contentType || 'unknown'})${text ? `: ${text.slice(0, 160)}` : ''}`)
  }

  return res.json()
}
