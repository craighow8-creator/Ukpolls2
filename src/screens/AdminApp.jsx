import React, { useState, useEffect, useRef } from 'react'
import { saveSection, loadTimestamps, formatTs, getData, clearAll } from '../data/store.js'
import { API_BASE } from '../constants.js'

const GOOGLE_CLIENT_ID = '427686428321-pcb44g2h03ahesjsejmo9nqodrkehn7c.apps.googleusercontent.com'
const ALLOWED_EMAILS   = ['craighow8@googlemail.com']

const C = {
  hi:   '#ffffff',
  mid:  'rgba(255,255,255,0.65)',
  lo:   'rgba(255,255,255,0.45)',
  dim:  'rgba(255,255,255,0.18)',
  card: 'rgba(255,255,255,0.06)',
  bdr:  'rgba(255,255,255,0.10)',
}

// ── Helpers ───────────────────────────────────────────────────────

function AdminInput({ label, value, onChange, type = 'text', multiline, min, max, required }) {
  const [touched, setTouched] = useState(false)

  const getError = () => {
    if (required && (!value || String(value).trim() === '')) return 'Required'
    if (type === 'number' && value !== '' && value !== null && value !== undefined) {
      const n = Number(value)
      if (Number.isNaN(n)) return 'Must be a number'
      if (min !== undefined && n < min) return `Min ${min}`
      if (max !== undefined && n > max) return `Max ${max}`
    }
    return null
  }

  const error = touched ? getError() : null

  const style = {
    width: '100%',
    background: 'rgba(255,255,255,0.10)',
    border: `1px solid ${error ? '#ff6b8a' : 'rgba(255,255,255,0.14)'}`,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 14,
    color: C.hi,
    outline: 'none',
    fontFamily: "'Outfit', sans-serif",
    resize: multiline ? 'vertical' : 'none',
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.lo, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: '#ff6b8a', marginLeft: 3 }}>*</span>}
      </div>

      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          style={style}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          style={style}
        />
      )}

      {error && <div style={{ fontSize: 11, color: '#ff6b8a', fontWeight: 600, marginTop: 4 }}>{error}</div>}
    </div>
  )
}

function SaveBtn({ onClick, saving, label = 'Save changes' }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        background: saving ? C.dim : '#12B7D4',
        border: 'none',
        borderRadius: 999,
        padding: '11px 28px',
        fontSize: 14,
        fontWeight: 700,
        color: '#fff',
        cursor: saving ? 'wait' : 'pointer',
        fontFamily: "'Outfit', sans-serif",
        marginTop: 4,
      }}
    >
      {saving ? 'Saving…' : label}
    </button>
  )
}

