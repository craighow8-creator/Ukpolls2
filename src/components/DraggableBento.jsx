import React, { useState, useRef, useCallback } from 'react'
import { SP } from '../constants'
import { haptic } from '../components/ui'

// Persistent card order stored in localStorage
const STORAGE_KEY = 'politiscope_card_order'

function loadOrder(defaultOrder) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge: keep new cards, respect saved order
      const merged = parsed.filter(id => defaultOrder.includes(id))
      const added  = defaultOrder.filter(id => !merged.includes(id))
      return [...merged, ...added]
    }
  } catch(e) {}
  return defaultOrder
}

function saveOrder(order) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)) } catch(e) {}
}

export default function DraggableBento({ cards, renderCard, cols = 2, gap = 16 }) {
  const defaultOrder = cards.map(c => c.id)
  const [order,     setOrder]    = useState(() => loadOrder(defaultOrder))
  const [dragging,  setDragging] = useState(null)   // id of card being dragged
  const [over,      setOver]     = useState(null)    // id of card being hovered over
  const [editMode,  setEditMode] = useState(false)
  const longPressRef = useRef()

  const startLongPress = useCallback((id) => {
    longPressRef.current = setTimeout(() => {
      haptic(20)
      setEditMode(true)
      setDragging(id)
    }, 500)
  }, [])

  const cancelLongPress = useCallback(() => {
    clearTimeout(longPressRef.current)
  }, [])

  const onDragStart = (id) => {
    setDragging(id)
    haptic(8)
  }

  const onDragOver = (id) => {
    if (id !== dragging) setOver(id)
  }

  const onDrop = (targetId) => {
    if (!dragging || dragging === targetId) return
    const newOrder = [...order]
    const fromIdx  = newOrder.indexOf(dragging)
    const toIdx    = newOrder.indexOf(targetId)
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, dragging)
    setOrder(newOrder)
    saveOrder(newOrder)
    setDragging(null)
    setOver(null)
    haptic(10)
  }

  const onDragEnd = () => {
    setDragging(null)
    setOver(null)
    setEditMode(false)
  }

  const exitEdit = () => {
    setEditMode(false)
    setDragging(null)
    setOver(null)
  }

  const orderedCards = order
    .map(id => cards.find(c => c.id === id))
    .filter(Boolean)

  return (
    <div>
      {/* Edit mode hint */}
      {editMode && (
        <div
          onClick={exitEdit}
          style={{
            fontSize:13, fontWeight:700, textAlign:'center',
            padding:'8px 0 12px', color:'rgba(0,0,0,0.4)',
            cursor:'pointer', userSelect:'none',
          }}
        >
          Drag to rearrange · Tap anywhere to finish
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${cols<=2?'140px':'180px'}, 1fr))`,
        gap,
      }}>
        {orderedCards.map(card => {
          const isDragging = dragging === card.id
          const isOver     = over === card.id
          return (
            <div
              key={card.id}
              draggable={editMode}
              onDragStart={() => onDragStart(card.id)}
              onDragOver={e => { e.preventDefault(); onDragOver(card.id) }}
              onDrop={() => onDrop(card.id)}
              onDragEnd={onDragEnd}
              onMouseDown={() => startLongPress(card.id)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onTouchStart={() => startLongPress(card.id)}
              onTouchEnd={cancelLongPress}
              style={{
                gridColumn: card.wide ? '1/-1' : card.span2 ? 'span 2' : undefined,
                gridRow:    card.tall ? 'span 2' : undefined,
                transform:  isDragging ? 'scale(1.04)' : isOver ? 'scale(0.96)' : 'scale(1)',
                opacity:    isDragging ? 0.75 : 1,
                transition: `transform 0.2s ${SP}, opacity 0.2s`,
                cursor:     editMode ? 'grab' : 'default',
                outline:    isOver ? '2px dashed rgba(0,0,0,0.2)' : 'none',
                borderRadius: 28,
                animation:  editMode && !isDragging ? 'wiggle 0.4s ease infinite' : 'none',
              }}
            >
              {renderCard(card)}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes wiggle {
          0%,100%{transform:rotate(0deg)}
          25%{transform:rotate(-0.8deg)}
          75%{transform:rotate(0.8deg)}
        }
      `}</style>
    </div>
  )
}



