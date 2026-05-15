# Planeja+ — Frontend React

Interface web do **Planeja+**, um gerenciador de estudos com disciplinas e tópicos.

## Pré-requisitos

- Node.js 18+ e npm 9+
- Backend Spring Boot rodando (ver repositório `sistema-estudos-backend`)

## Instalação

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd planeja-app

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env se necessário (veja seção abaixo)

# 4. Iniciar servidor de desenvolvimento
npm start
```

O app abrirá em `http://localhost:3000`.

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme seu ambiente:

| Variável            | Padrão                      | Descrição               |
|---------------------|-----------------------------|-------------------------|
| `REACT_APP_API_URL` | `http://localhost:8080/api` | URL base da API backend |

> Arquivos `.env` **nunca** devem ser commitados. Apenas `.env.example` vai para o repositório.

## Scripts disponíveis

| Comando         | Descrição                             |
|-----------------|---------------------------------------|
| `npm start`     | Inicia em modo desenvolvimento        |
| `npm run build` | Gera build de produção em `build/`    |
| `npm test`      | Executa a suíte de testes             |

## Estrutura de arquivos

```
src/
├── App.js                          # Rotas principais (React Router)
├── pages/
│   ├── Login.js / Login.css        # Tela de login (/login)
│   ├── Cadastro.js                 # Cadastro de conta (/cadastro)
│   ├── Painel.js / Painel.css      # Painel principal (/)
│   └── Perfil.js / Perfil.css      # Perfil do usuário (/perfil)
├── components/
│   ├── CardDisciplina.js / .css    # Card de cada disciplina
│   ├── ModalDisciplina.js / .css   # Modal de cadastro de disciplina
│   └── Rodape.js / Rodape.css      # Rodapé fixo com ações
└── services/
    └── api.js                      # Axios configurado com JWT interceptor
```

## Rotas

| Rota        | Componente | Protegida |
|-------------|------------|-----------|
| `/login`    | Login      | Não       |
| `/cadastro` | Cadastro   | Não       |
| `/`         | Painel     | Sim       |
| `/perfil`   | Perfil     | Sim       |

Rotas protegidas exigem `token` no `localStorage`. Sem token, o usuário é redirecionado para `/login`.

## Integração com a API

O arquivo `src/services/api.js` configura o Axios com:

- **baseURL**: valor de `REACT_APP_API_URL` (fallback: `http://localhost:8080/api`)
- **Interceptor de request**: injeta `Authorization: Bearer <token>` em todas as requisições
- **Interceptor de response**: limpa o `localStorage` e redireciona para `/login` em caso de `400` ou `401`

### Endpoints esperados

| Método | Endpoint                                 | Descrição                    |
|--------|------------------------------------------|------------------------------|
| POST   | `/auth/register`                         | Criar conta                  |
| POST   | `/auth/login`                            | Login (retorna token JWT)    |
| GET    | `/disciplinas`                           | Lista disciplinas do usuário |
| POST   | `/disciplinas`                           | Nova disciplina              |
| PATCH  | `/disciplinas/:id/topicos/:tid/toggle`   | Marcar/desmarcar tópico      |
| POST   | `/disciplinas/:id/topicos`               | Novo tópico                  |
| GET    | `/usuarios/perfil`                       | Dados do usuário autenticado |
| PUT    | `/usuarios/perfil`                       | Atualizar nome e email       |
| DELETE | `/usuarios/perfil`                       | Excluir conta                |

## Tecnologias

- React 18
- React Router DOM 6
- Axios
- CSS puro (sem bibliotecas de UI)

## Paleta de cores

| Token            | Valor     |
|------------------|-----------|
| Primária (teal)  | `#1A9E9E` |
| Verde check      | `#4CAF50` |
| Laranja pendente | `#E8872A` |
| Fundo            | `#F0F2F5` |
| Texto principal  | `#1A1A2E` |
| Texto secundário | `#6B7280` |
