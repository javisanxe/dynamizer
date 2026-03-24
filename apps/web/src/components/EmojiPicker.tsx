'use client'

import { useState, useRef, useEffect } from 'react'

const EMOJIS = [
  // Faces / expressions
  '😀','😂','😍','🥰','😎','🤩','😜','🤪','😇','🥳',
  '😤','😈','👻','💀','🤖','👽','🐱','🐶','🦊','🐼',
  // Gestures / people
  '👑','🧙','🧝','🧛','🧟','🦸','🦹','🧜','🧚','🤠',
  '🕵️','👮','🧑‍🚀','🧑‍🎤','🧑‍🍳','🧑‍🎨','🧑‍💻','🧑‍🔬','🧑‍🏫','🧑‍🏋️',
  // Animals
  '🦁','🐯','🐻','🐸','🐧','🦅','🦄','🐉','🦋','🐙',
  // Objects / symbols
  '🎮','🎲','🃏','🎯','🏆','🥇','⚡','🔥','💎','🌟',
  '🎸','🎺','🎻','🥁','🎹','🎤','🎭','🎨','🎬','🎪',
  // Food / drinks
  '🍕','🍔','🌮','🍣','🍜','🍩','🍦','🧁','🍺','🧃',
  // Nature
  '🌈','🌊','🌋','🌸','🍀','🍄','⭐','🌙','☀️','❄️',
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="emoji-picker-wrapper" ref={ref}>
      <button
        type="button"
        className="emoji-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose emoji"
        aria-expanded={open}
      >
        {value}
        <span className="emoji-trigger-caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="emoji-dropdown" role="dialog" aria-label="Emoji picker">
          <div className="emoji-grid">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={`emoji-option${e === value ? ' selected' : ''}`}
                onClick={() => { onChange(e); setOpen(false) }}
                aria-label={e}
                aria-pressed={e === value}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
