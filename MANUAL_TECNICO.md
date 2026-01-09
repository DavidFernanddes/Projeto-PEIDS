# Manual Técnico - CinePIS

## 1. Introdução

O CinePIS é uma aplicação web para gestão de filmes e séries desenvolvida no âmbito da UC de Programação e Integração de Serviços (CTeSP TPSI - 2025/2026). A aplicação utiliza uma arquitetura baseada em web services REST, permitindo aos utilizadores pesquisar, favoritar, criar listas personalizadas e fazer reviews de conteúdos cinematográficos.

## 2. Arquitetura do Sistema

### 2.1 Tecnologias Utilizadas

- **Backend:** Node.js v18+ com Express.js v5.2.1
- **Base de Dados:** MySQL 8.0+
- **Autenticação:** JWT (JSON Web Tokens)
- **APIs Externas:**
  - The Movie Database (TMDB) API - para dados de filmes e séries
  - Google OAuth 2.0 - para autenticação social
- **Frontend:** HTML5, CSS3 (Tailwind CSS), JavaScript (ES6+)

### 2.2 Estrutura do Projeto

```
Projeto-PEIDS/
├── app.js                    # Aplicação principal Express
├── package.json              # Dependências do projeto
├── database.sql              # Script de criação e preenchimento da BD
├── config/
│   └── db.js                # Configuração da conexão MySQL
├── controllers/
│   ├── actorsController.js   # Controlador de atores
│   ├── adminController.js    # Controlador administrativo
│   ├── contentController.js  # Controlador de conteúdos
│   ├── directorsController.js# Controlador de diretores
│   ├── favoritesController.js# Controlador de favoritos
│   ├── listsController.js    # Controlador de listas
│   └── reviewController.js   # Controlador de reviews
├── middleware/
│   └── auth.js              # Middleware de autenticação/autorização
├── routes/
│   ├── admin.js             # Rotas administrativas
│   ├── api.js               # Rotas da API REST
│   └── auth.js              # Rotas de autenticação
└── public/
    ├── pages/               # Páginas HTML (frontoffice/backoffice)
    ├── css/                 # Estilos globais
    ├── js/                  # Scripts JavaScript do cliente
    └── img/                 # Imagens estáticas
```

### 2.3 Arquitetura em Camadas

```
┌─────────────────────────────────────┐
│        Frontend (HTML/CSS/JS)       │
│  Frontoffice & Backoffice Pages     │
└──────────────┬──────────────────────┘
               │ HTTP/REST (JSON)
┌──────────────▼──────────────────────┐
│      Express.js Server (app.js)     │
│  ┌──────────────────────────────┐   │
│  │     Routes Layer             │   │
│  │  /api, /auth, /api/admin     │   │
│  └──────────┬───────────────────┘   │
│  ┌──────────▼───────────────────┐   │
│  │  Middleware (auth.js)        │   │
│  │  - isAuthenticated           │   │
│  │  - isAdmin                   │   │
│  └──────────┬───────────────────┘   │
│  ┌──────────▼───────────────────┐   │
│  │  Controllers Layer           │   │
│  │  - Business Logic            │   │
│  └──────────┬───────────────────┘   │
└──────────────┼──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼──────┐      ┌───────▼───────┐
│  MySQL   │      │  External     │
│ Database │      │  APIs         │
│          │      │  (TMDB/Google)│
└──────────┘      └───────────────┘
```

## 3. Base de Dados

### 3.1 Modelo de Dados

A base de dados `cine_pis_db` utiliza o charset `utf8mb4` e collation `utf8mb4_unicode_ci` para suportar caracteres especiais.

#### 3.1.1 Tabelas Principais

**users**
- `id` (INT, PK, AUTO_INCREMENT)
- `name` (VARCHAR(255))
- `email` (VARCHAR(255), UNIQUE)
- `password` (VARCHAR(255)) - hash bcrypt
- `role` (ENUM: 'user', 'admin')
- `google_id` (VARCHAR(255), NULLABLE, UNIQUE) - para OAuth
- `created_at`, `updated_at` (TIMESTAMP)

**contents** (Filmes/Séries)
- `id` (INT, PK)
- `tmdb_id` (INT, NULLABLE) - ID no TMDB
- `title` (VARCHAR(500))
- `synopsis` (TEXT)
- `type` (ENUM: 'movie', 'series')
- `release_date` (DATE)
- `duration` (INT) - minutos (filmes) ou episódios (séries)
- `poster_path`, `backdrop_path` (VARCHAR(500))
- `trailer_url` (VARCHAR(500))
- `vote_average` (DECIMAL(3,1))
- `created_at`, `updated_at` (TIMESTAMP)

