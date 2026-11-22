<div align="center">
  <img src="imgs/forja-systems.png" alt="Forja Systems" width="180" />
  <h1>Cardápio Digital · Projeto de Portfólio</h1>
  <p><strong>José Douglas Farias Rodrigues</strong> · Desenvolvedor</p>
  <p>Uma experiência web responsiva para apresentar catálogo, painel administrativo e sacola interativa.</p>
  <p>
    <a href="https://github.com/DouglasFariasRodigues">Meu perfil no GitHub</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/projeto-portf%C3%B3lio-ff6a00?style=for-the-badge" alt="Projeto de portfólio" />
    <img src="https://img.shields.io/badge/HTML-CSS-JavaScript-22252a?style=for-the-badge" alt="HTML, CSS e JavaScript" />
    <img src="https://img.shields.io/badge/Supabase-Netlify-3FCF8E?style=for-the-badge" alt="Supabase e Netlify" />
  </p>
</div>

---

## Sobre o projeto

Este projeto demonstra uma solução de cardápio digital para pequenos negócios. A interface organiza os produtos por categoria e permite explorar opções, quantidades e uma sacola de compras em dispositivos móveis e computadores.

Foi desenvolvido como projeto de portfólio para demonstrar habilidades de desenvolvimento front-end e integração com serviços web. O catálogo de exemplo usa produtos fictícios. A sacola e o checkout são simulados: **não há envio de pedidos, processamento de pagamentos nem coleta de dados pessoais**.

## Funcionalidades

- Catálogo responsivo com navegação por categorias.
- Produtos com opções, preços e imagens.
- Sacola interativa com quantidades e cálculo do total.
- Painel administrativo de demonstração para criar, editar e excluir produtos.
- Upload de imagens para Supabase Storage.
- API administrativa em Netlify Functions.
- Migração SQL, políticas de leitura com Row Level Security e dados demonstrativos.

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| Interface | HTML, CSS e JavaScript |
| Dados e imagens | Supabase, PostgREST e Supabase Storage |
| Funções administrativas | Netlify Functions e Node.js |
| Publicação | Netlify |

## Decisões de implementação

- A vitrine funciona sem credenciais, usando um catálogo fictício local.
- A configuração pública do Supabase começa vazia em `config.js`.
- A chave privilegiada do Supabase e as credenciais administrativas são lidas somente pelo backend, por variáveis privadas do Netlify.
- A migração libera leitura pública apenas dos produtos ativos; operações administrativas usam a função do servidor.
- O código da loja demonstrativa é independente e não inclui informações ou credenciais de clientes reais.

## Executar localmente

Com Python instalado, execute na pasta do projeto:

```powershell
python -m http.server 8000
```

Abra [http://localhost:8000](http://localhost:8000). O catálogo e a sacola de demonstração funcionam sem configurar banco de dados.

## Configurar uma demonstração completa

Use um projeto Supabase **separado para demonstração**:

1. Execute `supabase/migration.sql` no SQL Editor do projeto.
2. Preencha `config.js` com a URL do projeto e sua chave publishable/anon. Essa chave é pública; mantenha Row Level Security habilitada.
3. Configure estas variáveis no Netlify:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_SESSION_SECRET`
   - `ADMIN_USERNAME_1` e `ADMIN_PASSWORD_1`
   - opcionalmente, `ADMIN_USERNAME_2` e `ADMIN_PASSWORD_2`
4. Publique esta pasta no Netlify. A página do painel fica em `/edicao`.

**Nunca** coloque `service_role`, `sb_secret_`, senhas ou arquivos `.env` no navegador ou no Git. Veja [`SECURITY.md`](SECURITY.md).

## Estrutura

```text
├── index.html                  # Vitrine e apresentação do projeto
├── app.js                      # Catálogo, categorias e sacola
├── edicao.html                 # Painel administrativo de exemplo
├── edicao.js                   # Interações do painel
├── styles.css                  # Estrutura e componentes
├── forja-theme.css             # Identidade visual Forja Systems
├── netlify/functions/admin.js  # API administrativa
└── supabase/migration.sql      # Esquema, políticas e produtos fictícios
```

---

<div align="center">
  <strong>José Douglas Farias Rodrigues</strong><br />
  <a href="https://github.com/DouglasFariasRodigues">github.com/DouglasFariasRodigues</a>
</div>
