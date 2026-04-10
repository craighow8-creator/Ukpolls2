export default async function ingestNotifier(payload = {}) {
  const webhookUrl = String(process.env.POLITISCOPE_SLACK_WEBHOOK_URL || '').trim()
  if (!webhookUrl) return

  const status = String(payload.status || '').trim().toLowerCase()
  const isSuccess = status === 'success'
  const lines = [
    isSuccess ? 'Poll ingest succeeded' : 'Poll ingest failed',
    `Timestamp: ${payload.timestamp || 'unknown'}`,
    `API base: ${payload.apiBase || 'unknown'}`,
    `Total fetched: ${payload.totalFetched ?? 0}`,
    `Dropped invalid rows: ${payload.droppedInvalidRows ?? 0}`,
    `Overwrite result: ${payload.overwriteResult ? JSON.stringify(payload.overwriteResult) : 'n/a'}`,
  ]

  if (!isSuccess && payload.error) {
    lines.push(`Error: ${payload.error}`)
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: lines.join('\n'),
      }),
    })
  } catch (error) {
    console.warn('[ingest-notifier] Slack notification failed', error)
  }
}
