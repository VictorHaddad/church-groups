import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function People({ people, groups, reload }) {
  const [name, setName] = useState('')
  const [groupId, setGroupId] = useState('')
  const [points, setPoints] = useState(0)
  const [err, setErr] = useState('')

  const groupName = id => groups.find(g => g.id === id)?.name || '—'

  async function add(e) {
    e.preventDefault()
    setErr('')
    if (!groupId) return setErr('Selecione um grupo.')
    const { error } = await supabase.from('people').insert({ name, group_id: groupId, points: Number(points) || 0 })
    if (error) return setErr(error.message)
    setName(''); setGroupId(''); setPoints(0); reload()
  }

  async function updatePoints(id, value) {
    const { error } = await supabase.from('people').update({ points: Number(value) || 0 }).eq('id', id)
    if (!error) reload()
  }

  async function remove(id) {
    if (!confirm('Excluir esta pessoa?')) return
    await supabase.from('people').delete().eq('id', id)
    reload()
  }

  return (
    <div>
      <div className="card">
        <p className="eyebrow">Novo registro</p>
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>Cadastrar pessoa</h2>
        <form onSubmit={add}>
          <div className="grid" style={{ alignItems: 'end' }}>
            <div><label>Nome</label><input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><label>Grupo</label>
              <select value={groupId} onChange={e => setGroupId(e.target.value)} required>
                <option value="">Selecione…</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div><label>Pontuação inicial</label><input type="number" value={points} onChange={e => setPoints(e.target.value)} /></div>
          </div>
          <button className="btn-gold" style={{ marginTop: 16 }} disabled={!groups.length}>Adicionar pessoa</button>
          {!groups.length && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Cadastre um grupo primeiro.</p>}
          {err && <div className="error">{err}</div>}
        </form>
      </div>

      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Pessoas <span className="pill">{people.length}</span></h2>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {people.length === 0
          ? <div className="empty">Nenhuma pessoa cadastrada.</div>
          : <table>
              <thead><tr><th>Nome</th><th>Grupo</th><th>Pontos</th><th></th></tr></thead>
              <tbody>
                {people.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="pill">{groupName(p.group_id)}</span></td>
                    <td><input className="score-edit" type="number" defaultValue={p.points}
                      onBlur={e => updatePoints(p.id, e.target.value)} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-danger btn-sm" onClick={() => remove(p.id)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
      </div>
    </div>
  )
}
