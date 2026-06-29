import { useState, useEffect } from 'react'

export function formatDate(d) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function maskDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  const parts = []
  if (digits.length > 0) parts.push(digits.slice(0, 2))
  if (digits.length > 2) parts.push(digits.slice(2, 4))
  if (digits.length > 4) parts.push(digits.slice(4, 8))
  return parts.join('/')
}

export default function DateField({ value, onChange }) {
  const [text, setText] = useState(formatDate(value))

  useEffect(() => { setText(formatDate(value)) }, [value])

  function handleChange(raw) {
    const masked = maskDate(raw)
    setText(masked)
    const match = masked.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (match) {
      const [, d, m, y] = match
      onChange(`${y}-${m}-${d}`)
    }
  }

  return (
    <input type="text" inputMode="numeric" placeholder="dd/mm/aaaa" maxLength={10}
      value={text} onChange={e => handleChange(e.target.value)} />
  )
}
