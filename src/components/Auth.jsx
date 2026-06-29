import { useState } from 'react'
import { supabase } from '../supabaseClient'
import logo from '../assets/logo_igreja_02.png'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (error.status === 429) setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
      else setError(error.message)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <img src={logo} alt="Logo da igreja" className="auth-logo" />
        <p className="eyebrow" style={{ textAlign: 'center' }}>EBD - Escola Bíblica Dominical</p>
        <h1 style={{ textAlign: 'center', fontSize: 26, margin: '4px 0 6px' }}>Entrar</h1>
        <p className="muted" style={{ textAlign: 'center', fontSize: 13 }}>
          Acesso restrito à equipe da igreja
        </p>
        <form onSubmit={submit} style={{ marginTop: 18 }}>
          <label>E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="voce@igreja.com" />
          <label>Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          <button className="btn-primary" style={{ marginTop: 20 }} disabled={loading}>
            {loading ? 'Aguarde…' : 'Entrar'}
          </button>
          <p className="muted" style={{ textAlign: 'center', fontSize: 13, marginTop: 14 }}>
            IEP Jesus o Pão da Vida
          </p>
          {error && <div className="error">{error}</div>}
        </form>
        <p className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 22, fontStyle: 'italic' }}>
          "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho." - Salmo 119:105
        </p>
      </div>
    </div>
  )
}