**genres**
- `id` (INT, PK)
- `name` (VARCHAR(100), UNIQUE)

**actors**
- `id` (INT, PK)
- `name` (VARCHAR(255))
- `tmdb_id` (INT, NULLABLE, UNIQUE)
- `profile_path` (VARCHAR(500))
- `biography` (TEXT)
- `birth_date` (DATE)

**directors**
- `id` (INT, PK)
- `name` (VARCHAR(255))
- `tmdb_id` (INT, NULLABLE, UNIQUE)
- `profile_path` (VARCHAR(500))
- `biography` (TEXT)
- `birth_date` (DATE)

**reviews**
- `id` (INT, PK)
- `user_id` (INT, FK → users)
- `content_id` (INT, FK → contents)
- `rating` (INT, CHECK 1-10)
- `comment` (TEXT)
- `review_date` (TIMESTAMP)
- `utility_counter` (INT, DEFAULT 0)
- UNIQUE (user_id, content_id) - um utilizador só pode fazer uma review por conteúdo

**review_votes**
- `id` (INT, PK)
- `user_id` (INT, FK → users)
- `review_id` (INT, FK → reviews)
- `created_at` (TIMESTAMP)
- UNIQUE (user_id, review_id)

**favorites**
- `id` (INT, PK)
- `user_id` (INT, FK → users)
- `content_id` (INT, FK → contents)
- `created_at` (TIMESTAMP)
- UNIQUE (user_id, content_id)

**personal_lists**
- `id` (INT, PK)
- `user_id` (INT, FK → users)
- `name` (VARCHAR(255))
- `description` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

**list_items**
- `id` (INT, PK)
- `list_id` (INT, FK → personal_lists)
- `content_id` (INT, FK → contents)
- `added_at` (TIMESTAMP)
- UNIQUE (list_id, content_id)

**Tabelas de Relação:**
- `content_genres` - Relação muitos-para-muitos (contents ↔ genres)
- `content_actors` - Relação muitos-para-muitos (contents ↔ actors) + `character_name`
- `content_directors` - Relação muitos-para-muitos (contents ↔ directors)

### 3.2 Índices e Constraints

- Índices em `contents.type` para filtros rápidos
- Índices em `reviews.content_id`, `reviews.user_id`, `reviews.review_date`
- Foreign keys com `ON DELETE CASCADE` para integridade referencial
- Constraints UNIQUE para evitar duplicados (favoritos, reviews, list items)

## 4. Web Services REST

### 4.1 Serviços Elementares

Serviços que realizam operações básicas de manipulação de dados na base de dados:

#### Autenticação (`/auth`)
- `POST /auth/register` - Registo de utilizador
- `POST /auth/login` - Login tradicional (email/password)
- `POST /auth/google` - Login com Google OAuth
- `GET /auth/me` - Verificar token e obter dados do utilizador
- `GET /auth/google/client-id` - Obter Client ID do Google

#### Conteúdos (`/api`)
- `GET /api/filmes` - Listar todos os conteúdos
- `GET /api/filmes/:id` - Obter detalhes de um conteúdo
- `GET /api/genres` - Listar géneros do catálogo

#### Favoritos (`/api/favorites`)
- `GET /api/favorites` - Listar favoritos do utilizador autenticado
- `GET /api/favorites/check/:id` - Verificar se conteúdo é favorito
- `POST /api/favorites/toggle` - Adicionar/remover favorito

#### Listas (`/api/lists`)
- `GET /api/lists` - Listar listas do utilizador
- `GET /api/lists/:id` - Obter detalhes de uma lista
- `POST /api/lists` - Criar nova lista
- `PUT /api/lists/:id` - Atualizar lista
- `DELETE /api/lists/:id` - Apagar lista
- `POST /api/lists/:id/items` - Adicionar item à lista
- `DELETE /api/lists/:id/items/:contentId` - Remover item da lista

#### Reviews (`/api/reviews`)
- `POST /api/reviews` - Criar review (requer autenticação)
- `POST /api/reviews/:reviewId/vote` - Votar na utilidade de uma review

#### Administração (`/api/admin`)
- `GET /api/admin/contents` - Listar conteúdos (admin)
- `POST /api/admin/contents` - Criar conteúdo manualmente (admin)
- `DELETE /api/admin/contents/:id` - Apagar conteúdo (admin)
- `GET /api/admin/users` - Listar utilizadores (admin)
- `DELETE /api/admin/users/:id` - Apagar utilizador (admin)
- `PUT /api/admin/users/:id/role` - Atualizar role do utilizador (admin)
- `GET /api/admin/reviews` - Listar todas as reviews (admin)
- `DELETE /api/admin/reviews/:id` - Apagar review (admin)

### 4.2 Serviços Compostos

