# Gestão de Grupos da Igreja

App da EBD (Escola Bíblica Dominical) para acompanhar grupos, pessoas e pontuação, com duas áreas:

- **Página pública** (`/`): ranking de grupos e de pessoas, sem necessidade de login.
- **Área de líderes** (`/admin`): painel de gestão, com login restrito.

## Área de líderes

- Cadastro e edição de grupos (nome, descrição) e de pessoas vinculadas a um grupo
- Chamada de presença por data, com marcação de presente/ausente, bíblia, revista e visitantes trazidos
- Histórico de presenças, com filtros por pessoa e por dia
- Lançamento de pontos de pergunta por grupo, com histórico editável
- Aba de pontuação detalhando, por grupo, quanto cada categoria contribuiu para o total

## Pontuação

A pontuação dos grupos é calculada automaticamente a partir das ações registradas na área de líderes:

| Ação | Pontos |
|---|---|
| Presença | +10 |
| Ausência | -10 |
| Bíblia levada | +1 |
| Revista levada | +1 |
| Visitante trazido | +100 |
| Pergunta acertada | lançado manualmente |

## Stack

React + Vite no front-end, Supabase (Postgres + Auth) no back-end. Publicado no GitHub Pages via GitHub Actions.
