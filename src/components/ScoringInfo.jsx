const RULES = [
  { label: 'Presença', value: '+10', desc: 'Cada pessoa marcada como presente soma 10 pontos para o seu grupo.' },
  { label: 'Ausência', value: '-10', desc: 'Cada pessoa marcada como ausente tira 10 pontos do seu grupo.' },
  { label: 'Bíblia', value: '+1', desc: 'Cada pessoa que leva a bíblia soma 1 ponto para o seu grupo.' },
  { label: 'Revista', value: '+1', desc: 'Cada pessoa que leva a revistinha soma 1 ponto para o seu grupo.' },
  { label: 'Visitante', value: '+100', desc: 'Cada visitante trazido por uma pessoa soma 100 pontos para o seu grupo.' },
  { label: 'Pergunta', value: 'variável', desc: 'Pontos lançados manualmente quando o grupo acerta uma pergunta.' },
]

export default function ScoringInfo({ groups, breakdown }) {
  const b = id => breakdown[id] || { presence: 0, absence: 0, bible: 0, booklet: 0, visitors: 0, quiz: 0 }

  return (
    <div>
      <div className="section-head"><h2 style={{ fontSize: 20 }}>Como a pontuação funciona</h2></div>
      <div className="grid" style={{ marginBottom: 28 }}>
        {RULES.map(r => (
          <div className="card" key={r.label}>
            <div className="spread">
              <strong>{r.label}</strong>
              <span className="pill">{r.value}</span>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="section-head"><h2 style={{ fontSize: 20 }}>Pontuação por grupo, detalhada</h2></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {groups.length === 0
          ? <div className="empty">Sem grupos.</div>
          : <table>
              <thead>
                <tr>
                  <th>Grupo</th><th>Presença</th><th>Ausência</th><th>Bíblia</th><th>Revista</th><th>Visitantes</th><th>Perguntas</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => {
                  const d = b(g.id)
                  return (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 600 }}>{g.name}</td>
                      <td>{d.presence}</td>
                      <td>{d.absence}</td>
                      <td>{d.bible}</td>
                      <td>{d.booklet}</td>
                      <td>{d.visitors}</td>
                      <td>{d.quiz}</td>
                      <td><span className="pill">{g.points} pts</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>}
      </div>
    </div>
  )
}
