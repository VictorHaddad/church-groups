import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import DateField, { formatDate, todayLocal } from './DateField'
import ConfirmModal from './ConfirmModal'

const MARITAL_STATUSES = ['Solteiro(a)', 'Casado(a)', 'Viúvo(a)', 'Divorciado(a)']
const ORIGINS = ['Batismo', 'Transferência', 'Outro']

// Só letras (com acento), espaços, hífen e apóstrofo — bloqueia números/símbolos.
function sanitizeName(v) {
  return v.replace(/[^\p{L}\s'-]/gu, '')
}

// Máscara de telefone: (XX) XXXX-XXXX (fixo) ou (XX) XXXXX-XXXX (celular).
function maskPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// Máscara de exibição: mostra DDD + 2 últimos dígitos do telefone.
function maskPhoneView(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length < 4) return '•'.repeat(digits.length) || '—'
  return `(${digits.slice(0, 2)}) •••••-••${digits.slice(-2)}`
}

// Máscara de exibição: mostra os 2 primeiros do email e o domínio.
function maskEmailView(email) {
  const [local, domain] = (email || '').split('@')
  if (!domain) return email || ''
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(1, local.length - 2))}@${domain}`
}

function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function yearsAgoStr(years) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return localDateStr(d)
}

const emptyForm = {
  name: '', phone: '', email: '', birthDate: '', maritalStatus: '',
  baptismDate: '', origin: '', churchRole: '', status: 'ativo',
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [err, setErr] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ativo')
  const [hideContacts, setHideContacts] = useState(true)
  const [pendingDelete, setPendingDelete] = useState(null)

  const set = (field) => (value) => setForm(f => ({ ...f, [field]: value }))
  const setFromInput = (field) => (e) => set(field)(e.target.value)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('members')
      .select('*')
      .order('name')
    setMembers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function toPayload(f) {
    return {
      name: f.name.trim(),
      phone: f.phone.trim() || null,
      email: f.email.trim() || null,
      birth_date: f.birthDate || null,
      marital_status: f.maritalStatus || null,
      baptism_date: f.baptismDate || null,
      origin: f.origin || null,
      church_role: f.churchRole.trim() || null,
      status: f.status,
    }
  }

  async function save(e) {
    e.preventDefault()
    setErr('')
    if (!form.name.trim()) return setErr('Informe o nome do membro.')
    if (!form.birthDate) return setErr('Informe a data de nascimento.')
    if (form.birthDate > localDateStr()) return setErr('A data de nascimento não pode ser futura.')
    if (form.birthDate < yearsAgoStr(100)) return setErr('Data de nascimento inválida (máximo de 100 anos).')
    if (!form.maritalStatus) return setErr('Selecione o estado civil.')
    if (!form.churchRole.trim()) return setErr('Informe o cargo / função.')
    if (form.baptismDate) {
      if (form.baptismDate > localDateStr()) return setErr('A data de batismo não pode ser futura.')
      if (form.baptismDate < yearsAgoStr(90)) return setErr('Data de batismo inválida (máximo de 90 anos).')
    }

    const payload = toPayload(form)
    const { error } = editingId
      ? await supabase.from('members')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editingId)
      : await supabase.from('members').insert(payload)

    if (error) return setErr(error.message)
    setForm(emptyForm)
    setEditingId(null)
    load()
  }

  function startEdit(m) {
    setEditingId(m.id)
    setForm({
      name: m.name,
      phone: m.phone || '',
      email: m.email || '',
      birthDate: m.birth_date || '',
      maritalStatus: m.marital_status || '',
      baptismDate: m.baptism_date || '',
      origin: m.origin || '',
      churchRole: m.church_role || '',
      status: m.status,
    })
    setErr('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setErr('')
  }

  async function confirmRemove() {
    if (!pendingDelete) return
    const { error } = await supabase.from('members').delete().eq('id', pendingDelete.id)
    if (!error) {
      setMembers(ms => ms.filter(m => m.id !== pendingDelete.id))
      if (editingId === pendingDelete.id) cancelEdit()
    }
    setPendingDelete(null)
  }

  const filtered = useMemo(() => (
    members
      .filter(m => statusFilter === 'todos' || m.status === statusFilter)
      .filter(m => m.name.toLowerCase().includes(search.trim().toLowerCase()))
  ), [members, search, statusFilter])

  const activeCount = members.filter(m => m.status === 'ativo').length

  const currentMM = todayLocal().slice(5, 7)
  const birthdaysThisMonth = members
    .filter(m => m.birth_date && m.birth_date.slice(5, 7) === currentMM)
    .sort((a, b) => a.birth_date.slice(8, 10).localeCompare(b.birth_date.slice(8, 10)))

  return (
    <div>
      <div className="card">
        <p className="eyebrow">{editingId ? 'Edição' : 'Novo cadastro'}</p>
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>
          {editingId ? 'Editar membro' : 'Cadastrar membro'}
        </h2>
        <form onSubmit={save} noValidate>
          <div className="grid" style={{ alignItems: 'end' }}>
            <div><label>Nome *</label><input value={form.name} onChange={e => set('name')(sanitizeName(e.target.value))} maxLength={80} required /></div>
            <div><label>Telefone / WhatsApp</label><input type="tel" value={form.phone} onChange={e => set('phone')(maskPhone(e.target.value))} maxLength={15} /></div>
            <div><label>Email</label><input type="email" value={form.email} onChange={setFromInput('email')} /></div>
            <div><label>Nascimento *</label><DateField value={form.birthDate} onChange={set('birthDate')} allowEmpty /></div>
            <div>
              <label>Estado civil *</label>
              <select value={form.maritalStatus} onChange={setFromInput('maritalStatus')}>
                <option value="">—</option>
                {MARITAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label>Batismo</label><DateField value={form.baptismDate} onChange={set('baptismDate')} allowEmpty /></div>
            <div>
              <label>Como chegou</label>
              <select value={form.origin} onChange={setFromInput('origin')}>
                <option value="">—</option>
                {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><label>Cargo / função *</label><input value={form.churchRole} onChange={setFromInput('churchRole')} placeholder="Diácono, músico…" /></div>
            <div>
              <label>Status *</label>
              <select value={form.status} onChange={setFromInput('status')}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn-gold">{editingId ? 'Salvar alterações' : 'Cadastrar membro'}</button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={cancelEdit}>Cancelar</button>
            )}
          </div>
          {err && <div className="error">{err}</div>}
        </form>
      </div>

      {birthdaysThisMonth.length > 0 && (
        <div className="card">
          <p className="eyebrow">🎂 Aniversariantes do mês</p>
          <div className="birthday-list" style={{ marginTop: 12 }}>
            {birthdaysThisMonth.map(m => (
              <div key={m.id} className="birthday-item">
                <span className="pill">{formatDate(m.birth_date).slice(0, 5)}</span>
                <span>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 20 }}>Membros</h2>
          <p className="muted" style={{ fontSize: 13 }}>{activeCount} ativos · {members.length} no total</p>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn-ghost btn-sm"
            onClick={() => setHideContacts(v => !v)}
            title={hideContacts ? 'Mostrar contatos' : 'Ocultar contatos'}
            aria-label={hideContacts ? 'Mostrar contatos' : 'Ocultar contatos'}>
            {hideContacts ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
          <input placeholder="Buscar por nome…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div className="empty">Carregando…</div>
          : filtered.length === 0
            ? <div className="empty">{members.length === 0 ? 'Nenhum membro cadastrado ainda.' : 'Nenhum membro encontrado.'}</div>
            : <table>
                <thead><tr><th>Nome</th><th>Telefone</th><th>Nascimento</th><th>Cargo</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>
                        {m.name}
                        {m.email && <div className="muted" style={{ fontSize: 12, fontWeight: 400 }}>{hideContacts ? maskEmailView(m.email) : m.email}</div>}
                      </td>
                      <td>{m.phone ? (hideContacts ? maskPhoneView(m.phone) : m.phone) : '—'}</td>
                      <td>{m.birth_date ? formatDate(m.birth_date) : '—'}</td>
                      <td className="muted">{m.church_role || '—'}</td>
                      <td><span className="pill">{m.status === 'ativo' ? 'Ativo' : 'Inativo'}</span></td>
                      <td style={{ width: 150 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn-ghost btn-sm" onClick={() => startEdit(m)}>Editar</button>
                          <button className="btn-danger btn-sm" onClick={() => setPendingDelete(m)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>}
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Excluir membro"
          message={`Excluir o cadastro de "${pendingDelete.name}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onConfirm={confirmRemove}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
