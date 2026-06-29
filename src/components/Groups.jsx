import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Groups({ groups, people, reload }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [err, setErr] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  async function add(e) {
    e.preventDefault()
    setErr('')
    const { error } = await supabase.from('groups').insert({ name, description })
    if (error) return setErr(error.message)
    setName(''); setDescription(''); reload()
  }

  async function remove(id) {
    if (!confirm('Excluir este grupo e todas as pessoas vinculadas?')) return
    await supabase.from('groups').delete().eq('id', id)
    reload()
  }

  function startEdit(g) {
    setEditingId(g.id)
    setEditName(g.name)
  }

  async function saveEdit(id) {
    if (!editName.trim()) return
    const { error } = await supabase.from('groups').update({ name: editName.trim() }).eq('id', id)
    if (!error) { setEditingId(null); reload() }
  }

  return (
    <div>
      <div className="card">
        <p className="eyebrow">Novo registro</p>
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>Cadastrar grupo</h2>
        <form onSubmit={add}>
          <div className="grid" style={{ alignItems: 'end' }}>
            <div><label>Nome</label><input value={name} onChange={e => setName(e.target.value)} required /></div>
            <div><label>Descrição</label><input value={description} onChange={e => setDescription(e.target.value)} /></div>
          </div>
          <button className="btn-gold" style={{ marginTop: 16 }}>Adicionar grupo</button>
          {err && <div className="error">{err}</div>}
        </form>
      </div>

      <div className="section-head">
        <h2 style={{ fontSize: 20 }}>Grupos <span className="pill">{groups.length}</span></h2>
      </div>
      {groups.length === 0
        ? <div className="card empty">Nenhum grupo ainda. Cadastre o primeiro acima.</div>
        : <div className="grid">
            {groups.map(g => (
              <div className="card" key={g.id}>
                <div className="spread">
                  {editingId === g.id
                    ? <input value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(g.id)}
                        style={{ marginRight: 8 }} autoFocus />
                    : <h3 style={{ fontSize: 18 }}>{g.name}</h3>}
                  <div className="row" style={{ gap: 6 }}>
                    {editingId === g.id
                      ? <>
                          <button className="btn-gold btn-sm" onClick={() => saveEdit(g.id)}>Salvar</button>
                          <button className="btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                        </>
                      : <>
                          <button className="btn-ghost btn-sm" onClick={() => startEdit(g)}>Editar</button>
                          <button className="btn-danger btn-sm" onClick={() => remove(g.id)}>Excluir</button>
                        </>}
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 13, margin: '6px 0 14px', minHeight: 18 }}>{g.description || '—'}</p>
                <div className="row">
                  <label style={{ margin: 0 }}>Pontos</label>
                  <span className="pill">{g.points} pts</span>
                </div>
                <div className="divider" />
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  Membros ({people.filter(p => p.group_id === g.id).length})
                </p>
                {people.filter(p => p.group_id === g.id).length === 0
                  ? <p className="muted" style={{ fontSize: 13 }}>Nenhuma pessoa neste grupo.</p>
                  : <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {people.filter(p => p.group_id === g.id).map(p => (
                        <li key={p.id} style={{ fontSize: 14 }}>{p.name}</li>
                      ))}
                    </ul>}
              </div>
            ))}
          </div>}
    </div>
  )
}
