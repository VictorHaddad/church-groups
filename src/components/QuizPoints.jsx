import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import DateField, { formatDate } from './DateField'

export default function QuizPoints({ groups, reloadTotals }) {
  const today = new Date().toISOString().slice(0, 10)
  const [groupId, setGroupId] = useState('')
  const [date, setDate] = useState(today)
  const [points, setPoints] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const groupName = id => groups.find(g => g.id === id)?.name || '—'

  const loadHistory = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('quiz_points')
      .select('id, group_id, date, points, note')
      .order('date', { ascending: false })
    setHistory(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  async function add(e) {
    e.preventDefault()
    setErr('')
    if (!groupId) return setErr('Selecione um grupo.')
    if (!points) return setErr('Informe a pontuação.')
    const { error } = await supabase.from('quiz_points')
      .insert({ group_id: groupId, date, points: Number(points), note: note || null })
    if (error) return setErr(error.message)
    setPoints(''); setNote('')
    loadHistory(); reloadTotals?.()
  }

  async function remove(id) {
    await supabase.from('quiz_points').delete().eq('id', id)
    setHistory(h => h.filter(r => r.id !== id))
    reloadTotals?.()
  }

  return (
    <div>
      <div className="card">
        <p className="eyebrow">Novo registro</p>
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>Lançar pontos de pergunta</h2>
        <form onSubmit={add}>
          <div className="grid" style={{ alignItems: 'end' }}>
            <div>
              <label>Grupo</label>
              <select value={groupId} onChange={e => setGroupId(e.target.value)} required>
                <option value="">Selecione…</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div><label>Data</label><DateField value={date} onChange={setDate} /></div>
            <div><label>Pontos</label><input type="number" value={points} onChange={e => setPoints(e.target.value)} required /></div>
            <div><label>Pergunta / observação</label><input value={note} onChange={e => setNote(e.target.value)} /></div>
          </div>
          <button className="btn-gold" style={{ marginTop: 16 }} disabled={!groups.length}>Lançar pontos</button>
          {!groups.length && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Cadastre um grupo primeiro.</p>}
          {err && <div className="error">{err}</div>}
        </form>
      </div>

      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Histórico de perguntas</h2>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div className="empty">Carregando…</div>
          : history.length === 0
            ? <div className="empty">Nenhum lançamento ainda.</div>
            : <table>
                <thead><tr><th>Dia</th><th>Grupo</th><th>Pontos</th><th>Observação</th><th></th></tr></thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{formatDate(h.date)}</td>
                      <td><span className="pill">{groupName(h.group_id)}</span></td>
                      <td>{h.points}</td>
                      <td className="muted">{h.note || '—'}</td>
                      <td style={{ width: 90 }}>
                        <button className="btn-danger btn-sm" onClick={() => remove(h.id)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>}
      </div>
    </div>
  )
}
