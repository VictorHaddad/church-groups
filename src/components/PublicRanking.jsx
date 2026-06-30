import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import ThemeToggle from './ThemeToggle'
import { useTheme } from '../useTheme'
import logo from '../assets/logo_igreja_02.png'

export default function PublicRanking() {
  const { theme, toggle } = useTheme()
  const [groups, setGroups] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [g, p] = await Promise.all([
        supabase.from('group_scores').select('*').order('points', { ascending: false }),
        supabase.from('person_scores').select('*').order('points', { ascending: false }),
      ])
      setGroups(g.data || [])
      setPeople(p.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const groupName = id => groups.find(g => g.id === id)?.name || '—'

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <img src={logo} alt="Logo da igreja" className="topbar-logo" />
          <div>
            <p className="eyebrow">EBD - Escola Bíblica Dominical</p>
            <strong className="serif" style={{ fontSize: 18 }}>Ranking dos Grupos</strong>
          </div>
        </div>
        <div className="row">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <a
            href={`${import.meta.env.BASE_URL}admin`}
            className="leader-link"
            title="Área de líderes"
            aria-label="Área de líderes"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </a>
        </div>
      </div>

      {loading ? <div className="empty">Carregando…</div> : (
        <>
          <div className="section-head"><h2 style={{ fontSize: 20 }}>Ranking de grupos</h2></div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
            {groups.length === 0
              ? <div className="empty">Sem grupos.</div>
              : <table><tbody>
                  {groups.map((g, i) => (
                    <tr key={g.id} className={i === 0 ? 'rank-1' : ''}>
                      <td className="rank-num">{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>
                        {g.name}{i === 0 ? ' 🏆' : ''}
                        <div className="muted" style={{ fontSize: 12, fontWeight: 400 }}>{g.description}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}><span className="pill">{g.points} pts</span></td>
                    </tr>
                  ))}
                </tbody></table>}
          </div>

          <div className="section-head"><h2 style={{ fontSize: 20 }}>Ranking de pessoas</h2></div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {people.length === 0
              ? <div className="empty">Sem pessoas.</div>
              : <table><tbody>
                  {people.map((p, i) => (
                    <tr key={p.id} className={i === 0 ? 'rank-1' : ''}>
                      <td className="rank-num">{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>
                        {p.name}
                        <div className="muted" style={{ fontSize: 12, fontWeight: 400 }}>{groupName(p.group_id)}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}><span className="pill">{p.points} pts</span></td>
                    </tr>
                  ))}
                </tbody></table>}
          </div>
        </>
      )}
    </div>
  )
}
