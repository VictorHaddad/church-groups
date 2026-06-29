export default function Ranking({ people, groups }) {
  const groupName = id => groups.find(g => g.id === id)?.name || '—'
  const rankedGroups = [...groups].sort((a, b) => b.points - a.points)
  const rankedPeople = [...people].sort((a, b) => b.points - a.points)
  const medal = i => i + 1

  return (
    <div>
      <div className="section-head"><h2 style={{ fontSize: 20 }}>Ranking de grupos</h2></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 28 }}>
        {rankedGroups.length === 0
          ? <div className="empty">Sem grupos.</div>
          : <table><tbody>
              {rankedGroups.map((g, i) => (
                <tr key={g.id} className={i === 0 ? 'rank-1' : ''}>
                  <td className="rank-num">{medal(i)}</td>
                  <td style={{ fontWeight: 600 }}>{g.name}{i === 0 ? ' 🏆' : ''}<div className="muted" style={{ fontSize: 12, fontWeight: 400 }}>{g.description}</div></td>
                  <td style={{ textAlign: 'right' }}><span className="pill">{g.points} pts</span></td>
                </tr>
              ))}
            </tbody></table>}
      </div>

      <div className="section-head"><h2 style={{ fontSize: 20 }}>Ranking de pessoas</h2></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {rankedPeople.length === 0
          ? <div className="empty">Sem pessoas.</div>
          : <table><tbody>
              {rankedPeople.map((p, i) => (
                <tr key={p.id} className={i === 0 ? 'rank-1' : ''}>
                  <td className="rank-num">{medal(i)}</td>
                  <td style={{ fontWeight: 600 }}>{p.name}<div className="muted" style={{ fontSize: 12, fontWeight: 400 }}>{groupName(p.group_id)}</div></td>
                  <td style={{ textAlign: 'right' }}><span className="pill">{p.points} pts</span></td>
                </tr>
              ))}
            </tbody></table>}
      </div>
    </div>
  )
}