Serviços que combinam múltiplas operações e/ou utilizam serviços externos:

#### `GET /api/filmes/:id`
**Descrição:** Obtém detalhes completos de um filme/série, combinando:
- Dados da base de dados (título, sinopse, géneros, elenco, diretores)
- Dados da API TMDB (trailer, conteúdo similar, recomendações)
- Reviews dos utilizadores com contagem de votos de utilidade

**Fluxo:**
1. Buscar conteúdo na BD pelo ID
2. Se tiver `tmdb_id`, fazer múltiplas chamadas à TMDB:
   - `/videos` para obter trailer
   - `/similar` para conteúdos similares
   - `/recommendations` para recomendações
3. Buscar reviews associadas com contagem de votos
4. Combinar e retornar dados consolidados

#### `GET /api/pesquisar?query=...`
**Descrição:** Pesquisa na API TMDB e retorna resultados formatados.

**Fluxo:**
1. Chamar TMDB `/search/multi`
2. Filtrar apenas filmes e séries
3. Formatar dados (posters, tipos, etc.)
4. Retornar resultados

#### `POST /api/import-content`
**Descrição:** Importa conteúdo completo da TMDB para a base de dados.

**Fluxo:**
1. Buscar detalhes do conteúdo na TMDB (`/movie/:id` ou `/tv/:id`)
2. Buscar trailer (`/videos`)
3. Buscar créditos (`/credits`) para obter elenco e diretores
4. Verificar/inserir géneros na BD
5. Verificar/inserir atores na BD
6. Verificar/inserir diretores na BD
7. Inserir conteúdo na BD
8. Criar relações (content_genres, content_actors, content_directors)

#### `GET /api/importar`
**Descrição:** Importa múltiplos conteúdos populares da TMDB (batch import).

**Fluxo:**
1. Para cada página solicitada:
   - Buscar `/movie/popular` e `/tv/popular`
   - Opcionalmente `/movie/top_rated` e `/tv/top_rated`
2. Para cada resultado, chamar `importSingleContent()`
3. Retornar contagem de conteúdos importados

#### `GET /api/filmes/tmdb/:tmdb_id`
**Descrição:** Busca conteúdo por TMDB ID. Se não existir na BD, importa automaticamente.

**Fluxo:**
1. Verificar se existe na BD
2. Se não existir:
   - Tentar identificar tipo (movie ou tv)
   - Chamar `importSingleContent()`
3. Retornar dados da BD

### 4.3 Formato de Resposta

Todos os endpoints retornam JSON:

**Sucesso:**
```json
{
  "message": "Operação realizada com sucesso",
  "data": {...}
}
```

**Erro:**
```json
{
  "error": "Mensagem de erro descritiva"
}
```

**Status HTTP:**
- `200` - Sucesso
- `201` - Criado
- `400` - Erro de validação
- `401` - Não autenticado
- `403` - Sem permissão (não é admin)
- `404` - Não encontrado
- `500` - Erro interno do servidor

### 4.4 Autenticação

A autenticação utiliza JWT (JSON Web Tokens). O token deve ser enviado no header:
```
Authorization: Bearer <token>
```

O middleware `isAuthenticated` valida o token e adiciona `req.user` com `{id, name, role}`.

O middleware `isAdmin` verifica se `req.user.role === 'admin'`.

## 5. Integração com APIs Externas

### 5.1 The Movie Database (TMDB)

**Base URL:** `https://api.themoviedb.org/3`

**Endpoints Utilizados:**
- `GET /search/multi` - Pesquisa geral
- `GET /movie/{id}` - Detalhes de filme
- `GET /tv/{id}` - Detalhes de série
- `GET /movie/popular`, `/tv/popular` - Conteúdos populares
- `GET /movie/top_rated`, `/tv/top_rated` - Melhores classificados
- `GET /movie/{id}/videos`, `/tv/{id}/videos` - Trailers
- `GET /movie/{id}/credits`, `/tv/{id}/credits` - Elenco e diretores
- `GET /movie/{id}/similar`, `/tv/{id}/similar` - Conteúdos similares
- `GET /movie/{id}/recommendations`, `/tv/{id}/recommendations` - Recomendações
- `GET /person/{id}` - Detalhes de pessoa (ator/diretor)

**Configuração:**
- API Key armazenada em `process.env.TMDB_API_KEY`
- Idioma padrão: `pt-PT`

**Tratamento de Erros:**
- Fallback para inglês se dados em português não disponíveis
- Retorno de dados padrão se API falhar

### 5.2 Google OAuth 2.0

**Biblioteca:** `google-auth-library`

