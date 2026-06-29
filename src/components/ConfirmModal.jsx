export default function ConfirmModal({ title, message, confirmLabel = 'Confirmar', onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>{title}</h3>
        <p className="muted" style={{ fontSize: 14 }}>{message}</p>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 22, gap: 8 }}>
          <button className="btn-ghost btn-sm" onClick={onCancel}>Cancelar</button>
          <button className="btn-danger btn-sm" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
