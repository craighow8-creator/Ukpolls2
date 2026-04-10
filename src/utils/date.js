export function parseAppDate(value) {
  if (!value) return null

  const text = String(value).trim()
  if (!text) return null

  // YYYY-MM-DD or ISO-ish
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

  // Poll-style ranges like "15-16 Mar" or "5-11 Mar"
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
  if (!d) return value

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}-${month}-${year}`
}
