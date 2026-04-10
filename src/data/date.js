export function parseAppDate(value) {
  if (!value) return null

  const text = String(value).trim()
  if (!text) return null

  // ISO / YYYY-MM-DD / timestamp-friendly
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const d = new Date(text)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
    const [dd, mm, yyyy] = text.split('-').map(Number)
    const d = new Date(yyyy, mm - 1, dd)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // Poll-style ranges like "15-16 Mar" or "5–11 Mar"
  if (/^\d{1,2}\s*[-–]\s*\d{1,2}\s+[A-Za-z]{3,9}$/.test(text)) {
    const endPart = text.split(/[-–]/)[1].trim()
    const d = new Date(`${endPart} 2026`)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // Poll-style single day like "11 Mar"
  if (/^\d{1,2}\s+[A-Za-z]{3,9}$/.test(text)) {
    const d = new Date(`${text} 2026`)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const d = new Date(text)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatUKDate(value) {
  if (!value) return ''
  const d = parseAppDate(value)
  if (!d) return String(value)

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

export function formatMonthShort(value) {
  if (!value) return ''
  const d = parseAppDate(value)
  if (!d) return String(value)
  return d.toLocaleDateString('en-GB', { month: 'short' })
}

export function formatRelativeTime(value) {
  if (!value) return ''
  const d = parseAppDate(value)
  if (!d) return ''

  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return formatUKDate(d)
}
