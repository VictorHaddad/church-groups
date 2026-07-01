import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

function getInitials(email) {
  if (!email) return '?'
  return email[0].toUpperCase()
}

export default function UserMenu({
  session,
  canAccessFinance = false,
  financeUnlocked = false,
  onUnlockFinance,
  onLockFinance,
}) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [checking, setChecking] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const ref = useRef(null)

  const MAX_ATTEMPTS = 3

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const email = session?.user?.email ?? ''
  const name = session?.user?.user_metadata?.full_name ?? email.split('@')[0]

  function openPrompt() {
    setOpen(false)
    setPw(''); setPwErr('')
    setPrompt(true)
  }

  function closePrompt() {
    setPrompt(false)
    setPw(''); setPwErr(''); setChecking(false)
  }

  async function confirmUnlock(e) {
    e.preventDefault()
    if (!pw) return
    setChecking(true)
    setPwErr('')
    // Verifica a senha real no Supabase (não guardamos nada).
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    setChecking(false)
    if (error) {
      const used = attempts + 1
      setAttempts(used)
      if (used >= MAX_ATTEMPTS) {
        // Excedeu o limite de tentativas — encerra a sessão por segurança.
        supabase.auth.signOut()
        return
      }
      setPw('')
      setPwErr(`Senha incorreta. ${MAX_ATTEMPTS - used} tentativa(s) restante(s).`)
      return
    }
    setAttempts(0)
    closePrompt()
    onUnlockFinance?.()
  }

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

          {canAccessFinance && (financeUnlocked ? (
            <button
              className="user-dropdown__item"
              onClick={() => { setOpen(false); onLockFinance?.() }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Bloquear Financeiro
            </button>
          ) : (
            <button className="user-dropdown__item" onClick={openPrompt}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
              Ativar Financeiro
            </button>
          ))}

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

      {prompt && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="spread" style={{ marginBottom: 8 }}>
              <h3 style={{ fontSize: 18 }}>Ativar Financeiro</h3>
              <button type="button" onClick={closePrompt} aria-label="Fechar"
                style={{ background: 'none', padding: 0, color: 'inherit', display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="muted" style={{ fontSize: 14 }}>
              Confirme sua senha para liberar o acesso ao módulo financeiro nesta sessão.
            </p>
            <form onSubmit={confirmUnlock} noValidate>
              <label>Senha</label>
              <input type="password" autoFocus value={pw}
                onChange={e => { setPw(e.target.value); setPwErr('') }} />
              {pwErr && <div className="error">{pwErr}</div>}
              <div className="row" style={{ justifyContent: 'flex-end', marginTop: 22, gap: 8 }}>
                <button type="button" className="btn-ghost btn-sm" onClick={closePrompt}>Cancelar</button>
                <button className="btn-gold btn-sm" disabled={checking || !pw}>
                  {checking ? 'Verificando…' : 'Ativar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
