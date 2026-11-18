import "dotenv/config";
import express from "express";
import admin from "firebase-admin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

function initializeFirebase() {
  if (admin.apps.length) return;

  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!rawCredentials) {
    throw new Error(
      "A variável FIREBASE_SERVICE_ACCOUNT não foi configurada. Adicione o JSON da conta de serviço nos Secrets do ambiente."
    );
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(rawCredentials);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT precisa conter um JSON válido.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

initializeFirebase();
const db = admin.firestore();
const alunos = db.collection("alunos");

const camposPermitidos = ["nome", "turma", "dataNascimento", "ativo"];

function validarAluno(dados, parcial = false) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    return "Envie um objeto JSON válido.";
  }

  const chaves = Object.keys(dados);
  if (chaves.some((chave) => !camposPermitidos.includes(chave))) {
    return "Há campos não permitidos.";
  }

  if (!parcial && camposPermitidos.some((campo) => !(campo in dados))) {
    return "Informe nome, turma, dataNascimento e ativo.";
  }

  if ("nome" in dados && (typeof dados.nome !== "string" || !dados.nome.trim())) {
    return "O nome deve ser um texto não vazio.";
  }
  if ("turma" in dados && (typeof dados.turma !== "string" || !dados.turma.trim())) {
    return "A turma deve ser um texto não vazio.";
  }
  if ("dataNascimento" in dados) {
    const data = dados.dataNascimento;
    if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return "A data deve estar no formato AAAA-MM-DD.";
    }
    const [ano, mes, dia] = data.split("-").map(Number);
    const teste = new Date(Date.UTC(ano, mes - 1, dia));
    if (teste.getUTCFullYear() !== ano || teste.getUTCMonth() !== mes - 1 || teste.getUTCDate() !== dia) {
      return "Informe uma data de nascimento válida.";
    }
  }
  if ("ativo" in dados && typeof dados.ativo !== "boolean") {
    return "O campo ativo deve ser verdadeiro ou falso.";
  }
  return null;
}

function normalizar(dados) {
  const resultado = { ...dados };
  if (typeof resultado.nome === "string") resultado.nome = resultado.nome.trim();
  if (typeof resultado.turma === "string") resultado.turma = resultado.turma.trim();
  return resultado;
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", projeto: "CRUD de Alunos NoSQL" });
});

// READ: lista todos ou filtra por turma e/ou data de nascimento.
app.get("/api/alunos", async (req, res) => {
  try {
    let consulta = alunos.orderBy("nome");
    if (req.query.turma) consulta = consulta.where("turma", "==", String(req.query.turma).trim());
    if (req.query.dataNascimento) consulta = consulta.where("dataNascimento", "==", String(req.query.dataNascimento));
    const snapshot = await consulta.get();
    res.json(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (erro) {
    console.error("Erro ao listar alunos:", erro);
    res.status(500).json({ erro: "Não foi possível listar os alunos." });
  }
});

// CREATE
app.post("/api/alunos", async (req, res) => {
  const erroValidacao = validarAluno(req.body);
  if (erroValidacao) return res.status(400).json({ erro: erroValidacao });

  try {
    const doc = await alunos.add(normalizar(req.body));
    res.status(201).json({ id: doc.id, mensagem: "Aluno cadastrado com sucesso." });
  } catch (erro) {
    console.error("Erro ao cadastrar aluno:", erro);
    res.status(500).json({ erro: "Não foi possível cadastrar o aluno." });
  }
});

// UPDATE
app.put("/api/alunos/:id", async (req, res) => {
  const erroValidacao = validarAluno(req.body, true);
  if (erroValidacao) return res.status(400).json({ erro: erroValidacao });
  if (Object.keys(req.body ?? {}).length === 0) {
    return res.status(400).json({ erro: "Informe pelo menos um campo para atualizar." });
  }

  try {
    const ref = alunos.doc(req.params.id);
    const existente = await ref.get();
    if (!existente.exists) return res.status(404).json({ erro: "Aluno não encontrado." });
    await ref.update(normalizar(req.body));
    res.json({ mensagem: "Aluno atualizado com sucesso." });
  } catch (erro) {
    console.error("Erro ao atualizar aluno:", erro);
    res.status(500).json({ erro: "Não foi possível atualizar o aluno." });
  }
});

// DELETE
app.delete("/api/alunos/:id", async (req, res) => {
  try {
    const ref = alunos.doc(req.params.id);
    const existente = await ref.get();
    if (!existente.exists) return res.status(404).json({ erro: "Aluno não encontrado." });
    await ref.delete();
    res.json({ mensagem: "Aluno excluído com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir aluno:", erro);
    res.status(500).json({ erro: "Não foi possível excluir o aluno." });
  }
});

app.use("/api", (_req, res) => res.status(404).json({ erro: "Rota da API não encontrada." }));

app.use((erro, _req, res, _next) => {
  console.error("Erro inesperado:", erro);
  res.status(400).json({ erro: "Não foi possível processar a solicitação." });
});

const porta = Number(process.env.PORT) || 3000;
app.listen(porta, "0.0.0.0", () => {
  console.log(`CRUD de Alunos disponível na porta ${porta}`);
});