function TsLabel({ ts }) {
  if (!ts) return null
  const label = formatTs(ts)
  if (!label) return null

  return (
    <div style={{ fontSize: 12, color: '#4dd98a', fontWeight: 600, marginBottom: 14 }}>
      ✓ Last saved: {label}
    </div>
  )
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div
      style={{
        marginBottom: 16,
        fontSize: 13,
        color: '#ffb8c6',
        background: 'rgba(228,0,59,0.14)',
        border: '1px solid rgba(228,0,59,0.28)',
        borderRadius: 12,
        padding: '12px 14px',
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  )
}

function Section({ title, children }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginBottom: 10, background: C.card, borderRadius: 18, border: `1px solid ${C.bdr}`, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: C.hi }}>{title}</div>
        <div style={{ fontSize: 18, color: C.lo, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</div>
      </div>
      {open && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
    </div>
  )
}

function toNumberOrZero(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function toOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toPollIdPart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const FRESHNESS_POLLSTERS = [
  'YouGov',
  'More in Common',
  'Find Out Now',
  'Opinium',
  'Lord Ashcroft Polls',
  'Focaldata',
]

function parseIsoDate(value) {
  const text = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const [yyyy, mm, dd] = text.split('-').map(Number)
  const date = new Date(Date.UTC(yyyy, mm - 1, dd))
  return Number.isNaN(date.getTime()) ? null : date
}

function getPollUsableDate(poll) {
  return poll?.publishedAt || poll?.fieldworkEnd || poll?.fieldworkStart || null
}

function getFreshnessStatus(daysOld, options = {}) {
  const checkedRecently = !!options.checkedRecently
  if (daysOld == null) return { label: 'Needs review', color: '#8f9bb3' }
  if (daysOld <= 3) return { label: 'Refreshed recently', color: '#4dd98a' }
  if (daysOld <= 7) return { label: 'Needs review', color: '#f6c85f' }
  if (checkedRecently) return { label: 'Reviewed', color: '#5fb6ff' }
  return { label: 'Needs review', color: '#ff6b8a' }
}

function getIngestRunStatus(status) {
  const value = String(status || '').trim().toLowerCase()
  if (value === 'success') return { label: 'Success', color: '#4dd98a' }
  if (value === 'error') return { label: 'Error', color: '#ff6b8a' }
  return { label: 'Needs review', color: '#8f9bb3' }
}

function formatAdminDateTime(value) {
  if (!value) return 'No timestamp'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAdminDate(value) {
  if (!value) return 'No timestamp'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function daysSinceAdmin(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return Math.floor((Date.now() - date.getTime()) / 86400000)
}

function firstPresent(...values) {
  return values.find((value) => value !== null && value !== undefined && String(value).trim() !== '') || null
}

function compactNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return value == null || value === '' ? 'Not loaded' : String(value)
  return new Intl.NumberFormat('en-GB').format(number)
}

function statusChipStyle(status) {
  const value = String(status || '').toLowerCase()
  const palette = {
    ok: { color: '#4dd98a', background: 'rgba(77,217,138,0.14)', border: 'rgba(77,217,138,0.26)' },
    'refreshed recently': { color: '#4dd98a', background: 'rgba(77,217,138,0.14)', border: 'rgba(77,217,138,0.26)' },
    review: { color: '#ffd88a', background: 'rgba(246,200,95,0.13)', border: 'rgba(246,200,95,0.26)' },
    'needs review': { color: '#ffd88a', background: 'rgba(246,200,95,0.13)', border: 'rgba(246,200,95,0.26)' },
    stale: { color: '#ff9aac', background: 'rgba(228,0,59,0.14)', border: 'rgba(228,0,59,0.28)' },
    manual: { color: '#7dd8ea', background: 'rgba(18,183,212,0.12)', border: 'rgba(18,183,212,0.24)' },
    'maintained dataset': { color: '#7dd8ea', background: 'rgba(18,183,212,0.12)', border: 'rgba(18,183,212,0.24)' },
    'latest official estimate': { color: '#7dd8ea', background: 'rgba(18,183,212,0.12)', border: 'rgba(18,183,212,0.24)' },
  }
  return palette[value] || palette.review
}

function freshnessFromDate(value, { okDays = 3, staleDays = 14, manual = false } = {}) {
  if (manual) return 'Maintained dataset'
  const age = daysSinceAdmin(value)
  if (age == null) return 'Needs review'
  if (age <= okDays) return 'Refreshed recently'
  if (age > staleDays) return 'Needs review'
  return 'Needs review'
}

function latestPollDate(polls = []) {
  return (Array.isArray(polls) ? polls : [])
    .map((poll) => firstPresent(poll?.publishedAt, poll?.fieldworkEnd, poll?.fieldworkStart, poll?.date))
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null
}

function extractMarketRows(predictionMarkets) {
  if (Array.isArray(predictionMarkets)) return predictionMarkets
  if (Array.isArray(predictionMarkets?.rows)) return predictionMarkets.rows
  if (Array.isArray(predictionMarkets?.markets)) return predictionMarkets.markets
  return []
}

function extractNewsItems(newsItems) {
  if (Array.isArray(newsItems)) return newsItems
  if (Array.isArray(newsItems?.items)) return newsItems.items
  return []
}

function extractNewsMeta(newsItems) {
  if (newsItems && typeof newsItems === 'object' && !Array.isArray(newsItems)) {
    return newsItems.meta || newsItems
  }
  return {}
}

function getAdminAction(actions, key) {
  return actions && typeof actions === 'object' && actions[key] && typeof actions[key] === 'object'
    ? actions[key]
    : null
}

function adminActionResultLabel(action) {
  if (!action) return 'No action yet'
  if (action.preserved || action.partial) return 'Partial · preserved'
  return action.ok === false ? 'Failed' : 'OK'
}

function warningCount(action) {
  return Array.isArray(action?.warnings) ? action.warnings.length : 0
}

function readableWarnings(value) {
  return Array.isArray(value)
    ? value
        .map((warning) => (typeof warning === 'string' ? warning : warning?.message || warning?.error || ''))
        .map((warning) => warning.trim())
        .filter(Boolean)
    : []
}

function finiteIssueNumber(...values) {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return null
}

function buildPollIssues({ ingestStatus, action }) {
  const issues = []
  const droppedCount = finiteIssueNumber(action?.droppedCount, ingestStatus?.droppedInvalidRows, ingestStatus?.droppedCount)
  if (action?.preserved || ingestStatus?.preserved || ingestStatus?.status === 'partial') {
    issues.push('Partial ingest preserved existing poll data')
  } else if (action?.ok === false && action?.error) {
    issues.push(action.error)
  }
  if (droppedCount > 0) issues.push(`${compactNumber(droppedCount)} rows dropped`)
  issues.push(...readableWarnings(action?.warnings), ...readableWarnings(ingestStatus?.warnings))
  const sourceStatus = Array.isArray(action?.sourceStatus)
    ? action.sourceStatus
    : Array.isArray(ingestStatus?.sourceStatus)
      ? ingestStatus.sourceStatus
      : []
  const weakSources = sourceStatus
    .filter((source) => source?.status === 'failed' || source?.status === 'empty' || source?.zeroRows)
    .map((source) => `${source.source || 'Source'} ${source.status || 'needs review'}`)
  issues.push(...weakSources)
  return issues.slice(0, 3)
}

function buildMarketIssues({ failedSourceCount, action }) {
  const issues = []
  const failedCount = finiteIssueNumber(action?.failedSourceCount, failedSourceCount)
  if (action?.ok === false && action?.error) issues.push(action.error)
  if (failedCount > 0) issues.push(`${compactNumber(failedCount)} sources failed`)
  issues.push(...readableWarnings(action?.warnings))
  return issues.slice(0, 3)
}

function buildNewsIssues({ itemCount, sourceCount, action, warnings }) {
  const issues = []
  const stories = finiteIssueNumber(action?.itemCount, itemCount)
  const sources = finiteIssueNumber(action?.sourceCount, sourceCount)
  if (action?.ok === false && action?.error) issues.push(action.error)
  if (stories === 0) issues.push('No stories returned')
  if (sources !== null && sources > 0 && sources < 2) issues.push('Limited source coverage')
  issues.push(...readableWarnings(action?.warnings), ...readableWarnings(warnings))
  return issues.slice(0, 3)
}

function pollActionCounts(action) {
  if (!action) return 'No action yet'
  if (action.preserved) {
    return `Preserved existing ${compactNumber(action.existingRows)} rows · candidate ${compactNumber(action.newRows)} rows`
  }
  return `Fetched ${compactNumber(action.totalFetched)} · accepted ${compactNumber(action.acceptedCount)} · dropped ${compactNumber(action.droppedCount)}`
}

function sourceStatusSummary(sourceStatus) {
  const rows = Array.isArray(sourceStatus) ? sourceStatus : []
  if (!rows.length) return 'Not recorded'
  const weak = rows.filter((source) => source?.status === 'failed' || source?.status === 'empty' || source?.zeroRows)
  if (weak.length) {
    return weak.slice(0, 3).map((source) => `${source.source}: ${source.status}`).join(' · ')
  }
  return `${rows.length} sources checked`
}

function marketActionCounts(action) {
  if (!action) return 'No action yet'
  return `Markets ${compactNumber(action.marketCount)} · failed sources ${compactNumber(action.failedSourceCount)}`
}

function newsActionCounts(action) {
  if (!action) return 'No action yet'
  return `Stories ${compactNumber(action.itemCount)} · sources ${compactNumber(action.sourceCount)}`
}

function newsSourceHealthStatus(row) {
  if (row?.error) return 'Error'
  const fetched = Number(row?.fetched)
  const kept = Number(row?.kept)
  const final = Number(row?.final)
  if (!Number.isFinite(fetched) || fetched <= 0 || !Number.isFinite(kept) || kept <= 0) return 'Empty'
  if (kept < 2 || (Number.isFinite(final) && final <= 0)) return 'Limited'
  return 'OK'
}

function NewsSourceHealth({ sourceDiagnostics = [] }) {
  const rows = Array.isArray(sourceDiagnostics) ? sourceDiagnostics : []
  if (!rows.length) return null

  return (
    <div style={{ marginTop: 12, borderTop: `1px solid ${C.bdr}`, paddingTop: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 850, color: C.lo, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        Source health
      </div>
      <div style={{ display: 'grid', gap: 7 }}>
        {rows.map((row) => {
          const status = newsSourceHealthStatus(row)
          return (
            <div
              key={row.source || row.sourceUrl || JSON.stringify(row)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(82px, 1.1fr) repeat(4, minmax(42px, 0.5fr)) minmax(66px, 0.72fr)',
                gap: 8,
                alignItems: 'center',
                padding: '8px 9px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.045)',
                border: `1px solid ${C.bdr}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: C.hi, overflowWrap: 'anywhere' }}>
                {row.source || 'Source'}
              </div>
              {[
                ['Fetched', row.fetched],
                ['Kept', row.kept],
                ['Final', row.final],
                ['Rejected', row.rejected],
              ].map(([label, value]) => (
                <div key={label} style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: C.lo, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.hi, marginTop: 2 }}>
                    {compactNumber(value)}
                  </div>
                </div>
              ))}
              <HealthStatusChip status={status} />
              {row.error ? (
                <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: '#ffb8c6', lineHeight: 1.4 }}>
                  {row.error}
                </div>
              ) : null}
              {row.topRejectionReason ? (
                <div style={{ gridColumn: '1 / -1', fontSize: 11.5, color: C.lo, lineHeight: 1.4 }}>
                  Top drop: <span style={{ color: C.hi, fontWeight: 750 }}>{row.topRejectionReason}</span>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function fullRefreshCounts(action) {
  if (!action) return 'No action yet'
  const polls = action.steps?.polls || {}
  const markets = action.steps?.markets || {}
  const news = action.steps?.news || {}
  const pollText = polls.preserved
    ? `polls preserved ${compactNumber(polls.existingRows)}`
    : `Polls ${compactNumber(polls.acceptedCount)} accepted · ${compactNumber(polls.droppedCount)} dropped`
  return `${pollText} · markets ${compactNumber(markets.marketCount)} · news ${compactNumber(news.itemCount)}`
}

function formatDurationMs(value) {
  const ms = Number(value)
  if (!Number.isFinite(ms)) return 'Duration pending'
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`
  return `${Math.round((ms / 1000) * 10) / 10}s`
}

function formatDelta(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return `${number > 0 ? '+' : ''}${number.toFixed(1)}`
}

function getTopPollDiffMovers(diff, limit = 6) {
  return Array.isArray(diff?.parties)
    ? [...diff.parties]
        .filter((row) => row?.name && Number.isFinite(Number(row.delta)))
        .sort((a, b) => Math.abs(Number(b.delta)) - Math.abs(Number(a.delta)))
        .slice(0, limit)
    : []
}

async function runSaves(tasks) {
  for (const task of tasks) {
    await Promise.resolve(task())
  }
}

function HealthStatusChip({ status }) {
  const style = statusChipStyle(status)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '5px 10px',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: style.color,
        background: style.background,
        border: `1px solid ${style.border}`,
      }}
    >
      {status}
    </span>
  )
}

function CommandList({ commands = [], note }) {
  if (!commands.length && !note) return null
  return (
    <div style={{ marginTop: 14 }}>
      {commands.length ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {commands.map((command) => (
            <code
              key={command}
              style={{
                display: 'block',
                background: 'rgba(0,0,0,0.22)',
                border: `1px solid ${C.bdr}`,
                borderRadius: 10,
                padding: '9px 10px',
                color: '#d8f5ff',
                fontSize: 12,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {command}
            </code>
          ))}
        </div>
      ) : null}
      {note ? <div style={{ marginTop: 8, fontSize: 12, color: C.lo, lineHeight: 1.5 }}>{note}</div> : null}
    </div>
  )
}

function HealthCard({ title, status, summary, rows = [], issues = [], commands = [], note, action = null, extra = null }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 18, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.hi }}>{title}</div>
          {summary ? <div style={{ fontSize: 12, color: C.lo, lineHeight: 1.5, marginTop: 3 }}>{summary}</div> : null}
        </div>
        <HealthStatusChip status={status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {rows.map((row) => (
          <div
            key={`${title}-${row.label}`}
            style={{
              background: 'rgba(255,255,255,0.055)',
              border: `1px solid ${C.bdr}`,
              borderRadius: 12,
              padding: '10px 11px',
              minWidth: 0,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: C.lo, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              {row.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.hi, lineHeight: 1.35, overflowWrap: 'anywhere' }}>
              {row.value ?? 'Not loaded'}
            </div>
          </div>
        ))}
      </div>

      {issues.length ? (
        <div style={{ marginTop: 12, borderTop: `1px solid ${C.bdr}`, paddingTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 850, color: '#ffcf8a', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>
            Issues
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 5, color: '#ffd6a8', fontSize: 12, lineHeight: 1.45 }}>
            {issues.slice(0, 3).map((issue, index) => (
              <li key={`${title}-issue-${index}`}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {extra}

      <CommandList commands={commands} note={note} />
      {action ? (
        <div style={{ marginTop: 14, borderTop: `1px solid ${C.bdr}`, paddingTop: 14 }}>
          <button
            onClick={action.onClick}
            disabled={action.disabled}
            style={{
              background: action.disabled ? C.dim : '#12B7D4',
              border: 'none',
              borderRadius: 999,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 800,
              color: '#fff',
              cursor: action.disabled ? 'wait' : 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {action.disabled ? action.busyLabel || 'Working...' : action.label}
          </button>
          {action.help ? <div style={{ marginTop: 8, fontSize: 12, color: C.lo, lineHeight: 1.5 }}>{action.help}</div> : null}
          {action.message ? (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: action.tone === 'error' ? '#ffb8c6' : action.tone === 'warning' ? '#ffd6a8' : '#9ff0c0',
                lineHeight: 1.5,
                overflowWrap: 'anywhere',
              }}
            >
              {action.message}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PollDiffSummary({ diff }) {
  const movers = getTopPollDiffMovers(diff)
  if (!movers.length) return null

  return (
    <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 18, padding: 18 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.hi }}>Change since last refresh</div>
      <div style={{ fontSize: 12, color: C.lo, lineHeight: 1.5, marginTop: 3 }}>
        Poll average movement computed from stored polls before and after the last full refresh.
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {movers.map((row) => {
          const delta = Number(row.delta)
          return (
            <div
              key={row.key || row.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
                padding: '9px 10px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.055)',
                border: `1px solid ${C.bdr}`,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 750, color: C.hi }}>{row.name}</span>
              <span style={{ fontSize: 13, fontWeight: 850, color: delta >= 0 ? '#9ff0c0' : '#ffb8c6' }}>
                {formatDelta(delta)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DataHealthTab({ data, onRefreshData }) {
  const [fullRefreshRunning, setFullRefreshRunning] = useState(false)
  const [fullRefreshResult, setFullRefreshResult] = useState(null)
  const [marketsRefreshing, setMarketsRefreshing] = useState(false)
  const [marketsRefreshResult, setMarketsRefreshResult] = useState(null)
  const [pollIngestRunning, setPollIngestRunning] = useState(false)
  const [pollIngestResult, setPollIngestResult] = useState(null)
  const [newsRefreshing, setNewsRefreshing] = useState(false)
  const [newsRefreshResult, setNewsRefreshResult] = useState(null)

  const ingestStatus = data?.ingestStatus && typeof data.ingestStatus === 'object' ? data.ingestStatus : null
  const adminActions = data?.adminActionStatus?.actions && typeof data.adminActionStatus.actions === 'object'
    ? data.adminActionStatus.actions
    : {}
  const pollAction = getAdminAction(adminActions, 'poll-ingest')
  const marketsAction = getAdminAction(adminActions, 'markets-refresh')
  const newsAction = getAdminAction(adminActions, 'news-refresh')
  const fullRefreshAction = getAdminAction(adminActions, 'full-refresh')
  const polls = Array.isArray(data?.pollsData) && data.pollsData.length
    ? data.pollsData
    : Array.isArray(data?.polls)
      ? data.polls
      : []
  const pollLatestDate = latestPollDate(polls)
  const pollStatus = ['error', 'partial'].includes(String(ingestStatus?.status || '').toLowerCase()) || ingestStatus?.preserved
    ? 'Needs review'
    : freshnessFromDate(ingestStatus?.lastRunAt || pollLatestDate, { okDays: 2, staleDays: 7 })

  const predictionMarkets = data?.predictionMarkets
  const marketRows = extractMarketRows(predictionMarkets)
  const marketUpdatedAt = firstPresent(
    predictionMarkets?.updatedAt,
    predictionMarkets?.generatedAt,
    predictionMarkets?.meta?.updatedAt,
    predictionMarkets?.meta?.generatedAt,
    marketRows[0]?.checkedAt,
  )
  const marketFailedSources = Array.isArray(predictionMarkets?.failedSources)
    ? predictionMarkets.failedSources.length
    : Array.isArray(predictionMarkets?.meta?.failedSources)
      ? predictionMarkets.meta.failedSources.length
      : 0
  const marketStatus = marketFailedSources
    ? 'Needs review'
    : freshnessFromDate(marketUpdatedAt, { okDays: 3, staleDays: 7 })

  const newsMeta = extractNewsMeta(data?.newsItems)
  const newsItems = extractNewsItems(data?.newsItems)
  const newsUpdatedAt = firstPresent(newsMeta?.updatedAt, newsMeta?.fetchedAt, newsItems[0]?.publishedAt)
  const newsSources = newsMeta?.sourceCount || new Set(newsItems.map((item) => item?.source).filter(Boolean)).size
  const newsSourceDiagnostics = Array.isArray(newsMeta?.sourceDiagnostics)
    ? newsMeta.sourceDiagnostics
    : Array.isArray(newsAction?.sourceDiagnostics)
      ? newsAction.sourceDiagnostics
      : []
  const newsClusterDiagnostics = newsMeta?.clusterDiagnostics || {}
  const newsNarrativeDiagnostics = newsMeta?.narrativeDiagnostics || {}
  const newsPreCapCount = finiteIssueNumber(newsMeta?.preCapCount, newsAction?.preCapCount)
  const newsFinalCount = finiteIssueNumber(newsMeta?.finalCount, newsAction?.finalCount, newsMeta?.storyCount, newsItems.length)
  const newsClusterCount = finiteIssueNumber(
    newsClusterDiagnostics?.totalClusters,
    Array.isArray(data?.newsItems?.clusteredStories) ? data.newsItems.clusteredStories.length : null
  )
  const newsNarrativeCount = finiteIssueNumber(
    newsNarrativeDiagnostics?.activeNarrativeCount,
    Array.isArray(data?.newsItems?.narrativeSignals) ? data.newsItems.narrativeSignals.length : null
  )
  const newsStatus = freshnessFromDate(newsUpdatedAt, { okDays: 1, staleDays: 3 })
  const pollIssues = buildPollIssues({ ingestStatus, action: pollAction })
  const marketIssues = buildMarketIssues({ failedSourceCount: marketFailedSources, action: marketsAction })
  const newsIssues = buildNewsIssues({
    itemCount: newsMeta?.storyCount ?? newsItems.length,
    sourceCount: newsSources,
    action: newsAction,
    warnings: newsMeta?.warnings,
  })

  const migration = data?.migration && typeof data.migration === 'object' ? data.migration : {}
  const migrationReviewedAt = firstPresent(migration?.meta?.reviewedAt, migration?.meta?.updatedAt)

  const byElections = data?.byElections && typeof data.byElections === 'object' ? data.byElections : {}
  const byElectionReviewedAt = firstPresent(byElections?.meta?.reviewedAt, byElections?.meta?.updatedAt)

  const leaderRatings = data?.leaderRatings && typeof data.leaderRatings === 'object' ? data.leaderRatings : null
  const sourcedLeaderCount = Number.isFinite(Number(leaderRatings?.count))
    ? Number(leaderRatings.count)
    : (Array.isArray(data?.leaders) ? data.leaders.filter((leader) => leader?.ratingSource === 'sourced').length : 0)
  const leaderUpdatedAt = firstPresent(leaderRatings?.updatedAt, leaderRatings?.publishedAt, leaderRatings?.fieldworkDate)
  const leaderUnmatchedCount = Array.isArray(leaderRatings?.unmatched) ? leaderRatings.unmatched.length : 0
  const leaderStatus = leaderUnmatchedCount
    ? 'Needs review'
    : freshnessFromDate(leaderUpdatedAt, { okDays: 45, staleDays: 120 })
  const fullRefreshDiff = fullRefreshResult?.payload?.diff || fullRefreshAction?.diff || null

  const getAdminActionKey = (label, setResult) => {
    let adminKey = sessionStorage.getItem('politiscope_admin_action_key') || ''
    if (!adminKey) {
      adminKey = window.prompt(`Enter admin action key for ${label}:`) || ''
      adminKey = adminKey.trim()
      if (!adminKey) {
        setResult({ tone: 'error', message: 'Action cancelled: admin action key is required.' })
        return null
      }
      sessionStorage.setItem('politiscope_admin_action_key', adminKey)
    }
    return adminKey
  }

  const refreshMarkets = async () => {
    setMarketsRefreshResult(null)
    const adminKey = getAdminActionKey('market refresh', setMarketsRefreshResult)
    if (!adminKey) return
    setMarketsRefreshing(true)
    try {
      const response = await fetch(`${API_BASE}/api/admin/refresh-markets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
      })
      const text = await response.text()
      let payload = null
      try {
        payload = text ? JSON.parse(text) : null
      } catch {
        throw new Error(`Refresh returned non-JSON response: ${text.slice(0, 180)}`)
      }

      if (!response.ok || payload?.ok === false) {
        if (response.status === 401) sessionStorage.removeItem('politiscope_admin_action_key')
        throw new Error(payload?.error || `Refresh failed with ${response.status}`)
      }

      setMarketsRefreshResult({
        tone: 'success',
        message: `Refreshed ${formatAdminDateTime(payload.updatedAt)} · ${compactNumber(payload.marketCount)} rows · ${compactNumber(payload.failedSourceCount)} failed sources`,
      })
      await Promise.resolve(onRefreshData?.())
    } catch (error) {
      setMarketsRefreshResult({ tone: 'error', message: error?.message || 'Market refresh failed.' })
    } finally {
      setMarketsRefreshing(false)
    }
  }

  const runFullRefresh = async () => {
    setFullRefreshResult(null)
    const adminKey = getAdminActionKey('full refresh', setFullRefreshResult)
    if (!adminKey) return
    setFullRefreshRunning(true)
    try {
      const response = await fetch(`${API_BASE}/api/admin/full-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
      })
      const text = await response.text()
      let payload = null
      try {
        payload = text ? JSON.parse(text) : null
      } catch {
        throw new Error(`Full refresh returned non-JSON response: ${text.slice(0, 180)}`)
      }

      if (!response.ok || payload?.ok === false) {
        if (response.status === 401) sessionStorage.removeItem('politiscope_admin_action_key')
        if (response.status === 409) throw new Error(payload?.error || 'Full refresh already running.')
        throw new Error(payload?.error || `Full refresh failed with ${response.status}`)
      }

      setFullRefreshResult({
        tone: 'success',
        payload,
        message: `${fullRefreshCounts(payload)} · duration ${formatDurationMs(payload.durationMs)}`,
      })
      await Promise.resolve(onRefreshData?.())
    } catch (error) {
      setFullRefreshResult({ tone: 'error', message: error?.message || 'Full refresh failed.' })
    } finally {
      setFullRefreshRunning(false)
    }
  }

  const runPollIngest = async () => {
    setPollIngestResult(null)
    const adminKey = getAdminActionKey('poll ingest', setPollIngestResult)
    if (!adminKey) return
    setPollIngestRunning(true)
    try {
      const response = await fetch(`${API_BASE}/api/admin/ingest-polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
      })
      const text = await response.text()
      let payload = null
      try {
        payload = text ? JSON.parse(text) : null
      } catch {
        throw new Error(`Poll ingest returned non-JSON response: ${text.slice(0, 180)}`)
      }

      if (!response.ok || (payload?.ok === false && !payload?.preserved && !payload?.partial)) {
        if (response.status === 401) sessionStorage.removeItem('politiscope_admin_action_key')
        if (response.status === 409) throw new Error('Poll ingest already running.')
        throw new Error(payload?.error || `Poll ingest failed with ${response.status}`)
      }

      if (payload?.preserved || payload?.partial) {
        setPollIngestResult({
          tone: 'warning',
          message: `Partial ingest preserved existing poll data · existing ${compactNumber(payload.existingRows)} rows · candidate ${compactNumber(payload.newRows)}`,
        })
      } else {
        setPollIngestResult({
          tone: 'success',
          message: `Fetched ${compactNumber(payload.totalFetched)} · accepted ${compactNumber(payload.acceptedCount)} · dropped ${compactNumber(payload.droppedCount)} · latest ${formatAdminDate(payload.latestPollDate)}`,
        })
      }
      await Promise.resolve(onRefreshData?.())
    } catch (error) {
      setPollIngestResult({ tone: 'error', message: error?.message || 'Poll ingest failed.' })
    } finally {
      setPollIngestRunning(false)
    }
  }

  const refreshNews = async () => {
    setNewsRefreshResult(null)
    const adminKey = getAdminActionKey('news refresh', setNewsRefreshResult)
    if (!adminKey) return
    setNewsRefreshing(true)
    try {
      const response = await fetch(`${API_BASE}/api/admin/refresh-news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
      })
      const text = await response.text()
      let payload = null
      try {
        payload = text ? JSON.parse(text) : null
      } catch {
        throw new Error(`News refresh returned non-JSON response: ${text.slice(0, 180)}`)
      }

      if (!response.ok || payload?.ok === false) {
        if (response.status === 401) sessionStorage.removeItem('politiscope_admin_action_key')
        throw new Error(payload?.error || `News refresh failed with ${response.status}`)
      }

      setNewsRefreshResult({
        tone: 'success',
        message: `Stories ${compactNumber(payload.itemCount)} · sources ${compactNumber(payload.sourceCount)} · refreshed ${formatAdminDateTime(payload.updatedAt)}`,
      })
      await Promise.resolve(onRefreshData?.())
    } catch (error) {
      setNewsRefreshResult({ tone: 'error', message: error?.message || 'News refresh failed.' })
    } finally {
      setNewsRefreshing(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ background: 'rgba(18,183,212,0.12)', border: '1px solid rgba(18,183,212,0.22)', borderRadius: 18, padding: '16px 18px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.hi, marginBottom: 5 }}>Data Health</div>
        <div style={{ fontSize: 13, color: '#7dd8ea', lineHeight: 1.6 }}>
          Health view with protected refresh actions for selected feeds. Wider ingest actions still run from CLI.
        </div>
        <div style={{ marginTop: 14, borderTop: '1px solid rgba(18,183,212,0.22)', paddingTop: 14 }}>
          <button
            onClick={runFullRefresh}
            disabled={fullRefreshRunning}
            style={{
              background: fullRefreshRunning ? C.dim : '#12B7D4',
              border: 'none',
              borderRadius: 999,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 800,
              color: '#fff',
              cursor: fullRefreshRunning ? 'wait' : 'pointer',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {fullRefreshRunning ? 'Running full refresh...' : 'Run full refresh'}
          </button>
          <div style={{ marginTop: 8, fontSize: 12, color: '#7dd8ea', lineHeight: 1.5 }}>
            Runs polls → markets → news. Requires admin action key.
          </div>
          {(fullRefreshResult?.message || fullRefreshAction) ? (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: fullRefreshResult?.tone === 'error' || fullRefreshAction?.ok === false ? '#ffb8c6' : '#9ff0c0',
                lineHeight: 1.5,
                overflowWrap: 'anywhere',
              }}
            >
              {fullRefreshResult?.message || `${fullRefreshCounts(fullRefreshAction)} · duration ${formatDurationMs(fullRefreshAction?.durationMs)}`}
            </div>
          ) : null}
        </div>
      </div>

      <PollDiffSummary diff={fullRefreshDiff} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <HealthCard
          title="Polls"
          status={pollStatus}
          summary="Automated poll ingest status and latest loaded poll freshness."
          rows={[
            { label: 'Run status', value: ingestStatus?.status || 'Needs review' },
            { label: 'Last run', value: formatAdminDateTime(ingestStatus?.lastRunAt) },
            { label: 'Rows accepted', value: compactNumber(ingestStatus?.totalFetched ?? polls.length) },
            { label: 'Rows dropped', value: compactNumber(ingestStatus?.droppedInvalidRows) },
            { label: 'Latest poll date', value: formatAdminDate(pollLatestDate) },
            { label: 'API base', value: ingestStatus?.apiBase || 'Not loaded' },
            { label: 'Last action', value: formatAdminDateTime(pollAction?.finishedAt || pollAction?.updatedAt) },
            { label: 'Action result', value: adminActionResultLabel(pollAction) },
            { label: 'What changed', value: pollActionCounts(pollAction) },
            { label: 'Source diagnostics', value: sourceStatusSummary(pollAction?.sourceStatus || ingestStatus?.sourceStatus) },
            { label: 'Action warnings', value: compactNumber(warningCount(pollAction)) },
          ]}
          issues={pollIssues}
          commands={[
            'npm run polls:health:remote',
            'npm run polls:import:remote',
          ]}
          action={{
            label: 'Run poll ingest',
            busyLabel: fullRefreshRunning ? 'Full refresh running...' : 'Running ingest...',
            disabled: pollIngestRunning || fullRefreshRunning,
            onClick: runPollIngest,
            help: 'Uses Worker-side poll sources and validation. Requires admin action key.',
            message: pollIngestResult?.message,
            tone: pollIngestResult?.tone,
          }}
        />

        <HealthCard
          title="Political markets"
          status={marketStatus}
          summary="Public market signal feed; informational only, not advice."
          rows={[
            { label: 'Source', value: predictionMarkets?.source || predictionMarkets?.meta?.source || 'Polymarket' },
            { label: 'Updated/generated', value: formatAdminDateTime(marketUpdatedAt) },
            { label: 'Current rows', value: compactNumber(marketRows.length) },
            { label: 'Failed sources', value: compactNumber(marketFailedSources) },
            { label: 'Last action', value: formatAdminDateTime(marketsAction?.finishedAt || marketsAction?.updatedAt) },
            { label: 'Action result', value: adminActionResultLabel(marketsAction) },
            { label: 'What changed', value: marketActionCounts(marketsAction) },
            { label: 'Action warnings', value: compactNumber(warningCount(marketsAction)) },
          ]}
          issues={marketIssues}
          commands={[
            'npm run political-markets:health:remote',
            'npm run political-markets:import:remote',
          ]}
          action={{
            label: 'Refresh markets',
            busyLabel: fullRefreshRunning ? 'Full refresh running...' : 'Refreshing...',
            disabled: marketsRefreshing || fullRefreshRunning,
            onClick: refreshMarkets,
            help: 'Uses Worker-side configured UK market sources. Requires admin action key.',
            message: marketsRefreshResult?.message,
            tone: marketsRefreshResult?.tone,
          }}
        />

        <HealthCard
          title="News"
          status={newsStatus}
          summary="Worker-fetched politics feed cache."
          rows={[
            { label: 'Fetched/updated', value: formatAdminDateTime(newsUpdatedAt) },
            { label: 'Stories', value: compactNumber(newsMeta?.storyCount ?? newsItems.length) },
            { label: 'Sources', value: compactNumber(newsSources) },
            { label: 'Pre-cap stories', value: compactNumber(newsPreCapCount) },
            { label: 'Final stories', value: compactNumber(newsFinalCount) },
            { label: 'Clusters', value: compactNumber(newsClusterCount) },
            { label: 'Narratives', value: compactNumber(newsNarrativeCount) },
            { label: 'Last action', value: formatAdminDateTime(newsAction?.finishedAt || newsAction?.updatedAt) },
            { label: 'Action result', value: adminActionResultLabel(newsAction) },
            { label: 'What changed', value: newsActionCounts(newsAction) },
            { label: 'Action warnings', value: compactNumber(warningCount(newsAction)) },
          ]}
          issues={newsIssues}
          extra={<NewsSourceHealth sourceDiagnostics={newsSourceDiagnostics} />}
          note="Worker refreshes news via /api/news; no CLI health script yet."
          action={{
            label: 'Refresh news',
            busyLabel: fullRefreshRunning ? 'Full refresh running...' : 'Refreshing...',
            disabled: newsRefreshing || fullRefreshRunning,
            onClick: refreshNews,
            help: 'Refreshes Worker news cache. Requires admin action key.',
            message: newsRefreshResult?.message,
            tone: newsRefreshResult?.tone,
          }}
        />

        <HealthCard
          title="Migration"
          status="Latest official estimate"
          summary="Official statistics import; maintained as latest official estimate, not live."
          rows={[
            { label: 'ONS period', value: migration?.fetchYear || 'Not loaded' },
            { label: 'Net migration', value: compactNumber(migration?.netTotal) },
            { label: 'Reviewed', value: formatAdminDate(migrationReviewedAt) },
            { label: 'Historical rows', value: compactNumber(Array.isArray(migration?.historicalTrend) ? migration.historicalTrend.length : 0) },
            { label: 'Source type', value: migration?.meta?.sourceType || 'Not loaded' },
          ]}
          commands={[
            'npm run migration:health:remote',
            'npm run migration:import:remote',
          ]}
        />

        <HealthCard
          title="By-elections"
          status={freshnessFromDate(byElectionReviewedAt, { okDays: 60, staleDays: 180, manual: !byElectionReviewedAt })}
          summary="Maintained Westminster by-election tracker."
          rows={[
            { label: 'Scope', value: byElections?.meta?.scope || 'Not loaded' },
            { label: 'Upcoming', value: compactNumber(Array.isArray(byElections?.upcoming) ? byElections.upcoming.length : 0) },
            { label: 'Recent', value: compactNumber(Array.isArray(byElections?.recent) ? byElections.recent.length : 0) },
            { label: 'Reviewed/updated', value: formatAdminDate(byElectionReviewedAt) },
            { label: 'Source', value: byElections?.meta?.sourceType || byElections?.meta?.source || 'Not loaded' },
          ]}
          commands={[
            'npm run byelections:import:remote',
          ]}
        />

        <HealthCard
          title="Leader ratings"
          status={leaderStatus}
          summary="Imported favourability dataset merged onto maintained leader profiles."
          rows={[
            { label: 'Sourced leaders', value: compactNumber(sourcedLeaderCount) },
            { label: 'Updated/published', value: formatAdminDate(leaderUpdatedAt) },
            { label: 'Unmatched rows', value: compactNumber(leaderUnmatchedCount) },
            { label: 'Source', value: leaderRatings?.source || 'Maintained profiles' },
          ]}
          commands={[
            'npm run leader-ratings:health:remote',
            'npm run leader-ratings:import:remote',
          ]}
        />
      </div>
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────

function AdminLogin({ onLogin }) {
  const [err, setErr] = useState('')
  const btnRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    const init = () => {
      if (cancelled) return

      if (!window.google?.accounts?.id) {
        setTimeout(init, 100)
        return
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]))
            const email = payload.email?.toLowerCase?.()

            if (ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(email)) {
              const auth = {
                email,
                name: payload.name,
                picture: payload.picture,
                expires: Date.now() + 8 * 60 * 60 * 1000,
              }
              localStorage.setItem('admin_auth', JSON.stringify(auth))
              onLogin(auth)
            } else {
              setErr(`Access denied: ${email}`)
            }
          } catch {
            setErr('Sign-in failed. Try again.')
          }
        },
        auto_select: false,
      })

      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          width: 280,
        })
      }
    }

    init()
    return () => { cancelled = true }
  }, [onLogin])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1628', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 24, padding: '40px 36px', width: 340, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.hi, marginBottom: 8 }}>Politiscope Admin</div>
        <div style={{ fontSize: 14, color: C.lo, marginBottom: 32 }}>Sign in with your authorised Google account</div>
        <div ref={btnRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
        {err && (
          <div style={{ marginTop: 16, fontSize: 13, color: '#ff6b8a', background: 'rgba(228,0,59,0.15)', padding: '10px 14px', borderRadius: 10 }}>
            {err}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Polls ────────────────────────────────────────────────────

function PollsTab({ data, setData, ts, onAfterSave }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setSaving(true)
    setErr('')

    try {
      await runSaves([
        () => saveSection('parties', data.parties),
        () => saveSection('trends', data.trends),
        () => saveSection('meta', data.meta),
      ])
      onAfterSave?.()
    } catch (e) {
      setErr(e?.message || 'Failed to save polls data.')
    } finally {
      setSaving(false)
    }
  }

  const updateParty = (idx, field, val) => {
    const updated = (data.parties || []).map((p, i) => {
      if (i !== idx) return p
      const numericFields = new Set(['pct', 'change', 'seats'])
      return {
        ...p,
        [field]: numericFields.has(field) ? toNumberOrZero(val) : val,
      }
    })
    setData({ ...data, parties: updated })
  }

  return (
    <>
      <div style={{ fontSize: 13, color: C.lo, marginBottom: 14, lineHeight: 1.6 }}>
        Edit party polling averages, weekly change, and MRP seat projections. Data goes live on save — no rebuild needed.
      </div>

      <ErrorBanner message={err} />
      <TsLabel ts={ts?.parties || ts?.trends || ts?.meta} />

      <AdminInput
        label="Fetch date (e.g. 25 Mar 2026)"
        value={data.meta?.fetchDate || ''}
        onChange={v => setData({ ...data, meta: { ...data.meta, fetchDate: v } })}
      />

      <AdminInput
        label="Context summary (shown on home card)"
        value={data.meta?.context || ''}
        onChange={v => setData({ ...data, meta: { ...data.meta, context: v } })}
        multiline
      />

      <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 10px' }}>
        Party figures
      </div>

      {(data.parties || []).filter(p => p.name !== 'Other').map((p, i) => (
        <Section
          key={p.name}
          title={`${p.name} — ${p.pct}% ${p.change > 0 ? '▲' : p.change < 0 ? '▼' : ''}${p.change !== 0 ? Math.abs(p.change) : ''}`}
        >
          <AdminInput
            label="Poll % (7-poll avg)"
            value={String(p.pct ?? '')}
            onChange={v => updateParty(i, 'pct', v)}
            type="number"
            min={0}
            max={100}
            required
          />
          <AdminInput
            label="Weekly change (+1 or -2)"
            value={String(p.change ?? 0)}
            onChange={v => updateParty(i, 'change', v)}
            type="number"
            min={-30}
            max={30}
          />
          <AdminInput
            label="MRP seat projection"
            value={String(p.seats ?? 0)}
            onChange={v => updateParty(i, 'seats', v)}
            type="number"
            min={0}
          />
        </Section>
      ))}

      <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 10px' }}>
        Monthly trends — latest month
      </div>

      {data.trends && data.trends.length > 0 && (() => {
        const last = data.trends[data.trends.length - 1]
        const KEYS = ['Reform UK', 'Labour', 'Conservative', 'Green', 'Lib Dem', 'Restore Britain']

        return (
          <div style={{ background: C.card, borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.hi, marginBottom: 12 }}>
              {last.month} — add new month or update latest
            </div>

            {KEYS.map(k => (
              <AdminInput
                key={k}
                label={k}
                type="number"
                value={String(last[k] ?? '')}
                onChange={v => {
                  const updated = [...data.trends]
                  updated[updated.length - 1] = { ...last, [k]: v === '' ? null : toNumberOrZero(v) }
                  setData({ ...data, trends: updated })
                }}
              />
            ))}
          </div>
        )
      })()}

      <SaveBtn onClick={save} saving={saving} />
    </>
  )
}

function PollImportTab({ data, setData, ts, onAfterSave }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [editingPollId, setEditingPollId] = useState(null)
  const emptyForm = {
    pollster: '',
    publishedAt: '',
    fieldworkStart: '',
    fieldworkEnd: '',
    sample: '',
    method: '',
    mode: '',
    commissioner: '',
    sourceUrl: '',
    ref: '',
    lab: '',
    con: '',
    grn: '',
    ld: '',
    rb: '',
    snp: '',
    pc: '',
    oth: '',
  }
  const [form, setForm] = useState(emptyForm)

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))
  const manualPolls = (data.pollsData || []).filter((poll) => poll?.sourceType === 'manual')
  const ingestStatus = data?.ingestStatus && typeof data.ingestStatus === 'object' ? data.ingestStatus : null
  const ingestStatusPill = getIngestRunStatus(ingestStatus?.status)
  const ingestCountSummary = Object.entries(ingestStatus?.countsByPollster || {})
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([name, count]) => `${name} ${count}`)
    .join(' · ')
  const ingestLastRun = ingestStatus?.lastRunAt ? new Date(ingestStatus.lastRunAt) : null
  const ingestAgeHours = ingestLastRun && !Number.isNaN(ingestLastRun.getTime())
    ? (Date.now() - ingestLastRun.getTime()) / 3600000
    : null
  const checkedRecently =
    String(ingestStatus?.status || '').trim().toLowerCase() === 'success' &&
    ingestStatus?.overwriteOk !== false &&
    ingestAgeHours != null &&
    ingestAgeHours <= 12
  const freshnessRows = FRESHNESS_POLLSTERS.map((pollster) => {
    const latest = (data.pollsData || [])
      .filter((poll) => String(poll?.pollster || '').trim() === pollster)
      .map((poll) => ({ poll, usableDate: getPollUsableDate(poll) }))
      .filter(({ usableDate }) => parseIsoDate(usableDate))
      .sort((a, b) => b.usableDate.localeCompare(a.usableDate))[0]

    if (!latest) {
      return {
        pollster,
        latestDate: null,
        daysOld: null,
        status: getFreshnessStatus(null),
        checkedRecently: false,
      }
    }

    const today = new Date()
    const nowUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    const latestUtc = parseIsoDate(latest.usableDate)?.getTime() || nowUtc
    const daysOld = Math.max(0, Math.floor((nowUtc - latestUtc) / 86400000))

    return {
      pollster,
      latestDate: latest.usableDate,
      daysOld,
      status: getFreshnessStatus(daysOld, { checkedRecently }),
      checkedRecently: checkedRecently && daysOld > 7,
    }
  })
  const startEdit = (poll) => {
    setEditingPollId(poll?.id || null)
    setForm({
      pollster: poll?.pollster || '',
      publishedAt: poll?.publishedAt || '',
      fieldworkStart: poll?.fieldworkStart || '',
      fieldworkEnd: poll?.fieldworkEnd || '',
      sample: poll?.sample == null ? '' : String(poll.sample),
      method: poll?.method || '',
      mode: poll?.mode || '',
      commissioner: poll?.commissioner || '',
      sourceUrl: poll?.sourceUrl || '',
      ref: poll?.ref == null ? '' : String(poll.ref),
      lab: poll?.lab == null ? '' : String(poll.lab),
      con: poll?.con == null ? '' : String(poll.con),
      grn: poll?.grn == null ? '' : String(poll.grn),
      ld: poll?.ld == null ? '' : String(poll.ld),
      rb: poll?.rb == null ? '' : String(poll.rb),
      snp: poll?.snp == null ? '' : String(poll.snp),
      pc: poll?.pc == null ? '' : String(poll.pc),
      oth: poll?.oth == null ? '' : String(poll.oth),
    })
  }

  const resetForm = () => {
    setEditingPollId(null)
    setForm(emptyForm)
  }

  const save = async () => {
    setSaving(true)
    setErr('')

    try {
      const pollster = form.pollster.trim()
      const publishedAt = form.publishedAt.trim()
      const fieldworkStart = form.fieldworkStart.trim()
      const fieldworkEnd = form.fieldworkEnd.trim()
      const ref = toOptionalNumber(form.ref)
      const lab = toOptionalNumber(form.lab)
      const con = toOptionalNumber(form.con)
      const grn = toOptionalNumber(form.grn)
      const ld = toOptionalNumber(form.ld)
      const rb = toOptionalNumber(form.rb)
      const snp = toOptionalNumber(form.snp)
      const pc = toOptionalNumber(form.pc)
      const oth = toOptionalNumber(form.oth)

      if (!pollster) throw new Error('Pollster is required.')
      if (!publishedAt) throw new Error('Published date is required.')

      const majorCount = [ref, lab, con, grn, ld].filter(v => v != null).length
      if (majorCount < 3) throw new Error('Enter at least 3 values across Ref, Lab, Con, Grn, and LD.')

      const total = [ref, lab, con, grn, ld, rb, snp, pc, oth]
        .filter(v => v != null)
        .reduce((sum, value) => sum + value, 0)
      if (total > 105) throw new Error('Total populated party values must not exceed 105.')

      const existingPoll = (data.pollsData || []).find(
        (poll) => String(poll?.pollster || '').trim().toLowerCase() === pollster.toLowerCase()
      )
      const editingPoll = (data.pollsData || []).find((poll) => poll?.id === editingPollId)

      const newPoll = {
        id: editingPoll?.id || `${toPollIdPart(pollster)}-${fieldworkEnd || publishedAt}`,
        pollster,
        publishedAt,
        fieldworkStart: fieldworkStart || null,
        fieldworkEnd: fieldworkEnd || null,
        sample: toOptionalNumber(form.sample),
        method: form.method.trim() || null,
        mode: form.mode.trim() || null,
        commissioner: form.commissioner.trim() || null,
        sourceUrl: form.sourceUrl.trim() || null,
        ref,
        lab,
        con,
        grn,
        ld,
        rb,
        snp,
        pc,
        oth,
        sourceType: 'manual',
        confidence: 'high',
        verificationStatus: 'verified',
        isBpcMember: Boolean(editingPoll?.isBpcMember ?? existingPoll?.isBpcMember),
      }

      const updatedPolls = editingPollId
        ? (data.pollsData || []).map((poll) => (poll?.id === editingPollId ? newPoll : poll))
        : [newPoll, ...(data.pollsData || [])]
      setData({ ...data, pollsData: updatedPolls })
      await Promise.resolve(saveSection('pollsData', updatedPolls))
      resetForm()
      onAfterSave?.()
    } catch (e) {
      setErr(e?.message || 'Failed to save imported poll.')
    } finally {
      setSaving(false)
    }
  }

  const removePoll = async (pollId) => {
    setSaving(true)
    setErr('')

    try {
      const updatedPolls = (data.pollsData || []).filter((poll) => poll?.id !== pollId)
      setData({ ...data, pollsData: updatedPolls })
      await Promise.resolve(saveSection('pollsData', updatedPolls))
      if (editingPollId === pollId) resetForm()
      onAfterSave?.()
    } catch (e) {
      setErr(e?.message || 'Failed to delete imported poll.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ fontSize: 13, color: C.lo, marginBottom: 14, lineHeight: 1.6 }}>
        Add or edit a verified poll row manually and save it straight into <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>pollsData</code>.
      </div>

      <ErrorBanner message={err} />
      <TsLabel ts={ts?.pollsData} />

      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.bdr}`, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Ingest Status
        </div>
        {!ingestStatus ? (
          <div style={{ fontSize: 13, color: C.lo }}>No ingest run recorded yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: C.hi, fontWeight: 700 }}>
                Last run {formatAdminDateTime(ingestStatus.lastRunAt)}
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: ingestStatusPill.color,
                  background: `${ingestStatusPill.color}1A`,
                  border: `1px solid ${ingestStatusPill.color}33`,
                  whiteSpace: 'nowrap',
                }}
              >
                {ingestStatusPill.label}
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.7 }}>
              <div>API base: {ingestStatus.apiBase || 'Not loaded'}</div>
              <div>Total fetched: {ingestStatus.totalFetched ?? '—'}</div>
              <div>Dropped invalid rows: {ingestStatus.droppedInvalidRows ?? '—'}</div>
              <div>Overwrite result: {ingestStatus.overwriteOk ? 'OK' : 'Failed'}</div>
              <div>Pollster counts: {ingestCountSummary || 'None recorded'}</div>
              {ingestStatus.error ? <div>Error: {ingestStatus.error}</div> : null}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.bdr}`, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Poll Freshness
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {freshnessRows.map((row) => (
            <div
              key={row.pollster}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.bdr}`,
                borderRadius: 12,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.hi, marginBottom: 2 }}>{row.pollster}</div>
                <div style={{ fontSize: 12, color: C.mid }}>
                  latest {row.latestDate || 'missing'}
                  {row.daysOld == null ? '' : ` · ${row.daysOld} day${row.daysOld === 1 ? '' : 's'} old`}
                  {row.checkedRecently ? ' · checked on last ingest' : ''}
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: row.status.color,
                  background: `${row.status.color}1A`,
                  border: `1px solid ${row.status.color}33`,
                  whiteSpace: 'nowrap',
                }}
              >
                {row.status.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.bdr}`, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Poll details
        </div>

        <AdminInput label="Pollster" value={form.pollster} onChange={v => update('pollster', v)} required />
        <AdminInput label="Published at" value={form.publishedAt} onChange={v => update('publishedAt', v)} required />
        <AdminInput label="Fieldwork start" value={form.fieldworkStart} onChange={v => update('fieldworkStart', v)} />
        <AdminInput label="Fieldwork end" value={form.fieldworkEnd} onChange={v => update('fieldworkEnd', v)} />
        <AdminInput label="Sample" value={form.sample} onChange={v => update('sample', v)} type="number" min={0} />
        <AdminInput label="Method" value={form.method} onChange={v => update('method', v)} />
        <AdminInput label="Mode" value={form.mode} onChange={v => update('mode', v)} />
        <AdminInput label="Commissioner" value={form.commissioner} onChange={v => update('commissioner', v)} />
        <AdminInput label="Source URL" value={form.sourceUrl} onChange={v => update('sourceUrl', v)} />
      </div>

      <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.bdr}`, padding: 20, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Party values
        </div>

        <AdminInput label="Ref" value={form.ref} onChange={v => update('ref', v)} type="number" min={0} max={100} />
        <AdminInput label="Lab" value={form.lab} onChange={v => update('lab', v)} type="number" min={0} max={100} />
        <AdminInput label="Con" value={form.con} onChange={v => update('con', v)} type="number" min={0} max={100} />
        <AdminInput label="Grn" value={form.grn} onChange={v => update('grn', v)} type="number" min={0} max={100} />
        <AdminInput label="LD" value={form.ld} onChange={v => update('ld', v)} type="number" min={0} max={100} />
        <AdminInput label="RB" value={form.rb} onChange={v => update('rb', v)} type="number" min={0} max={100} />
        <AdminInput label="SNP" value={form.snp} onChange={v => update('snp', v)} type="number" min={0} max={100} />
        <AdminInput label="PC" value={form.pc} onChange={v => update('pc', v)} type="number" min={0} max={100} />
        <AdminInput label="Oth" value={form.oth} onChange={v => update('oth', v)} type="number" min={0} max={100} />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <SaveBtn onClick={save} saving={saving} label={editingPollId ? 'Update poll row' : 'Save poll row'} />
        {editingPollId ? (
          <button
            onClick={resetForm}
            disabled={saving}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${C.bdr}`,
              borderRadius: 999,
              padding: '11px 18px',
              fontSize: 13,
              fontWeight: 700,
              color: C.mid,
              cursor: saving ? 'wait' : 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '24px 0 10px' }}>
        Manual polls
      </div>

      {manualPolls.length ? manualPolls.slice(0, 10).map((poll) => (
        <Section
          key={poll.id}
          title={`${poll.pollster || 'Unknown'} — ${poll.fieldworkEnd || poll.publishedAt || 'No date'}`}
        >
          <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, marginBottom: 14 }}>
            {poll.pollster || 'Unknown'} · {poll.fieldworkEnd || poll.publishedAt || 'No date'} · Ref {poll.ref ?? '—'} · Lab {poll.lab ?? '—'} · Con {poll.con ?? '—'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => startEdit(poll)}
              disabled={saving}
              style={{
                background: 'rgba(18,183,212,0.12)',
                border: '1px solid rgba(18,183,212,0.25)',
                borderRadius: 999,
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 700,
                color: '#7dd8ea',
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Edit
            </button>
          
            <button
              onClick={() => removePoll(poll.id)}
              disabled={saving}
              style={{
                background: 'rgba(228,0,59,0.15)',
                border: '1px solid rgba(228,0,59,0.3)',
                borderRadius: 999,
                padding: '10px 18px',
                fontSize: 12,
                fontWeight: 700,
                color: '#ff6b8a',
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Delete this poll
            </button>
          </div>
        </Section>
      )) : (
        <div style={{ fontSize: 13, color: C.lo }}>No manual polls yet.</div>
      )}
    </>
  )
}

// ── Tab: Elections ────────────────────────────────────────────────

function ElectionsTab({ data, setData, ts, onAfterSave }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setSaving(true)
    setErr('')

    try {
      await runSaves([
        () => saveSection('meta', data.meta),
        () => saveSection('byElections', data.byElections),
      ])
      onAfterSave?.()
    } catch (e) {
      setErr(e?.message || 'Failed to save election data.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div style={{ fontSize: 13, color: C.lo, marginBottom: 14, lineHeight: 1.6 }}>
        Update election dates, by-election results, and upcoming contests.
      </div>

      <ErrorBanner message={err} />
      <TsLabel ts={ts?.meta || ts?.byElections} />

      <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Next election
      </div>

      <AdminInput
        label="Next election date (YYYY-MM-DD)"
        value={data.meta?.nextElectionDate || ''}
        onChange={v => setData({ ...data, meta: { ...data.meta, nextElectionDate: v } })}
        required
      />

      <AdminInput
        label="Next election label"
        value={data.meta?.nextElectionLabel || ''}
        onChange={v => setData({ ...data, meta: { ...data.meta, nextElectionLabel: v } })}
      />

      <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 10px' }}>
        Recent by-election results
      </div>

      {(data.byElections?.recent || []).map((be, i) => (
        <Section key={be.id || i} title={`${be.name} — ${be.winner || '?'} ${be.gainLoss || ''}`}>
          <AdminInput
            label="Winner"
            value={be.winner || ''}
            onChange={v => {
              const rec = [...(data.byElections?.recent || [])]
              rec[i] = { ...be, winner: v }
              setData({ ...data, byElections: { ...data.byElections, recent: rec } })
            }}
          />
          <AdminInput
            label="Winner colour (hex)"
            value={be.winnerColor || ''}
            onChange={v => {
              const rec = [...(data.byElections?.recent || [])]
              rec[i] = { ...be, winnerColor: v }
              setData({ ...data, byElections: { ...data.byElections, recent: rec } })
            }}
          />
          <AdminInput
            label="GAIN or HOLD"
            value={be.gainLoss || ''}
            onChange={v => {
              const rec = [...(data.byElections?.recent || [])]
              rec[i] = { ...be, gainLoss: v }
              setData({ ...data, byElections: { ...data.byElections, recent: rec } })
            }}
          />
          <AdminInput
            label="Majority (votes)"
            value={String(be.majority ?? '')}
            type="number"
            min={0}
            onChange={v => {
              const rec = [...(data.byElections?.recent || [])]
              rec[i] = { ...be, majority: toNumberOrZero(v) }
              setData({ ...data, byElections: { ...data.byElections, recent: rec } })
            }}
          />
          <AdminInput
            label="Turnout %"
            value={String(be.turnout ?? '')}
            type="number"
            min={0}
            max={100}
            onChange={v => {
              const rec = [...(data.byElections?.recent || [])]
              rec[i] = { ...be, turnout: toNumberOrZero(v) }
              setData({ ...data, byElections: { ...data.byElections, recent: rec } })
            }}
          />
          <AdminInput
            label="Significance (1 sentence)"
            value={be.significance || ''}
            onChange={v => {
              const rec = [...(data.byElections?.recent || [])]
              rec[i] = { ...be, significance: v }
              setData({ ...data, byElections: { ...data.byElections, recent: rec } })
            }}
            multiline
          />
        </Section>
      ))}

      <div style={{ fontSize: 12, fontWeight: 700, color: C.lo, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '18px 0 10px' }}>
        Upcoming by-elections
      </div>

      {(data.byElections?.upcoming || []).filter(b => b.status !== 'skip').map((be, i) => (
        <Section key={be.id || i} title={`${be.name} — ${be.dateLabel || 'TBC'}`}>
          <AdminInput
            label="Date label"
            value={be.dateLabel || ''}
            onChange={v => {
              const up = [...(data.byElections?.upcoming || [])]
              up[i] = { ...be, dateLabel: v }
              setData({ ...data, byElections: { ...data.byElections, upcoming: up } })
            }}
          />
          <AdminInput
            label="Context"
            value={be.context || ''}
            onChange={v => {
              const up = [...(data.byElections?.upcoming || [])]
              up[i] = { ...be, context: v }
              setData({ ...data, byElections: { ...data.byElections, upcoming: up } })
            }}
            multiline
          />
          <AdminInput
            label="Watch for"
            value={be.watchFor || ''}
            onChange={v => {
              const up = [...(data.byElections?.upcoming || [])]
              up[i] = { ...be, watchFor: v }
              setData({ ...data, byElections: { ...data.byElections, upcoming: up } })
            }}
            multiline
          />
        </Section>
      ))}

      <SaveBtn onClick={save} saving={saving} />
    </>
  )
}

// ── Tab: Leaders ──────────────────────────────────────────────────

function LeadersTab({ data, setData, ts, onAfterSave }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setSaving(true)
    setErr('')

    try {
      await Promise.resolve(saveSection('leaders', data.leaders))
      onAfterSave?.()
    } catch (e) {
      setErr(e?.message || 'Failed to save leaders.')
    } finally {
      setSaving(false)
    }
  }

  const update = (i, field, val) => {
    const updated = (data.leaders || []).map((l, idx) => {
      if (idx !== i) return l

      const next = { ...l, [field]: val }

      if (field === 'approve') next.net = toNumberOrZero(val) - toNumberOrZero(l.disapprove)
      if (field === 'disapprove') next.net = toNumberOrZero(l.approve) - toNumberOrZero(val)

      return next
    })

    setData({ ...data, leaders: updated })
  }

  return (
    <>
      <div style={{ fontSize: 13, color: C.lo, marginBottom: 14, lineHeight: 1.6 }}>
        Update leader approval ratings. Net approval is calculated automatically.
      </div>

      <ErrorBanner message={err} />
      <TsLabel ts={ts?.leaders} />

      {(data.leaders || []).map((l, i) => (
        <Section key={l.name || i} title={`${l.name} — net ${l.net >= 0 ? '+' : ''}${l.net}`}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <AdminInput
                label="Approve %"
                value={String(l.approve ?? '')}
                type="number"
                min={0}
                max={100}
                required
                onChange={v => update(i, 'approve', toNumberOrZero(v))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <AdminInput
                label="Disapprove %"
                value={String(l.disapprove ?? '')}
                type="number"
                min={0}
                max={100}
                required
                onChange={v => update(i, 'disapprove', toNumberOrZero(v))}
              />
            </div>
          </div>

          <div style={{ fontSize: 20, fontWeight: 800, color: (data.leaders[i]?.net ?? 0) >= 0 ? '#4dd98a' : '#ff6b8a', marginBottom: 14 }}>
            Net: {(data.leaders[i]?.net ?? 0) >= 0 ? '+' : ''}{data.leaders[i]?.net ?? 0}
          </div>

          <AdminInput label="Role / title" value={l.role || ''} onChange={v => update(i, 'role', v)} />
          <AdminInput label="Bio (shown in About tab)" value={l.bio || ''} onChange={v => update(i, 'bio', v)} multiline />
        </Section>
      ))}

      <SaveBtn onClick={save} saving={saving} />
    </>
  )
}

// ── Tab: Meta ─────────────────────────────────────────────────────

function MetaTab({ data, setData, ts, onAfterSave }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async () => {
    setSaving(true)
    setErr('')

    try {
      await Promise.resolve(saveSection('meta', data.meta))
      onAfterSave?.()
    } catch (e) {
      setErr(e?.message || 'Failed to save meta.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ErrorBanner message={err} />
      <TsLabel ts={ts?.meta} />

      <AdminInput
        label="Fetch date (e.g. 25 Mar 2026)"
        value={data.meta?.fetchDate || ''}
        onChange={v => setData({ ...data, meta: { ...data.meta, fetchDate: v } })}
      />
      <AdminInput
        label="App URL"
        value={data.meta?.appUrl || ''}
        onChange={v => setData({ ...data, meta: { ...data.meta, appUrl: v } })}
      />
      <AdminInput
        label="GE 2029 date (YYYY-MM-DD)"
        value={data.meta?.ge2029Date || ''}
        onChange={v => setData({ ...data, meta: { ...data.meta, ge2029Date: v } })}
      />
      <AdminInput
        label="Context summary"
        value={data.meta?.context || ''}
        onChange={v => setData({ ...data, meta: { ...data.meta, context: v } })}
        multiline
      />

      <SaveBtn onClick={save} saving={saving} />
    </>
  )
}

// ── Main AdminApp ─────────────────────────────────────────────────

export default function AdminApp() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('dataHealth')
  const [ts, setTs] = useState({})
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('admin_auth') || 'null')
      if (stored?.expires > Date.now()) {
        setUser(stored)
      } else {
        localStorage.removeItem('admin_auth')
      }
    } catch {
      localStorage.removeItem('admin_auth')
    }
  }, [])

  const refreshTimestamps = () => {
    try {
      setTs(loadTimestamps() || {})
    } catch {
      setTs({})
    }
  }

  const loadAdminData = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true)
    setLoadError('')

    try {
      const d = await Promise.resolve(getData())
      let adminActionStatus = null
      try {
        const response = await fetch(`${API_BASE}/api/data`, { cache: 'no-store' })
        const remote = await response.json().catch(() => null)
        adminActionStatus = remote?.adminActionStatus || null
      } catch {
        adminActionStatus = null
      }
      setData({ ...d, adminActionStatus })
      refreshTimestamps()
    } catch (e) {
      setLoadError(e?.message || 'Failed to load admin data.')
      if (!silent) setData(null)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const refreshAdminDataInPlace = () => loadAdminData({ silent: true })

  useEffect(() => {
    if (!user) return
    loadAdminData()
  }, [user])

  useEffect(() => {
    if (!user) return
    const id = setInterval(refreshTimestamps, 2000)
    return () => clearInterval(id)
  }, [user])

  const logout = () => {
    localStorage.removeItem('admin_auth')
    window.google?.accounts?.id?.disableAutoSelect?.()
    setUser(null)
    setData(null)
    setLoadError('')
    setIsLoading(false)
    setIsResetting(false)
    setShowResetConfirm(false)
    setTs({})
  }

  const handleReset = async () => {
    setIsResetting(true)
    setLoadError('')

    try {
      await Promise.resolve(clearAll())
      const fresh = await Promise.resolve(getData())
      setData(fresh)
      refreshTimestamps()
      setShowResetConfirm(false)
    } catch (e) {
      setLoadError(e?.message || 'Failed to reset defaults.')
    } finally {
      setIsResetting(false)
    }
  }

  if (!user) return <AdminLogin onLogin={setUser} />

  if (isLoading || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.lo, fontFamily: "'Outfit',sans-serif", padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          {loadError ? <ErrorBanner message={loadError} /> : null}
          <div style={{ textAlign: 'center' }}>{loadError ? 'Could not load admin data.' : 'Loading…'}</div>
        </div>
      </div>
    )
  }

  const TABS = [
    { k: 'dataHealth', label: 'Data Health' },
    { k: 'polls', label: 'Polls' },
    { k: 'pollImport', label: 'Poll Import' },
    { k: 'elections', label: 'Elections' },
    { k: 'leaders', label: 'Leaders' },
    { k: 'meta', label: 'Meta' },
  ]

  const ingestStatus = data?.ingestStatus && typeof data.ingestStatus === 'object' ? data.ingestStatus : null
  const ingestLastRun = ingestStatus?.lastRunAt ? new Date(ingestStatus.lastRunAt) : null
  const ingestAgeHours = ingestLastRun && !Number.isNaN(ingestLastRun.getTime())
    ? (Date.now() - ingestLastRun.getTime()) / 3600000
    : null
  const showIngestError = String(ingestStatus?.status || '').trim().toLowerCase() === 'error'
  const showIngestStale = !showIngestError && ingestAgeHours != null && ingestAgeHours > 12
  const ingestBannerMessage = showIngestError
    ? 'Poll ingest failed on the last run'
    : showIngestStale
      ? 'Poll ingest needs review'
      : ''
  const ingestBannerTone = showIngestError
    ? {
        color: '#ffb8c6',
        background: 'rgba(228,0,59,0.14)',
        border: '1px solid rgba(228,0,59,0.28)',
      }
    : {
        color: '#ffd88a',
        background: 'rgba(246,200,95,0.12)',
        border: '1px solid rgba(246,200,95,0.24)',
      }

  return (
    <div style={{ minHeight: '100vh', background: '#0a1628', fontFamily: "'Outfit',sans-serif", paddingBottom: 80 }}>
      <div style={{ background: 'rgba(0,0,0,0.35)', borderBottom: `1px solid ${C.bdr}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.hi, letterSpacing: -0.3 }}>Politiscope Admin</div>
          <div style={{ fontSize: 12, color: C.lo, marginTop: 1 }}>Data management · local/D1-ready store</div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user.picture && (
            <img
              src={user.picture}
              alt=""
              style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.bdr}` }}
            />
          )}
          <span style={{ fontSize: 13, color: C.mid }}>{user.name?.split(' ')[0]}</span>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={isResetting}
            style={{
              background: 'rgba(228,0,59,0.15)',
              border: '1px solid rgba(228,0,59,0.3)',
              borderRadius: 999,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: '#ff6b8a',
              cursor: isResetting ? 'wait' : 'pointer',
              fontFamily: "'Outfit',sans-serif",
              opacity: isResetting ? 0.7 : 1,
            }}
          >
            {isResetting ? 'Resetting…' : 'Reset defaults'}
          </button>

          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${C.bdr}`,
              borderRadius: 999,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: C.mid,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ background: 'rgba(18,183,212,0.12)', borderBottom: '1px solid rgba(18,183,212,0.2)', padding: '10px 20px' }}>
        <div style={{ fontSize: 13, color: '#7dd8ea', lineHeight: 1.6 }}>
          <strong style={{ color: '#12B7D4' }}>How it works:</strong> Changes save through <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>saveSection()</code>. If your store is wired to D1, saves should persist there. If it still uses local storage for some sections, this screen will still work without breaking.
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <ErrorBanner message={loadError} />
        {ingestBannerMessage ? (
          <div
            style={{
              marginBottom: 16,
              fontSize: 13,
              color: ingestBannerTone.color,
              background: ingestBannerTone.background,
              border: ingestBannerTone.border,
              borderRadius: 12,
              padding: '12px 14px',
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{ingestBannerMessage}</div>
            <div>Last run: {formatAdminDateTime(ingestStatus?.lastRunAt)}</div>
            <div>API base: {ingestStatus?.apiBase || 'Not loaded'}</div>
            {ingestStatus?.droppedInvalidRows != null ? (
              <div>Dropped invalid rows: {ingestStatus.droppedInvalidRows}</div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '16px 20px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <div
            key={t.k}
            onClick={() => setTab(t.k)}
            style={{
              flexShrink: 0,
              padding: '8px 20px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.15s',
              background: tab === t.k ? '#12B7D4' : 'rgba(255,255,255,0.08)',
              color: tab === t.k ? '#fff' : C.mid,
              border: `1px solid ${tab === t.k ? 'transparent' : C.bdr}`,
            }}
          >
            {t.label}
            {ts[t.k === 'polls' ? 'parties' : t.k === 'pollImport' ? 'pollsData' : t.k] && (
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>✓</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '20px' }}>
        {tab === 'dataHealth' && <DataHealthTab data={data} onRefreshData={refreshAdminDataInPlace} />}
        {tab === 'polls' && <PollsTab data={data} setData={setData} ts={ts} onAfterSave={refreshTimestamps} />}
        {tab === 'pollImport' && <PollImportTab data={data} setData={setData} ts={ts} onAfterSave={refreshTimestamps} />}
        {tab === 'elections' && <ElectionsTab data={data} setData={setData} ts={ts} onAfterSave={refreshTimestamps} />}
        {tab === 'leaders' && <LeadersTab data={data} setData={setData} ts={ts} onAfterSave={refreshTimestamps} />}
        {tab === 'meta' && <MetaTab data={data} setData={setData} ts={ts} onAfterSave={refreshTimestamps} />}
      </div>

      {showResetConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 24 }}>
          <div style={{ background: '#0f1f3a', border: `1px solid ${C.bdr}`, borderRadius: 20, padding: '28px 24px', maxWidth: 340, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.hi, marginBottom: 8 }}>Reset to defaults?</div>
            <div style={{ fontSize: 13, color: C.lo, lineHeight: 1.6, marginBottom: 24 }}>
              This will clear saved overrides and reload data from your default source. Any unsaved changes will be lost.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${C.bdr}`,
                  borderRadius: 999,
                  padding: '10px 22px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.mid,
                  cursor: isResetting ? 'wait' : 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                  opacity: isResetting ? 0.7 : 1,
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleReset}
                disabled={isResetting}
                style={{
                  background: 'rgba(228,0,59,0.9)',
                  border: 'none',
                  borderRadius: 999,
                  padding: '10px 22px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: isResetting ? 'wait' : 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                  opacity: isResetting ? 0.7 : 1,
                }}
              >
                {isResetting ? 'Resetting…' : 'Yes, reset everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


