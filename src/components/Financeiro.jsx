import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import DateField, { formatDate } from './DateField'
import ConfirmModal from './ConfirmModal'

const SERVICE_TYPES = ['Culto de domingo', 'Culto de quarta', 'Eventos especiais']
const CATEGORIES = ['Oferta', 'Dízimo']

// Data local (horário de Brasília), não UTC — evita virar o dia/mês à noite.
function localDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function currentMonth() {
  return localDate().slice(0, 7) // YYYY-MM
}

function monthRange(ym) {
  const [y, m] = ym.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return { first: `${ym}-01`, last: `${ym}-${String(lastDay).padStart(2, '0')}` }
}

function formatBRL(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Máscara de moeda: os dígitos preenchem como centavos (digita 123456 → 1.234,56).
function formatCents(cents) {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function maskMoney(input) {
  const digits = String(input).replace(/\D/g, '')
  return digits ? formatCents(Number(digits)) : ''
}

function numberToMask(n) {
  if (n === null || n === undefined || n === '') return ''
  return formatCents(Math.round(Number(n) * 100))
}

function maskToNumber(masked) {
  const digits = String(masked).replace(/\D/g, '')
  return digits ? Number(digits) / 100 : 0
}

export default function Financeiro() {
  const today = localDate()
  const [month, setMonth] = useState(currentMonth())
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [offerings, setOfferings] = useState([])
  const [loading, setLoading] = useState(true)

  const [date, setDate] = useState(today)
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0])
  const [category, setCategory] = useState(CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [err, setErr] = useState('')

  const [pendingDelete, setPendingDelete] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editServiceType, setEditServiceType] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { first, last } = monthRange(month)
    const { data } = await supabase.from('offerings')
      .select('id, date, service_type, category, amount, notes')
      .gte('date', first).lte('date', last)
      .order('date', { ascending: false })
    setOfferings(data || [])
    setLoading(false)
  }, [month])

  useEffect(() => { load() }, [load])

  const filtered = categoryFilter ? offerings.filter(o => o.category === categoryFilter) : offerings
  const total = filtered.reduce((s, o) => s + Number(o.amount), 0)

  function toggleFilter(cat) {
    setCategoryFilter(c => c === cat ? null : cat)
  }

  async function add(e) {
    e.preventDefault()
    setErr('')
    const value = maskToNumber(amount)
    if (!value || value <= 0) return setErr('Informe um valor válido.')
    const { error } = await supabase.from('offerings').insert({
      date, service_type: serviceType, category, amount: value, notes: notes || null,
    })
    if (error) return setErr(error.message)
    setAmount(''); setNotes('')
    load()
  }

  async function confirmRemove() {
    if (!pendingDelete) return
    await supabase.from('offerings').delete().eq('id', pendingDelete.id)
    setOfferings(o => o.filter(r => r.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  function startEdit(o) {
    setEditingId(o.id)
    setEditDate(o.date)
    setEditServiceType(o.service_type)
    setEditCategory(o.category)
    setEditAmount(numberToMask(o.amount))
    setEditNotes(o.notes || '')
  }

  async function saveEdit(id) {
    const value = maskToNumber(editAmount)
    if (!value || value <= 0) return
    const { error } = await supabase.from('offerings').update({
      date: editDate, service_type: editServiceType, category: editCategory,
      amount: value, notes: editNotes || null, updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (!error) { setEditingId(null); load() }
  }

  function exportCSV() {
    const headers = ['Data', 'Tipo de culto', 'Categoria', 'Valor', 'Observação']
    const rows = filtered.map(o => [
      formatDate(o.date),
      o.service_type,
      o.category,
      Number(o.amount).toFixed(2).replace('.', ','),
      o.notes || '',
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ofertas-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="card">
        <p className="eyebrow">Novo registro</p>
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>Registrar oferta</h2>
        <form onSubmit={add}>
          <div className="grid" style={{ alignItems: 'end' }}>
            <div><label>Data</label><DateField value={date} onChange={setDate} /></div>
            <div>
              <label>Tipo de culto</label>
              <select value={serviceType} onChange={e => setServiceType(e.target.value)}>
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label>Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Valor (R$)</label>
              <input type="text" inputMode="numeric" placeholder="0,00"
                value={amount} onChange={e => setAmount(maskMoney(e.target.value))} required />
            </div>
            <div><label>Observação</label><input value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <button className="btn-gold" style={{ marginTop: 16 }}>Registrar oferta</button>
          {err && <div className="error">{err}</div>}
        </form>
      </div>

      <div className="section-head">
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 20 }}>Ofertas do mês</h2>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className={`tab ${categoryFilter === 'Oferta' ? 'active' : ''}`}
              onClick={() => toggleFilter('Oferta')}>Ofertas</button>
            <button type="button" className={`tab ${categoryFilter === 'Dízimo' ? 'active' : ''}`}
              onClick={() => toggleFilter('Dízimo')}>Dízimos</button>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ width: 'auto' }} />
          <button className="btn-ghost btn-sm" onClick={exportCSV} disabled={!filtered.length}>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading
          ? <div className="empty">Carregando…</div>
          : filtered.length === 0
            ? <div className="empty">Nenhum registro neste mês.</div>
            : <table>
                <thead><tr><th>Data</th><th>Tipo de culto</th><th>Categoria</th><th>Valor</th><th>Observação</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(o => editingId === o.id ? (
                    <tr key={o.id}>
                      <td><DateField value={editDate} onChange={setEditDate} /></td>
                      <td>
                        <select value={editServiceType} onChange={e => setEditServiceType(e.target.value)}>
                          {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td>
                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td><input className="score-edit" type="text" inputMode="numeric"
                        value={editAmount} onChange={e => setEditAmount(maskMoney(e.target.value))} /></td>
                      <td><input value={editNotes} onChange={e => setEditNotes(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(o.id)} /></td>
                      <td style={{ width: 150 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn-gold btn-sm" onClick={() => saveEdit(o.id)}>Salvar</button>
                          <button className="btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>{formatDate(o.date)}</td>
                      <td>{o.service_type}</td>
                      <td><span className="pill">{o.category}</span></td>
                      <td style={{ fontWeight: 600 }}>{formatBRL(o.amount)}</td>
                      <td className="muted">{o.notes || '—'}</td>
                      <td style={{ width: 150 }}>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn-ghost btn-sm" onClick={() => startEdit(o)}>Editar</button>
                          <button className="btn-danger btn-sm" onClick={() => setPendingDelete(o)}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="day-divider">
                    <td colSpan={3} style={{ fontWeight: 600 }}>Total do mês</td>
                    <td style={{ fontWeight: 700 }}>{formatBRL(total)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>}
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Excluir oferta"
          message={`Excluir a oferta de ${formatBRL(pendingDelete.amount)} de ${formatDate(pendingDelete.date)}?`}
          confirmLabel="Excluir"
          onConfirm={confirmRemove}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
