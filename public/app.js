const form = document.querySelector("#form-aluno");
const lista = document.querySelector("#lista");
const aviso = document.querySelector("#aviso");
const tituloForm = document.querySelector("#titulo-form");
const botaoSalvar = document.querySelector("#salvar");
const botaoCancelar = document.querySelector("#cancelar");
let idEmEdicao = null;

function mostrarAviso(mensagem, erro = false) {
  aviso.textContent = mensagem;
  aviso.classList.toggle("erro", erro);
  aviso.hidden = false;
  window.clearTimeout(mostrarAviso.timer);
  mostrarAviso.timer = window.setTimeout(() => { aviso.hidden = true; }, 4500);
}

async function requisicao(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) }
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || "Ocorreu um erro na solicitação.");
  return dados;
}

function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[caractere]);
}

async function carregarAlunos(filtros = {}) {
  lista.innerHTML = '<div class="vazio">Carregando...</div>';
  const parametros = new URLSearchParams();
  if (filtros.turma) parametros.set("turma", filtros.turma);
  if (filtros.dataNascimento) parametros.set("dataNascimento", filtros.dataNascimento);
  try {
    const alunos = await requisicao(`/api/alunos?${parametros.toString()}`);
    document.querySelector("#total").textContent = `${alunos.length} aluno(s)`;
    if (!alunos.length) {
      lista.innerHTML = '<div class="vazio">Nenhum aluno encontrado. Cadastre um aluno ou altere os filtros.</div>';
      return;
    }
    lista.innerHTML = alunos.map((aluno) => `
      <article class="aluno">
        <div class="aluno-info">
          <strong>${escapar(aluno.nome)}</strong>
          <p>Turma: ${escapar(aluno.turma)} • Nascimento: ${escapar(aluno.dataNascimento)}</p>
          <span class="tag ${aluno.ativo ? "" : "inativo"}">${aluno.ativo ? "ATIVO" : "INATIVO"}</span>
        </div>
        <div class="botoes-aluno">
          <button class="mini" data-editar="${escapar(aluno.id)}" type="button">Editar</button>
          <button class="mini excluir" data-excluir="${escapar(aluno.id)}" type="button">Excluir</button>
        </div>
      </article>`).join("");
  } catch (erro) {
    lista.innerHTML = '<div class="vazio">Não foi possível carregar os alunos.</div>';
    mostrarAviso(erro.message, true);
  }
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const dados = {
    nome: document.querySelector("#nome").value.trim(),
    turma: document.querySelector("#turma").value.trim(),
    dataNascimento: document.querySelector("#dataNascimento").value,
    ativo: document.querySelector("#ativo").value === "true"
  };
  try {
    if (idEmEdicao) {
      await requisicao(`/api/alunos/${encodeURIComponent(idEmEdicao)}`, {
        method: "PUT", body: JSON.stringify(dados)
      });
      mostrarAviso("Aluno atualizado com sucesso!");
    } else {
      await requisicao("/api/alunos", { method: "POST", body: JSON.stringify(dados) });
      mostrarAviso("Aluno cadastrado com sucesso!");
    }
    form.reset();
    cancelarEdicao();
    await carregarAlunos(lerFiltros());
  } catch (erro) {
    mostrarAviso(erro.message, true);
  }
});

function lerFiltros() {
  return {
    turma: document.querySelector("#filtro-turma").value.trim(),
    dataNascimento: document.querySelector("#filtro-data").value
  };
}

function cancelarEdicao() {
  idEmEdicao = null;
  form.reset();
  tituloForm.textContent = "Cadastrar aluno";
  botaoSalvar.textContent = "Cadastrar aluno";
  botaoCancelar.hidden = true;
}

lista.addEventListener("click", async (evento) => {
  const editar = evento.target.closest("[data-editar]");
  const excluir = evento.target.closest("[data-excluir]");
  if (editar) {
    try {
      const alunos = await requisicao("/api/alunos");
      const aluno = alunos.find((item) => item.id === editar.dataset.editar);
      if (!aluno) throw new Error("Aluno não encontrado.");
      idEmEdicao = aluno.id;
      document.querySelector("#nome").value = aluno.nome;
      document.querySelector("#turma").value = aluno.turma;
      document.querySelector("#dataNascimento").value = aluno.dataNascimento;
      document.querySelector("#ativo").value = String(aluno.ativo);
      tituloForm.textContent = "Editar aluno";
      botaoSalvar.textContent = "Salvar alterações";
      botaoCancelar.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (erro) { mostrarAviso(erro.message, true); }
  }
  if (excluir) {
    if (!window.confirm("Tem certeza de que deseja excluir este aluno?")) return;
    try {
      await requisicao(`/api/alunos/${encodeURIComponent(excluir.dataset.excluir)}`, { method: "DELETE" });
      mostrarAviso("Aluno excluído com sucesso!");
      await carregarAlunos(lerFiltros());
    } catch (erro) { mostrarAviso(erro.message, true); }
  }
});

document.querySelector("#filtros").addEventListener("submit", (evento) => {
  evento.preventDefault();
  carregarAlunos(lerFiltros());
});
document.querySelector("#limpar").addEventListener("click", () => {
  document.querySelector("#filtros").reset();
  carregarAlunos();
});
document.querySelector("#atualizar-lista").addEventListener("click", () => carregarAlunos(lerFiltros()));
botaoCancelar.addEventListener("click", cancelarEdicao);

carregarAlunos();
