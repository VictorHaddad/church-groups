import { useState, useEffect, useRef } from 'react'

export function formatDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// Data de hoje em horário local (não UTC), no formato YYYY-MM-DD.
export function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function maskDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const parts = []
  if (digits.length > 0) parts.push(digits.slice(0, 2))
  if (digits.length > 2) parts.push(digits.slice(2, 4))
  if (digits.length > 4) parts.push(digits.slice(4, 8))
  return parts.join('/')
}

export default function DateField({ value, onChange, allowEmpty = false }) {
  const [text, setText] = useState(formatDate(value))
  const inputRef = useRef(null)

  useEffect(() => { setText(formatDate(value)) }, [value])

  function handleChange(e) {
    const raw = e.target.value
    const prevCursor = e.target.selectionStart
    const masked = maskDate(raw)
    setText(masked)

    if (allowEmpty && masked === '') onChange('')

    const match = masked.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (match) {
      const [, d, m, y] = match
      onChange(`${y}-${m}-${d}`)
    }

    const diff = masked.length - raw.length
    const nextCursor = Math.max(0, prevCursor + diff)
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(nextCursor, nextCursor)
    })
  }

  return (
    <input ref={inputRef} type="text" inputMode="numeric" placeholder="dd/mm/aaaa" maxLength={10}
      value={text} onChange={handleChange} />
  )
}
