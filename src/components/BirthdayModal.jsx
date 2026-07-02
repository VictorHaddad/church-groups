import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { todayLocal } from './DateField'

const COLORS = ['#c79a3a', '#4a8fc2', '#b5546a', '#95cbeb', '#9c7522']

export default function BirthdayModal({ session, enabled }) {
  const [open, setOpen] = useState(false)
  const [people, setPeople] = useState([])

  useEffect(() => {
    if (!enabled || !session) return
    const seenKey = `birthday-seen-${session.user.id}`
    const todayStr = todayLocal()
    if (localStorage.getItem(seenKey) === todayStr) return // já apareceu hoje

    let active = true
    supabase.from('members').select('name, birth_date').eq('status', 'ativo')
      .then(({ data }) => {
        if (!active) return
        const md = todayStr.slice(5) // MM-DD de hoje
        const bdays = (data || []).filter(m => m.birth_date && m.birth_date.slice(5) === md)
        if (bdays.length) {
          setPeople(bdays)
          setOpen(true)
          localStorage.setItem(seenKey, todayStr)
        }
      })
    return () => { active = false }
  }, [enabled, session])

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="modal-card birthday-modal" onClick={e => e.stopPropagation()}>
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} style={{
              left: `${(i * 6.5) % 100}%`,
              background: COLORS[i % COLORS.length],
              animationDuration: `${2.5 + (i % 5) * 0.4}s`,
              animationDelay: `${(i % 6) * 0.25}s`,
            }} />
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="spread" style={{ marginBottom: 4 }}>
            <span className="eyebrow">Hoje na igreja</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar"
              style={{ background: 'none', padding: 0, color: 'inherit', display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ fontSize: 46, textAlign: 'center' }}>🎂</div>
          <h3 style={{ fontSize: 22, textAlign: 'center', margin: '6px 0 16px' }}>
            {people.length === 1 ? 'Aniversariante de hoje!' : 'Aniversariantes de hoje!'}
          </h3>

          <div style={{ textAlign: 'center' }}>
            {people.map((p, i) => (
              <div key={i} className="serif" style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>
                {p.name}
              </div>
            ))}
          </div>

          <p className="muted" style={{ textAlign: 'center', fontSize: 13, marginTop: 16 }}>
            Que tal enviar uma mensagem de carinho? 🎉
          </p>
        </div>
      </div>
    </div>
  )
}