**Fluxo:**
1. Cliente obtém Client ID do servidor (`GET /auth/google/client-id`)
2. Cliente inicializa Google Sign-In SDK
3. Utilizador faz login no Google
4. Cliente envia ID token para servidor (`POST /auth/google`)
5. Servidor valida token com Google
6. Servidor cria/utiliza conta e retorna JWT

**Configuração:**
- Client ID armazenado em `process.env.GOOGLE_CLIENT_ID`
- Configurar em [Google Cloud Console](https://console.cloud.google.com/)

## 6. Segurança

### 6.1 Autenticação e Autorização
- Passwords hasheadas com bcrypt (10 rounds)
- JWT com expiração de 24 horas
- Verificação de role para endpoints administrativos
- Validação de token em todas as rotas protegidas

### 6.2 Proteção de Dados
- SQL injection prevenido com prepared statements (mysql2)
- Validação de inputs nos controllers
- CORS configurado (permitir múltiplas origens)

### 6.3 Boas Práticas
- Variáveis sensíveis em `.env` (não versionadas)
- Middleware de autenticação reutilizável
- Validação de permissões antes de operações sensíveis

## 7. Configuração e Instalação

### 7.1 Pré-requisitos
- Node.js v18+
- MySQL 8.0+
- NPM ou Yarn

### 7.2 Instalação

1. **Clonar repositório:**
```bash
git clone <url-do-repositorio>
cd Projeto-PEIDS
```

2. **Instalar dependências:**
```bash
npm install
```

3. **Configurar variáveis de ambiente:**
Criar ficheiro `.env` na raiz:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_password
DB_NAME=cine_pis_db
JWT_SECRET=sua_chave_secreta_aqui
TMDB_API_KEY=sua_api_key_tmdb
GOOGLE_CLIENT_ID=seu_google_client_id
PORT=3000
```

**Gerar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. **Criar base de dados:**
```bash
mysql -u root -p < database.sql
```

5. **Iniciar servidor:**
```bash
npm start
# ou para desenvolvimento com auto-reload:
npm run dev
```

Servidor estará disponível em `http://localhost:3000`

### 7.3 Credenciais Iniciais

Após executar `database.sql`, existe um utilizador administrador:
- **Email:** `admin@cinepis.pt`
- **Password:** `admin123`

**⚠️ IMPORTANTE:** Alterar a password após primeiro acesso em produção.

## 8. Testes e Validação

### 8.1 Testes Manuais Recomendados

1. **Autenticação:**
   - Registo de novo utilizador
   - Login tradicional
   - Login com Google OAuth
   - Verificação de token

2. **Conteúdos:**
   - Listar conteúdos
   - Ver detalhes de um conteúdo
   - Pesquisar na TMDB
   - Importar conteúdo individual
   - Importação batch

3. **Favoritos:**
   - Adicionar favorito
   - Remover favorito
   - Listar favoritos

4. **Listas:**
   - Criar lista
   - Adicionar/remover itens
   - Listar listas
   - Apagar lista

5. **Reviews:**
   - Criar review
   - Votar na utilidade
   - Ver reviews de um conteúdo

6. **Backoffice:**
   - Acesso restrito a admins
   - Criar conteúdo manualmente
   - Gerir utilizadores
   - Gerir reviews

### 8.2 Endpoints de Teste

- `GET /api/status` - Verificar se API está online

## 9. Troubleshooting

### 9.1 Erro de Conexão à Base de Dados
- Verificar credenciais no `.env`
- Verificar se MySQL está a correr
- Verificar se base de dados foi criada

### 9.2 Erro "Falta API KEY"
- Verificar se `TMDB_API_KEY` está no `.env`
- Obter API key em [TMDB Settings](https://www.themoviedb.org/settings/api)

### 9.3 Erro "Token inválido"
- Verificar se `JWT_SECRET` está configurado
- Verificar expiração do token (24h)

### 9.4 Login Google não funciona
- Verificar `GOOGLE_CLIENT_ID` no `.env`
- Verificar configuração no Google Cloud Console
- Verificar se origem autorizada inclui `http://localhost:3000`

## 10. Manutenção e Extensões Futuras

### 10.1 Possíveis Melhorias
- Implementar cache (Redis) para dados da TMDB
- Adicionar rate limiting nos endpoints
- Implementar testes automatizados (Jest)
- Adicionar logging estruturado (Winston)
- Implementar paginação em listagens
- Adicionar filtros avançados (género, ano, rating)

### 10.2 Backup da Base de Dados
Recomendado realizar backups regulares:
```bash
mysqldump -u root -p cine_pis_db > backup_$(date +%Y%m%d).sql
```

---

**Versão:** 1.0  
**Data:** Janeiro 2026  
**Autores:**  
- David Fernandes  
- João Rôlo  
- Sorin Revenco
