# CinePIS - Gestão de Filmes e Séries

Projeto de Integração de Serviços - CTeSP TPSI - 2025/2026

## Descrição

Aplicação web para gestão de filmes e séries com arquitetura baseada em web services REST. A aplicação permite aos utilizadores pesquisar, favoritar, criar listas personalizadas e fazer reviews de conteúdos cinematográficos.

## Funcionalidades

### Frontoffice
- ✅ Autenticação de utilizadores (login tradicional e Google OAuth)
- ✅ Pesquisa de filmes/séries usando API TMDB
- ✅ Visualização de detalhes (poster, sinopse, elenco, diretores, géneros)
- ✅ Sistema de favoritos
- ✅ Criação e gestão de listas personalizadas
- ✅ Sistema completo de reviews com votação de utilidade
- ✅ Dashboard do utilizador

### Backoffice
- ✅ Gestão de conteúdos (criar, listar, apagar)
- ✅ Importação de conteúdos da API TMDB (filmes e séries)
- ✅ Acesso restrito a administradores

## Tecnologias

- **Backend**: Node.js com Express.js
- **Base de Dados**: MySQL
- **Autenticação**: JWT (JSON Web Tokens)
- **API Externa**: The Movie Database (TMDB)
- **OAuth**: Google Sign-In

## Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd nome-do-repositorio
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar Base de Dados

Criar um ficheiro `.env` na raiz do projeto com as seguintes variáveis:

```env
# Configuração da Base de Dados MySQL
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_password
DB_NAME=cine_pis_db

# JWT Secret (gerar uma string aleatória segura)
JWT_SECRET=sua_chave_secreta_jwt_aqui

# API Key do TMDB (obter em https://developer.themoviedb.org/)
TMDB_API_KEY=sua_api_key_tmdb

# Google OAuth (obter em https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=seu_google_client_id

# Porta do servidor
PORT=3000
```

### 4. Criar Base de Dados

Executar o script SQL:

```bash
mysql -u root -p < database.sql
```

Ou importar manualmente o ficheiro `database.sql` no MySQL.

### 5. Credenciais de Acesso

Após executar o script SQL, está disponível um utilizador administrador:

**Utilizador Admin:**
- **Email:** `admin@cinepis.pt`
- **Password:** `admin123`
- **Role:** `admin` (acesso ao backoffice)

**Nota:** Recomenda-se alterar a password após o primeiro acesso por questões de segurança.

### 5. Iniciar o servidor

```bash
npm start
```

Ou com nodemon (desenvolvimento):

```bash
npx nodemon app.js
```

