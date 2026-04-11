import React from 'react'
import { motion } from 'framer-motion'

export const TAP = { whileTap: { opacity: 0.76, scale: 0.992 }, transition: { duration: 0.08 } }

export const CONTROL_COLORS = {
  Con: '#0087DC',
  Lab: '#E4003B',
  LD: '#FAA61A',
  Grn: '#02A95B',
  Reform: '#12B7D4',
  NOC: '#6b7280',
  SNP: '#C4922A',
  PC: '#3F8428',
  Ind: '#9CA3AF',
}

export const DIFF_COLORS = {
  'very hard': '#E4003B',
  hard: '#F97316',
  medium: '#EAB308',
  safe: '#02A95B',
}

export function Chip({ children, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color,
        background: `${color}1e`,
        border: `1px solid ${color}2B`,
        borderRadius: 999,
        padding: '4px 9px',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export function FilterChip({ label, active, onClick, T }) {
  return (
    <motion.button
      {...TAP}
      onClick={onClick}
      style={{
        border: `1px solid ${active ? T.pr : T.cardBorder || 'rgba(0,0,0,0.12)'}`,
        background: active ? `${T.pr}18` : T.c0,
        color: active ? T.pr : T.th,
        borderRadius: 999,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </motion.button>
  )
}

export function SectionLabel({ children, T, action }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: action ? 'space-between' : 'center',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
      }}
    >
      {action ? <div style={{ width: 80 }} /> : null}
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: T.tl,
          textAlign: 'center',
        }}
      >
        {children}
      </div>
      {action ? (
        <div
          style={{
            width: 80,
            fontSize: 12,
            fontWeight: 700,
            color: T.pr,
            textAlign: 'right',
            cursor: 'pointer',
          }}
          onClick={action.onClick}
        >
          {action.label}
        </div>
      ) : null}
    </div>
  )
}

export function ControlBadge({ control, T }) {
  const c = CONTROL_COLORS[control] || T.tl
  return (
    <span
      style={{
        fontSize: 13,
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: 999,
        background: `${c}1e`,
        color: c,
        flexShrink: 0,
      }}
    >
      {control}
    </span>
  )
}

export function DiffDot({ d }) {
  const c = DIFF_COLORS[d] || '#888'
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
}

export function StatCard({ T, label, value, color, sub }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '12px 12px',
        textAlign: 'center',
        background: T.c0,
        border: `1px solid ${color}28`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: T.tl,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub ? (
        <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 4, lineHeight: 1.4 }}>
          {sub}
        </div>
      ) : null}
    </div>
  )
}

export function InteractiveStatCard({ T, label, value, color, sub, onClick, active = false }) {
  return (
    <motion.button
      {...TAP}
      onClick={onClick}
      style={{
        borderRadius: 12,
        padding: '12px 12px',
        textAlign: 'center',
        background: active ? `${color}10` : T.c0,
        border: `1px solid ${active ? color : `${color}28`}`,
        cursor: 'pointer',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: T.tl,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub ? (
        <div style={{ fontSize: 12, fontWeight: 600, color: T.tl, marginTop: 4, lineHeight: 1.4 }}>
          {sub}
        </div>
      ) : null}
    </motion.button>
  )
}

export function SurfaceCard({ T, children, borderColor, style = {} }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: '14px',
        background: T.c0,
        border: `1px solid ${borderColor || T.cardBorder || 'rgba(0,0,0,0.08)'}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default SurfaceCard
