import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

function getInitials(email) {
  if (!email) return '?'
  return email[0].toUpperCase()
}

export default function UserMenu({ session }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const email = session?.user?.email ?? ''
  const name = session?.user?.user_metadata?.full_name ?? email.split('@')[0]

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-avatar" onClick={() => setOpen(o => !o)}>
        {getInitials(email)}
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown__header">
            <div className="user-avatar user-avatar--lg">{getInitials(email)}</div>
            <div>
              <div className="user-dropdown__name">{name}</div>
              <div className="user-dropdown__email">{email}</div>
            </div>
          </div>

          <div className="divider" />

          <a
            className="user-dropdown__item"
            href={import.meta.env.BASE_URL}
            onClick={() => setOpen(false)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Ver página pública
          </a>

          <button
            className="user-dropdown__item user-dropdown__item--danger"
            onClick={() => supabase.auth.signOut()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
