import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Groups from './components/Groups'
import People from './components/People'
import Attendance from './components/Attendance'
import QuizPoints from './components/QuizPoints'
import Ranking from './components/Ranking'
import ScoringInfo from './components/ScoringInfo'
import Financeiro from './components/Financeiro'
import Members from './components/Members'
import ThemeToggle from './components/ThemeToggle'
import UserMenu from './components/UserMenu'
import { useTheme } from './useTheme'
import logo from './assets/logo_igreja_02.png'

const GROUP_ROLES = ['admin', 'lider']       // EBD
const OFFICE_ROLES = ['admin', 'secretaria'] // Membros e Financeiro

const MODULES = [
  { id: 'membros', label: 'Membros', roles: OFFICE_ROLES },
  { id: 'ebd', label: 'EBD', roles: GROUP_ROLES },
  { id: 'financeiro', label: 'Financeiro', roles: OFFICE_ROLES },
]

const EBD_TABS = [
  { id: 'ranking', label: 'Ranking' },
  { id: 'groups', label: 'Grupos' },
  { id: 'people', label: 'Pessoas' },
  { id: 'attendance', label: 'Presença' },
  { id: 'quiz', label: 'Perguntas' },
  { id: 'scoring', label: 'Pontuação' },
]

function emptyBreakdown() {
  return { presence: 0, absence: 0, bible: 0, booklet: 0, visitors: 0, quiz: 0 }
}

export default function AdminApp() {
  const { theme, toggle } = useTheme()
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [module, setModule] = useState(null)
  const [financeUnlocked, setFinanceUnlocked] = useState(false)
  const [tab, setTab] = useState('ranking')
  const [groups, setGroups] = useState([])
  const [people, setPeople] = useState([])
  const [breakdown, setBreakdown] = useState({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setRole(null); setRoleLoading(false); return }
    // Não reativa a tela de "Carregando" em re-autenticações (ex.: desbloqueio
    // do Financeiro), só na primeira carga.
    supabase.from('profiles').select('role').eq('id', session.user.id).single()
      .then(({ data }) => {
        setRole(data?.role ?? 'lider')
        setRoleLoading(false)
      })
  }, [session])

  const canAccessFinance = role ? OFFICE_ROLES.includes(role) : false
  const canSeeGroups = role ? GROUP_ROLES.includes(role) : false

  // O Financeiro só entra na lista de módulos quando desbloqueado por senha.
  const visibleModules = MODULES.filter(m => {
    if (!role || !m.roles.includes(role)) return false
    if (m.id === 'financeiro' && !financeUnlocked) return false
    return true
  })

  // Trava o Financeiro assim que o usuário sai do módulo.
  useEffect(() => {
    if (module !== 'financeiro' && financeUnlocked) setFinanceUnlocked(false)
  }, [module, financeUnlocked])

  // Trava o Financeiro automaticamente 10 minutos após o desbloqueio.
  useEffect(() => {
    if (!financeUnlocked) return
    const t = setTimeout(() => setFinanceUnlocked(false), 10 * 60 * 1000)
    return () => clearTimeout(t)
  }, [financeUnlocked])

  // Garante que o módulo ativo é sempre um permitido/visível.
  useEffect(() => {
    if (role && !visibleModules.some(m => m.id === module)) {
      setModule(visibleModules[0]?.id ?? null)
    }
  }, [role, financeUnlocked, module]) // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(async () => {
    const [g, p, att, vis, quiz] = await Promise.all([
      supabase.from('groups').select('*'),
      supabase.from('people').select('*').order('points', { ascending: false }),
      supabase.from('attendance').select('person_id, status, bible, booklet'),
      supabase.from('visitor_events').select('person_id'),
      supabase.from('quiz_points').select('group_id, points'),
    ])

    const peopleList = p.data || []
    const personGroup = {}
    peopleList.forEach(pp => { personGroup[pp.id] = pp.group_id })

    const groupBreakdown = {}
    const get = gid => (groupBreakdown[gid] ||= emptyBreakdown())

    ;(att.data || []).forEach(r => {
      const gid = personGroup[r.person_id]
      if (!gid) return
      const b = get(gid)
      if (r.status === 'presente') b.presence += 10
      if (r.status === 'ausente') b.absence -= 10
      if (r.bible) b.bible += 1
      if (r.booklet) b.booklet += 1
    })
    ;(vis.data || []).forEach(v => {
      const gid = personGroup[v.person_id]
      if (gid) get(gid).visitors += 100
    })
    ;(quiz.data || []).forEach(q => {
      get(q.group_id).quiz += q.points
    })

    const totalOf = b => b.presence + b.absence + b.bible + b.booklet + b.visitors + b.quiz

    const groupsWithTotals = (g.data || [])
      .map(gr => ({ ...gr, points: totalOf(groupBreakdown[gr.id] || emptyBreakdown()) }))
      .sort((a, b) => b.points - a.points)

    setGroups(groupsWithTotals)
    setPeople(peopleList)
    setBreakdown(groupBreakdown)
  }, [])

  useEffect(() => { if (session && canSeeGroups) reload() }, [session, canSeeGroups, reload])

  if (!session) return <Auth />
  if (roleLoading) return <div className="empty" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Carregando…</div>

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <img src={logo} alt="Logo da igreja" className="topbar-logo" />
          <div>
            <p className="eyebrow">Igreja</p>
            <strong className="serif" style={{ fontSize: 18 }}>Painel Administrativo</strong>
          </div>
        </div>
        <div className="row">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <UserMenu
            session={session}
            canAccessFinance={canAccessFinance}
            financeUnlocked={financeUnlocked}
            onUnlockFinance={() => { setFinanceUnlocked(true); setModule('financeiro') }}
            onLockFinance={() => setFinanceUnlocked(false)}
          />
        </div>
      </div>

      {visibleModules.length > 1 && (
        <div className="modules">
          {visibleModules.map(m => (
            <button key={m.id} className={`module-btn ${module === m.id ? 'active' : ''}`}
              onClick={() => setModule(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {module === 'membros' && <Members />}

      {module === 'ebd' && (
        <>
          <div className="tabs">
            {EBD_TABS.map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'ranking' && <Ranking people={people} groups={groups} />}
          {tab === 'groups' && <Groups groups={groups} people={people} reload={reload} />}
          {tab === 'people' && <People people={people} groups={groups} reload={reload} />}
          {tab === 'attendance' && <Attendance people={people} groups={groups} reloadTotals={reload} />}
          {tab === 'quiz' && <QuizPoints groups={groups} reloadTotals={reload} />}
          {tab === 'scoring' && <ScoringInfo groups={groups} breakdown={breakdown} />}
        </>
      )}

      {module === 'financeiro' && financeUnlocked && <Financeiro />}
    </div>
  )
}
