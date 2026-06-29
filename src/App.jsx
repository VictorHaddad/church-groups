import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Groups from './components/Groups'
import People from './components/People'
import Attendance from './components/Attendance'
import QuizPoints from './components/QuizPoints'
import Ranking from './components/Ranking'
import ScoringInfo from './components/ScoringInfo'
import logo from './assets/logo_igreja_02.png'

const TABS = [
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

export default function App() {
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('ranking')
  const [groups, setGroups] = useState([])
  const [people, setPeople] = useState([])
  const [breakdown, setBreakdown] = useState({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

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

  useEffect(() => { if (session) reload() }, [session, reload])

  if (!session) return <Auth />

  return (
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <img src={logo} alt="Logo da igreja" className="topbar-logo" />
          <div>
            <p className="eyebrow">Gestão de Grupos</p>
            <strong className="serif" style={{ fontSize: 18 }}>Painel da Igreja</strong>
          </div>
        </div>
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>{session.user.email}</span>
          <button className="btn-ghost btn-sm" onClick={() => supabase.auth.signOut()}>Sair</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
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
    </div>
  )
}
