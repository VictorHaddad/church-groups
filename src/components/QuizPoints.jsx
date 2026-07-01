import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import DateField, { formatDate, todayLocal } from './DateField'
import ConfirmModal from './ConfirmModal'

export default function QuizPoints({ groups, reloadTotals }) {
  const today = todayLocal()
  const [groupId, setGroupId] = useState('')
  const [date, setDate] = useState(today)
  const [points, setPoints] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editGroupId, setEditGroupId] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editPoints, setEditPoints] = useState('')
  const [editNote, setEditNote] = useState('')

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
    if (date > todayLocal()) return setErr('A data não pode ser futura.')
    if (!points) return setErr('Informe a pontuação.')
    const { error } = await supabase.from('quiz_points')
      .insert({ group_id: groupId, date, points: Number(points), note: note || null })
    if (error) return setErr(error.message)
    setPoints(''); setNote('')
    loadHistory(); reloadTotals?.()
  }

  async function confirmRemove() {
    if (!pendingDelete) return
    await supabase.from('quiz_points').delete().eq('id', pendingDelete.id)
    setHistory(h => h.filter(r => r.id !== pendingDelete.id))
    setPendingDelete(null)
    reloadTotals?.()
  }

  function startEdit(h) {
    setEditingId(h.id)
    setEditGroupId(h.group_id)
    setEditDate(h.date)
    setEditPoints(String(h.points))
    setEditNote(h.note || '')
  }

  async function saveEdit(id) {
    if (!editGroupId || !editPoints) return
    if (editDate > todayLocal()) return
    const { error } = await supabase.from('quiz_points')
      .update({ group_id: editGroupId, date: editDate, points: Number(editPoints), note: editNote || null })
      .eq('id', id)
    if (!error) { setEditingId(null); loadHistory(); reloadTotals?.() }
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
                  {history.map(h => editingId === h.id ? (
                    <tr key={h.id}>
                      <td><DateField value={editDate} onChange={setEditDate} /></td>
                      <td>
                        <select value={editGroupId} onChange={e => setEditGroupId(e.target.value)}>
                          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </td>
                      <td><input className="score-edit" type="number" value={editPoints} onChange={e => setEditPoints(e.target.value)} /></td>
                      <td><input value={editNote} onChange={e => setEditNote(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(h.id)} /></td>
                      <td style={{ width: 150 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn-gold btn-sm" onClick={() => saveEdit(h.id)}>Salvar</button>
                          <button className="btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{formatDate(h.date)}</td>
                      <td><span className="pill">{groupName(h.group_id)}</span></td>
                      <td>{h.points}</td>
                      <td className="muted">{h.note || '—'}</td>
                      <td style={{ width: 150 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn-ghost btn-sm" onClick={() => startEdit(h)}>Editar</button>
                          <button className="btn-danger btn-sm" onClick={() => setPendingDelete(h)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>}
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Excluir lançamento"
          message={`Excluir o lançamento de ${pendingDelete.points} pontos para "${groupName(pendingDelete.group_id)}"?`}
          confirmLabel="Excluir"
          onConfirm={confirmRemove}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
