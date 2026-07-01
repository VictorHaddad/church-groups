import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import DateField, { formatDate, todayLocal } from './DateField'
import ConfirmModal from './ConfirmModal'

export default function Attendance({ people, groups, reloadTotals }) {
  const today = todayLocal()
  const [date, setDate] = useState(today)
  const [records, setRecords] = useState({}) // person_id -> { id, status, bible, booklet }
  const [visitors, setVisitors] = useState({}) // person_id -> [event ids]
  const [loading, setLoading] = useState(false)

  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [filterPerson, setFilterPerson] = useState('all')
  const [filterDate, setFilterDate] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)

  const isFuture = date > today

  const load = useCallback(async () => {
    setLoading(true)
    const [att, vis] = await Promise.all([
      supabase.from('attendance').select('id, person_id, status, bible, booklet').eq('date', date),
      supabase.from('visitor_events').select('id, person_id').eq('date', date),
    ])
    const rmap = {}
    ;(att.data || []).forEach(r => { rmap[r.person_id] = r })
    const vmap = {}
    ;(vis.data || []).forEach(v => { (vmap[v.person_id] ||= []).push(v.id) })
    setRecords(rmap); setVisitors(vmap); setLoading(false)
  }, [date])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    const [att, vis] = await Promise.all([
      supabase.from('attendance').select('id, date, person_id, status, bible, booklet').order('date', { ascending: false }),
      supabase.from('visitor_events').select('id, date, person_id').order('date', { ascending: false }),
    ])
    const visCount = {}
    ;(vis.data || []).forEach(v => {
      const key = `${v.person_id}|${v.date}`
      visCount[key] = (visCount[key] || 0) + 1
    })
    const rows = (att.data || []).map(r => ({ ...r, visitors: visCount[`${r.person_id}|${r.date}`] || 0 }))
    setHistory(rows)
    setHistoryLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadHistory() }, [loadHistory])

  function refreshAll() { loadHistory(); reloadTotals?.() }

  // Um registro sem status, sem bíblia e sem revista não tem significado:
  // em vez de gravar uma linha vazia, removemos o registro.
  function isEmptyRecord({ status, bible, booklet }) {
    return !status && !bible && !booklet
  }

  async function persist(personId, next) {
    if (isFuture) return
    const current = records[personId] || {}
    if (isEmptyRecord(next)) {
      if (current.id) {
        await supabase.from('attendance').delete().eq('id', current.id)
        setRecords(r => { const c = { ...r }; delete c[personId]; return c })
        refreshAll()
      }
      return
    }
    const { data, error } = await supabase.from('attendance')
      .upsert({ person_id: personId, date, ...next }, { onConflict: 'person_id,date' })
      .select('id, status, bible, booklet').single()
    if (!error) { setRecords(r => ({ ...r, [personId]: data })); refreshAll() }
  }

  async function setStatus(personId, status) {
    const current = records[personId] || {}
    const nextStatus = current.status === status ? null : status // clica de novo pra desmarcar
    await persist(personId, { status: nextStatus, bible: current.bible || false, booklet: current.booklet || false })
  }

  async function toggleFlag(personId, field) {
    const current = records[personId] || {}
    const next = { status: current.status || null, bible: current.bible || false, booklet: current.booklet || false }
    next[field] = !next[field]
    await persist(personId, next)
  }

  async function addVisitor(personId) {
    if (isFuture) return
    const { data, error } = await supabase.from('visitor_events')
      .insert({ person_id: personId, date }).select('id').single()
    if (!error) {
      setVisitors(v => ({ ...v, [personId]: [...(v[personId] || []), data.id] }))
      refreshAll()
    }
  }

  async function removeVisitor(personId) {
    const ids = visitors[personId] || []
    const lastId = ids[ids.length - 1]
    if (!lastId) return
    await supabase.from('visitor_events').delete().eq('id', lastId)
    setVisitors(v => ({ ...v, [personId]: ids.slice(0, -1) }))
    refreshAll()
  }

  async function confirmRemoveRecord() {
    const record = pendingDelete
    if (!record) return
    await supabase.from('attendance').delete().eq('id', record.id)
    setHistory(h => h.filter(r => r.id !== record.id))
    if (record.date === date) {
      setRecords(r => { const c = { ...r }; delete c[record.person_id]; return c })
    }
    setPendingDelete(null)
    reloadTotals?.()
  }

  const personName = id => people.find(p => p.id === id)?.name || '—'
  const groupName = id => groups.find(g => g.id === id)?.name || '—'
  const personGroupId = id => people.find(p => p.id === id)?.group_id

  const presentCount = Object.values(records).filter(r => r.status === 'presente').length

  const availableDates = useMemo(() => {
    const set = new Set(history.map(h => h.date))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [history])

  const filteredHistory = useMemo(() => (
    history
      // esconde linhas vazias (sem status, bíblia, revista nem visitantes)
      .filter(h => h.status || h.bible || h.booklet || h.visitors)
      .filter(h => filterPerson === 'all' || h.person_id === filterPerson)
      .filter(h => filterDate === 'all' || h.date === filterDate)
  ), [history, filterPerson, filterDate])

  return (
    <div>
      <div className="card">
        <div className="spread">
          <div>
            <p className="eyebrow">Chamada</p>
            <h2 style={{ fontSize: 20 }}>Marcar presença</h2>
          </div>
          <div>
            <label style={{ marginTop: 0 }}>Data</label>
            <DateField value={date} onChange={setDate} />
          </div>
        </div>
        <div className="divider" />
        <p className="muted" style={{ fontSize: 13 }}>
          {loading ? 'Carregando…' : `${presentCount} de ${people.length} presentes`}
        </p>
        {isFuture && <div className="error">Não é possível marcar presença em data futura.</div>}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {people.length === 0
          ? <div className="empty">Cadastre pessoas para registrar presença.</div>
          : <table>
              <thead>
                <tr>
                  <th>Nome</th><th>Grupo</th><th>Presença</th><th>Bíblia</th><th>Revista</th><th>Visitantes</th>
                </tr>
              </thead>
              <tbody>
                {people.map(p => {
                  const r = records[p.id] || {}
                  const visitorCount = (visitors[p.id] || []).length
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="pill">{groupName(p.group_id)}</span></td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          <button
                            className={r.status === 'presente' ? 'btn-gold btn-sm' : 'btn-ghost btn-sm'}
                            onClick={() => setStatus(p.id, 'presente')}>Presente</button>
                          <button
                            className={r.status === 'ausente' ? 'btn-danger btn-sm' : 'btn-ghost btn-sm'}
                            onClick={() => setStatus(p.id, 'ausente')}>Ausente</button>
                        </div>
                      </td>
                      <td style={{ width: 70 }}>
                        <input className="check" type="checkbox" checked={!!r.bible}
                          onChange={() => toggleFlag(p.id, 'bible')} />
                      </td>
                      <td style={{ width: 70 }}>
                        <input className="check" type="checkbox" checked={!!r.booklet}
                          onChange={() => toggleFlag(p.id, 'booklet')} />
                      </td>
                      <td style={{ width: 120 }}>
                        <div className="row" style={{ gap: 8 }}>
                          <button className="btn-ghost btn-sm" onClick={() => removeVisitor(p.id)} disabled={!visitorCount}>−</button>
                          <span>{visitorCount}</span>
                          <button className="btn-ghost btn-sm" onClick={() => addVisitor(p.id)}>+</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>}
      </div>

      <div className="card">
        <p className="eyebrow">Histórico</p>
        <h2 style={{ fontSize: 20 }}>Presenças registradas</h2>
        <div className="divider" />
        <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ marginTop: 0 }}>Pessoa</label>
            <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)}>
              <option value="all">Todas as pessoas</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ marginTop: 0 }}>Dia</label>
            <select value={filterDate} onChange={e => setFilterDate(e.target.value)}>
              <option value="all">Todos os dias</option>
              {availableDates.map(d => <option key={d} value={d}>{formatDate(d)}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {historyLoading
          ? <div className="empty">Carregando…</div>
          : filteredHistory.length === 0
            ? <div className="empty">Nenhuma presença encontrada.</div>
            : <table>
                <thead><tr><th>Dia</th><th>Nome</th><th>Grupo</th><th>Status</th><th>Bíblia</th><th>Revista</th><th>Visitantes</th><th></th></tr></thead>
                <tbody>
                  {filteredHistory.map((h, i) => {
                    const dayChanged = i > 0 && filteredHistory[i - 1].date !== h.date
                    return (
                      <tr key={h.id} className={dayChanged ? 'day-divider' : ''}>
                        <td style={{ fontWeight: 600 }}>{formatDate(h.date)}</td>
                        <td>{personName(h.person_id)}</td>
                        <td><span className="pill">{groupName(personGroupId(h.person_id))}</span></td>
                        <td>{h.status === 'presente' ? 'Presente' : h.status === 'ausente' ? 'Ausente' : '—'}</td>
                        <td>{h.bible ? 'Sim' : '—'}</td>
                        <td>{h.booklet ? 'Sim' : '—'}</td>
                        <td>{h.visitors || '—'}</td>
                        <td style={{ width: 90 }}>
                          <button className="btn-danger btn-sm" onClick={() => setPendingDelete(h)}>Excluir</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>}
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Excluir registro"
          message={`Excluir o registro de presença de "${personName(pendingDelete.person_id)}" em ${formatDate(pendingDelete.date)}?`}
          confirmLabel="Excluir"
          onConfirm={confirmRemoveRecord}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
