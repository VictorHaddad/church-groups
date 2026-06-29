# Gestão de Grupos da Igreja

App React + Vite + Supabase para administrar grupos, pessoas, presença e ranking.

## 1. Configurar credenciais
Edite o arquivo `.env` (já criado) com suas credenciais do Supabase:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

Encontre em: Supabase > Project Settings > API.

## 2. Criar as tabelas
Abra o **SQL Editor** no Supabase, cole o conteúdo de `supabase_schema.sql` e clique em **Run**.

## 3. Criar contas de admin (2 a 5)
Em **Authentication > Users > Add user**, ou pela tela "Criar conta" do próprio app.
Para impedir cadastros abertos depois, desative "Allow new sign-ups" em Authentication > Providers > Email.

## 4. Rodar
```
npm install
npm run dev
```

## Funcionalidades
- Login com e-mail e senha (Supabase Auth)
- Cadastro de grupos (nome, descrição, pontuação)
- Cadastro de pessoas vinculadas a grupos, com pontuação individual
- Marcação de presença por pessoa e data
- Ranking de grupos e de pessoas por pontuação

Edite pontos clicando no campo numérico e saindo dele (salva automaticamente).
