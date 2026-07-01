import { useState } from 'react'

export default function PrivacyNotice() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="link" onClick={() => setOpen(true)}>
        Aviso de Privacidade
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-card privacy-modal" onClick={e => e.stopPropagation()}>
            <div className="spread" style={{ marginBottom: 6 }}>
              <h3 style={{ fontSize: 20 }}>Aviso de Privacidade</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar"
                style={{ background: 'none', padding: 0, color: 'inherit', display: 'flex' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="privacy-content">
              <p className="muted" style={{ fontSize: 12 }}>Última atualização: 01/07/2026</p>
              <p>
                A <strong>IEP Jesus o Pão da Vida</strong> ("Igreja") valoriza a privacidade dos seus
                membros e frequentadores e trata os dados pessoais de acordo com a Lei nº 13.709/2018 (LGPD).
              </p>

              <h4>1. Quais dados coletamos</h4>
              <p>
                Nome, telefone/WhatsApp, e-mail, data de nascimento, estado civil, data de batismo,
                cargo/função e situação de membresia; registros de presença e participação na EBD;
                e informações de ofertas e dízimos para controle financeiro interno.
              </p>

              <h4>2. Para que usamos</h4>
              <p>
                Exclusivamente para a organização e o pastoreio da Igreja: gestão de membros,
                acompanhamento da Escola Bíblica Dominical e controle financeiro das contribuições.
                <strong> Não vendemos nem compartilhamos</strong> esses dados com terceiros.
              </p>

              <h4>3. Base legal</h4>
              <p>
                O tratamento de dados de membros por organização religiosa está amparado no
                <strong> art. 11, §1º</strong> da LGPD, que dispensa o consentimento para dados de seus
                membros, desde que não haja compartilhamento com terceiros. Demais tratamentos se apoiam
                no legítimo interesse e no cumprimento de obrigações da Igreja.
              </p>

              <h4>4. Dados de crianças e adolescentes</h4>
              <p>
                Dados de menores (inclusive na EBD) são tratados no melhor interesse deles e com o
                consentimento dos pais ou responsáveis, conforme o art. 14 da LGPD.
              </p>

              <h4>5. Divulgação pública</h4>
              <p>
                As páginas públicas da Igreja exibem apenas rankings <strong>por grupo</strong>, sem nomes individuais.
              </p>

              <h4>6. Seus direitos</h4>
              <p>
                Você pode solicitar a qualquer momento: confirmação e acesso aos seus dados, correção,
                exclusão, ou informação sobre com quem foram compartilhados. Basta escrever para o contato abaixo.
              </p>

              <h4>7. Segurança e retenção</h4>
              <p>
                Adotamos controles de acesso por perfil e mantemos os dados apenas enquanto necessários
                à finalidade. Registros financeiros podem ser mantidos por prazo maior para fins contábeis.
              </p>

              <h4>8. Contato do responsável</h4>
              <p>
                Encarregado de dados: <strong>abinaelfinanceiroiepjpv@gmail.com</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
