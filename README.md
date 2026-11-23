# Impulsiona Estágio

Aplicação web de oportunidades de estágio integrada ao back-end em Node.js/Express.js com Prisma ORM e SQLite.

## O que foi implementado

- Modelagem do banco de dados com Prisma e schema no arquivo prisma/schema.prisma
- Arquitetura MVC com separação entre models, controllers e rotas
- Operações CRUD para vagas, perfil e notificações
- Migrations e seed para criação e população inicial do banco
- Interface web com criação, listagem, edição e remoção de vagas
- Testes de API via REST Client no arquivo requests.http
- Autenticação com bcrypt, JWT, middleware e rotas protegidas

## Estrutura principal

- server.ts: configuração do Express, middlewares, rotas e health check
- src/controllers: controllers responsáveis por receber requisições HTTP e responder
- src/models: camada de acesso ao banco com Prisma Client
- prisma/schema.prisma: definição dos modelos e relacionamentos
- prisma/seed.ts: dados iniciais para desenvolvimento e testes
- public: interface web em HTML/CSS/TypeScript

## Modelagem do banco de dados

O schema define os modelos:

- Vaga: representa oportunidades de estágio e emprego
- Candidato: representa candidatos que se inscrevem
- Candidatura: relaciona vagas e candidatos
- Perfil: armazena dados do usuário/perfil do estudante
- Notification: representa notificações do sistema

O relacionamento principal é entre Vaga e Candidatura, onde uma vaga pode ter várias candidaturas e cada candidatura pertence a uma vaga e a um candidato.

O diagrama ERD está em docs/erd-migration.mmd.

## Arquitetura MVC

- Model: arquivos em src/models executam operações CRUD com Prisma Client
- Controller: arquivos em src/controllers recebem dados, validam entradas e retornam respostas HTTP
- Rotas: definidas em server.ts e nos controllers via Express Router

## Migrations e seed

Para criar e aplicar a estrutura do banco:

```bash
npx prisma migrate dev --name init
npm run seed
```

Os arquivos de migration ficam em prisma/migrations e o seed em prisma/seed.ts.

## Executando a aplicação

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Acesse http://localhost:3000.

## Testes da API

O arquivo requests.http contém requisições para:

- Listar, buscar, criar, atualizar e excluir vagas
- Casos inválidos e validação de formulário
- Testes de perfil e notificações

Use a extensão REST Client do VSCode para enviar as requisições.

## Autenticação

Configure `DATABASE_URL` e `JWT_SECRET` no arquivo `.env`; `JWT_SECRET` é obrigatório e deve ser uma chave forte, diferente do valor de exemplo. O cadastro usa `bcrypt` com fator 12 e grava somente `passwordHash`; o e-mail é único no banco. O login retorna um JWT com validade de duas horas. Envie-o como `Authorization: Bearer <token>` para acessar o próprio perfil e operações de escrita de vagas/notificações. Estudantes autenticados podem se candidatar uma vez a cada vaga; antes do envio, respondem a perguntas sobre habilidades, experiências/projetos, motivação e disponibilidade. As respostas ficam salvas na candidatura e o status inicial é `Pendente`. Após atualizar o projeto, aplique novas migrations com `npx prisma migrate deploy`. O middleware compara a versão incluída no token com `tokenVersion` do usuário. No logout, essa versão é incrementada no banco, invalidando todos os JWTs já emitidos para aquela conta, mesmo após reinício do servidor; um novo login emite tokens válidos com a versão atual. O arquivo `requests.http` demonstra cadastro, validações, login, acesso protegido com e sem token, candidaturas, logout e rejeição do mesmo token revogado (`401`).

## Validação de requisições

As rotas ativas usam schemas Zod por domínio e o middleware `src/middleware/validate.ts` valida body, query, params, headers e cookies antes do controller. O error handler global converte `ZodError` em `400` com uma lista `issues`, cada item contendo `path` e `message`. O parser `src/utils/cookies.ts` trata o cabeçalho de cookies sem dependência externa; a autenticação atual continua usando Bearer JWT. Os exemplos de payload e query válidos e inválidos estão em `requests.http`.

## E-mail de boas-vindas

O cadastro de estudante grava usuário e perfil (curso/campus) na mesma transação; em seguida solicita o envio pelo serviço `src/services/SendMail.ts`. Empresa não exige curso/campus. Uma falha SMTP é registrada no servidor, informa `emailEnviado: false` e não desfaz o cadastro nem altera o `201`. Configure `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS` e `EMAIL_FROM` no `.env`. Em `NODE_ENV=development`, sem credenciais SMTP, a configuração usa uma conta de teste Ethereal e imprime no terminal a URL para visualizar a mensagem; ela não é entregue a uma caixa real. Em produção configure remetente e credenciais SMTP válidos. Nunca versionar os valores reais do `.env`.

## CRUD no front-end

A interface em public permite:

- Criar novas vagas pelo formulário
- Visualizar vagas cadastradas na lista
- Editar vagas existentes
- Excluir vagas com confirmação
- Navegar entre as seções de vagas, cadastro, perfil e notificações