O servidor estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
blh/
├── config/
│   └── db.js                 # Configuração da base de dados
├── controllers/
│   ├── actorsController.js   # Gestão de atores
│   ├── adminController.js     # Gestão administrativa
│   ├── contentController.js   # Gestão de conteúdos
│   ├── directorsController.js # Gestão de diretores
│   ├── favoritesController.js # Gestão de favoritos
│   ├── listsController.js     # Gestão de listas personalizadas
│   └── reviewController.js    # Gestão de reviews
├── middleware/
│   └── auth.js               # Middleware de autenticação
├── public/
│   ├── css/
│   │   └── global.css        # Estilos globais
│   ├── pages/
│   │   ├── auth/             # Páginas de autenticação
│   │   ├── backoffice/       # Páginas administrativas
│   │   └── frontoffice/      # Páginas do utilizador
│   └── index.html            # Página inicial
├── routes/
│   ├── admin.js              # Rotas administrativas
│   ├── api.js                # Rotas da API REST
│   └── auth.js                # Rotas de autenticação
├── app.js                    # Aplicação principal
├── database.sql              # Script SQL da base de dados
└── package.json              # Dependências do projeto
```

## API Endpoints

### Autenticação
- `POST /auth/register` - Registo de utilizador
- `POST /auth/login` - Login tradicional
- `POST /auth/google` - Login com Google
- `GET /auth/me` - Verificar token

### Conteúdos
- `GET /api/filmes` - Listar todos os conteúdos
- `GET /api/filmes/:id` - Detalhes de um conteúdo
- `GET /api/pesquisar?query=...` - Pesquisar na TMDB
- `GET /api/importar` - Importar conteúdos populares da TMDB em lote
  - **Parâmetros opcionais:**
    - `pages` - Número de páginas a importar (default: 2, máximo: 10)
    - `top_rated` - Incluir também os melhor classificados? ('1' para sim, '0' para não, default: '1')
  - **Exemplos:**
    - `GET /api/importar` - Importa 2 páginas de populares + top rated (padrão)
    - `GET /api/importar?pages=5` - Importa 5 páginas de populares + top rated
    - `GET /api/importar?pages=3&top_rated=0` - Importa apenas 3 páginas de populares (sem top rated)
  - **Nota:** Esta rota importa filmes e séries populares da TMDB. Pode demorar alguns minutos dependendo do número de páginas.
- `POST /api/import-content` - Importar um conteúdo específico por TMDB ID
  - **Body:** `{ "tmdbId": 123, "type": "movie" }` ou `{ "tmdbId": 456, "type": "series" }`

### Favoritos
- `GET /api/favorites` - Listar favoritos do utilizador
- `GET /api/favorites/check/:id` - Verificar se é favorito
- `POST /api/favorites/toggle` - Adicionar/remover favorito

### Listas Personalizadas
- `GET /api/lists` - Listar listas do utilizador
- `GET /api/lists/:id` - Detalhes de uma lista
- `POST /api/lists` - Criar lista
- `PUT /api/lists/:id` - Atualizar lista
- `DELETE /api/lists/:id` - Apagar lista
- `POST /api/lists/:id/items` - Adicionar item à lista
- `DELETE /api/lists/:id/items/:contentId` - Remover item da lista

### Reviews
- `POST /api/reviews` - Criar review
- `POST /api/reviews/:reviewId/vote` - Votar na utilidade

### Administração
- `GET /api/admin/contents` - Listar conteúdos (admin)
- `POST /api/admin/contents` - Criar conteúdo (admin)
- `DELETE /api/admin/contents/:id` - Apagar conteúdo (admin)

## Base de Dados

A base de dados inclui as seguintes tabelas principais:

- `users` - Utilizadores
- `contents` - Filmes e séries
- `genres` - Géneros
- `actors` - Atores
- `directors` - Diretores
- `content_genres` - Relação conteúdo-géneros
- `content_actors` - Elenco principal
- `content_directors` - Diretores/Criadores
- `reviews` - Reviews dos utilizadores
- `review_votes` - Votos de utilidade
- `favorites` - Favoritos
- `personal_lists` - Listas personalizadas
- `list_items` - Itens das listas

## Configuração do Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Criar um novo projeto
3. Ativar Google Sign-In API
4. Criar credenciais OAuth 2.0
5. Adicionar o Client ID ao ficheiro `.env`
6. Adicionar `http://localhost:3000` aos authorized JavaScript origins

## Configuração do TMDB

1. Criar conta em [The Movie Database](https://www.themoviedb.org/)
2. Obter API Key em [TMDB Settings](https://www.themoviedb.org/settings/api)
3. Adicionar a API Key ao ficheiro `.env`

## Como Importar Conteúdos da TMDB

Após configurar a API Key do TMDB, podes importar conteúdos de duas formas:

### 1. Importação em Lote (Recomendado para início)

Aceder diretamente no navegador ou via ferramenta como Postman/curl:

```
http://localhost:3000/api/importar
```

**Ou com parâmetros:**
```
http://localhost:3000/api/importar?pages=5&top_rated=1
```

**O que faz:**
- Importa filmes e séries populares da TMDB
- Por padrão, importa 2 páginas de populares + top rated
- Cada página contém ~20 itens
- Importa automaticamente: detalhes, géneros, elenco, diretores, trailers
- Evita duplicados (não importa se já existir)

**Tempo estimado:** 1-5 minutos dependendo do número de páginas

### 2. Importação Individual

Para importar um filme/série específico:

**Via API:**
```bash
POST http://localhost:3000/api/import-content
Content-Type: application/json

{
  "tmdbId": 1396,
  "type": "series"
}
```

**Ou via navegador:**
Ao pesquisar e clicar num conteúdo que não está na BD, ele é importado automaticamente.

### 3. Importação Automática

Quando visualizas um conteúdo que não existe na BD mas tem `tmdb_id`, ele é importado automaticamente ao abrir a página de detalhes.

## Autores

**David Fernandes**  
**João Rôlo**  
**Sorin Revenco**

Projeto desenvolvido no âmbito da UC de Programação e Integração de Serviços - CTeSP TPSI - 2025/2026.

## Licença

ISC

