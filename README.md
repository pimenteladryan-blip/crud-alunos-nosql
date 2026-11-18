# CRUD de Alunos NoSQL

Aplicação acadêmica de cadastro de alunos com **Node.js**, **Express** e **Firebase Cloud Firestore**.
https://crud-alunos-nosql.onrender.com
## Funcionalidades

- **CREATE:** cadastrar aluno.
- **READ:** listar alunos.
- **UPDATE:** editar aluno.
- **DELETE:** excluir aluno.
- Consultar por turma.
- Consultar por data de nascimento.
- Interface web responsiva em português.

## Campos da coleção `alunos`

| Campo | Tipo | Exemplo |
|---|---|---|
| `nome` | string | Ana Souza |
| `turma` | string | 3DSB |
| `dataNascimento` | string | 2009-05-15 |
| `ativo` | boolean | true |

A coleção `alunos` e os documentos são criados automaticamente no primeiro cadastro.

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Crie o banco **Cloud Firestore**.
3. Em **Configurações do projeto → Contas de serviço**, gere uma chave privada para o Firebase Admin SDK.
4. Mantenha o arquivo JSON privado. Não o envie ao GitHub.
5. No ambiente onde a aplicação será executada, configure o Secret/variável de ambiente `FIREBASE_SERVICE_ACCOUNT` com o conteúdo JSON completo da chave.
6. Instale as dependências com `npm install`.
7. Inicie com `npm start`.

Para execução local, crie um arquivo `.env` (não versionado) com a variável `FIREBASE_SERVICE_ACCOUNT` contendo o JSON completo e válido. Em hospedagens, prefira o painel de Secrets/Environment Variables.

## Rotas da API

| Método | Rota | Operação |
|---|---|---|
| GET | `/api/alunos` | Listar alunos |
| GET | `/api/alunos?turma=3DSB` | Consultar por turma |
| GET | `/api/alunos?dataNascimento=2009-05-15` | Consultar por nascimento |
| POST | `/api/alunos` | Cadastrar |
| PUT | `/api/alunos/:id` | Atualizar |
| DELETE | `/api/alunos/:id` | Excluir |
| GET | `/api/health` | Verificar servidor |

### Exemplo de cadastro

```json
{
  "nome": "Ana Souza",
  "turma": "3DSB",
  "dataNascimento": "2009-05-15",
  "ativo": true
}
```

## Segurança

- A chave da conta de serviço nunca deve ser commitada.
- `.env`, arquivos de credenciais e `node_modules` estão no `.gitignore`.
- Use somente dados fictícios na demonstração.
- O Firebase Admin SDK tem permissões administrativas; mantenha o Secret privado.

## Observação

Este repositório contém o código-fonte. Para acessar a aplicação pela internet, ainda é necessário configurar a variável secreta no serviço de hospedagem e realizar o deploy.
