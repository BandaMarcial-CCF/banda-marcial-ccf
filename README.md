# App — Banda Marcial do Colégio Coração Feliz (Tubarão/SC)

App web responsivo (HTML, CSS e JavaScript puro) com backend no **Supabase** (login Google/e-mail, banco de dados e armazenamento de fotos e vídeos). Hospedagem gratuita no **GitHub Pages**.

## Estrutura
```
index.html            página principal
css/style.css         estilos (vermelho e preto)
js/app.js             páginas, formulários e aba Admin
js/backend.js         conexão com o Supabase (login, banco, upload)
js/config.js          URL e chave pública do seu projeto  <-- você preenche
assets/logo.png       logo da banda (fundo transparente)
supabase/schema.sql   tabelas e regras de segurança (RLS)
```

## Passo a passo
1. **Criar o projeto**: em supabase.com crie uma conta e um projeto novo.
2. **Banco e segurança**: em *SQL Editor* → *New query*, cole todo o `supabase/schema.sql` e clique em *Run*.
3. **Login com Google**:
   - No Google Cloud Console crie um *OAuth Client ID* (tipo Web). Em "URIs de redirecionamento" coloque `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
   - No Supabase: *Authentication → Providers → Google*, ative e cole o Client ID e o Client Secret.
4. **URLs permitidas**: *Authentication → URL Configuration*. Em *Site URL* e em *Redirect URLs* coloque o endereço do site (ex.: `https://SEUUSUARIO.github.io/NOME-DO-REPO/`).
5. **E-mail**: deixe *Confirm email* ligado e **não** ative login por senha. O envio de e-mails padrão do Supabase é limitado a poucos por hora; para uso real configure um SMTP próprio em *Authentication → SMTP*.
6. **Chaves**: em *Project Settings → API* copie a **Project URL** e a chave **anon public** para `js/config.js`. Nunca use a `service_role` no código.
7. **Publicar**: suba os arquivos no GitHub e ative *Settings → Pages* (branch `main`, pasta `/root`).
8. **Primeiro acesso**: abra o site, entre com `igortb.zimba@gmail.com` e a aba **Admin** aparece.

## Segurança (validada no servidor)
- O administrador é quem entra com o e-mail `igortb.zimba@gmail.com`, conferido pela regra de segurança (RLS) no banco. Esconder a aba no navegador é só visual.
- Visitantes leem apenas conteúdo oficial (apresentações, avisos, FAQ, galeria e páginas).
- Perguntas e inscrições: cada usuário lê e escreve só na própria caixa. Só o administrador lê todas, responde e lê os registros.
- Respostas oficiais, conteúdo e logs só podem ser escritos pelo administrador.
- Fotos e vídeos: leitura pública, envio e exclusão só do administrador.
- Troque o e-mail do administrador também nas regras do `schema.sql` e em `js/config.js`.

## Observações
- Projetos gratuitos do Supabase pausam após cerca de 7 dias sem uso; basta reativar no painel.
- Vídeos grandes podem passar do limite de arquivo do plano gratuito (50 MB).
- Publique fotos de menores apenas com autorização dos responsáveis.

## Teste local
`python3 -m http.server` na pasta do projeto e abra `http://localhost:8000`. Adicione essa URL em *Redirect URLs* para testar o login.
