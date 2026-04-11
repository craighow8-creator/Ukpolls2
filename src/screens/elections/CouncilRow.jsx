import React from 'react'
import { motion } from 'framer-motion'
import { cleanText } from '../../utils/electionsHelpers'
import { CONTROL_COLORS, ControlBadge, DIFF_COLORS, DiffDot, TAP } from './ElectionsSurfaceCard'

export default function CouncilRow({ T, council, onOpen }) {
  return (
    <motion.div
      {...TAP}
      onClick={() => onOpen(council.name)}
      style={{
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 6,
        background: T.c0,
        border: `1px solid ${(CONTROL_COLORS[council.control] || '#888')}18`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <DiffDot d={council.difficulty} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.th }}>{council.name}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.tl }}>
          {council.region} · {council.type} · {council.electionStatus === 'not-voting-2026'
            ? 'not voting in May 2026'
            : `${(council.seatsUp || council.seats)} up / ${(council.seatsTotal || council.seats)} seats`}
        </div>
        {council.watchFor ? (
          <div
            style={{
              fontSize: 13,
              color: T.tl,
              marginTop: 2,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {council.watchFor}
          </div>
        ) : null}
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <ControlBadge control={council.control} T={T} />
        {council.verdict ? (
          <div style={{ fontSize: 13, fontWeight: 700, color: DIFF_COLORS[cleanText(council.difficulty)] || T.tl, marginTop: 3 }}>
            {council.verdict}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
