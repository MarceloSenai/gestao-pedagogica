const { Client } = require("pg");
const c = new Client({
  connectionString: "postgresql://postgres:GGCogxGOYtQgczFe@db.jaesievksmuipmfjshzb.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await c.connect();
  console.log("=== LIMPANDO DADOS DE TESTE ===");
  await c.query("DELETE FROM planejamentos WHERE semestre = '2026.2'");
  await c.query("DELETE FROM turmas WHERE semestre = '2026.2'");
  await c.query("UPDATE ambientes SET status = 'ativo'");
  console.log("Dados de teste limpos");

  console.log("\n=== AMPLIANDO DADOS PARA DEMO ===");

  // 15 alunos extras
  const alunos = [
    "Carolina Mendes","Rafael Ferreira","Isabela Costa","Thiago Nascimento",
    "Larissa Barbosa","Gabriel Cardoso","Amanda Ribeiro","Felipe Goncalves",
    "Camila Araujo","Matheus Correia","Natalia Pinto","Gustavo Ramos",
    "Leticia Vieira","Bruno Teixeira","Mariana Castro",
  ];
  for (const nome of alunos) {
    await c.query("INSERT INTO pessoas (nome, perfil, competencias, disponibilidade) VALUES ($1, 'aluno', '[]', '[]')", [nome]);
  }
  console.log("15 alunos adicionados");

  // 5 docentes extras
  const docentes = [
    ["Prof. Helena Dias", '["Fisica", "Matematica"]'],
    ["Prof. Andre Moreira", '["Quimica", "Biologia"]'],
    ["Profa. Lucia Campos", '["Pedagogia", "Psicologia"]'],
    ["Prof. Eduardo Lima", '["Arquitetura", "Design"]'],
    ["Profa. Sandra Reis", '["Direito", "Sociologia"]'],
  ];
  for (const [nome, comp] of docentes) {
    await c.query("INSERT INTO pessoas (nome, perfil, competencias, disponibilidade) VALUES ($1, 'docente', $2, '[\"Seg-Sex 8h-17h\"]')", [nome, comp]);
  }
  console.log("5 docentes adicionados");

  // 5 cursos extras
  const cursosData = [
    ["Engenharia Civil", "Infraestrutura e construcao"],
    ["Fisioterapia", "Reabilitacao e saude fisica"],
    ["Ciencias Contabeis", "Contabilidade e auditoria"],
    ["Marketing Digital", "Estrategia digital e comunicacao"],
    ["Educacao Fisica", "Esporte, saude e movimento"],
  ];
  const cursoIds = [];
  for (const [nome, desc] of cursosData) {
    const r = await c.query("INSERT INTO cursos (nome, descricao) VALUES ($1, $2) RETURNING id", [nome, desc]);
    cursoIds.push(r.rows[0].id);
  }
  console.log("5 cursos adicionados");

  // 10 disciplinas extras
  const allRecs = await c.query("SELECT id, nome FROM recursos ORDER BY nome");
  const recMap = {};
  for (const r of allRecs.rows) recMap[r.nome] = r.id;

  const discData = [
    ["Resistencia dos Materiais", 80, cursoIds[0], ["Computador Desktop"]],
    ["Anatomia Aplicada", 60, cursoIds[1], ["Microscopio Digital", "Bancada de Laboratorio"]],
    ["Contabilidade Gerencial", 40, cursoIds[2], ["Computador Desktop", "Projetor Multimidia"]],
    ["Marketing Estrategico", 60, cursoIds[3], ["Projetor Multimidia"]],
    ["Fisiologia do Exercicio", 80, cursoIds[4], ["Bancada de Laboratorio"]],
    ["Estruturas de Concreto", 60, cursoIds[0], ["Computador Desktop", "Impressora 3D"]],
    ["Terapia Manual", 40, cursoIds[1], []],
    ["Auditoria Fiscal", 60, cursoIds[2], ["Computador Desktop"]],
    ["SEO e Analytics", 40, cursoIds[3], ["Computador Desktop", "Projetor Multimidia"]],
    ["Treinamento Esportivo", 60, cursoIds[4], []],
  ];
  for (const [nome, ch, cid, reqs] of discData) {
    const reqsJson = reqs.map((rn) => {
      const rid = recMap[rn];
      return rid ? { recurso_id: rid, recurso_nome: rn, quantidade: 1 } : null;
    }).filter(Boolean);
    await c.query("INSERT INTO disciplinas (curso_id, nome, carga_horaria, requisitos_recursos) VALUES ($1, $2, $3, $4)", [cid, nome, ch, JSON.stringify(reqsJson)]);
  }
  console.log("10 disciplinas adicionadas");

  // 5 ambientes extras
  const predios = await c.query("SELECT id FROM predios ORDER BY nome");
  const novosAmbs = [
    ["Sala 501 - Multiuso", "sala", 50],
    ["Lab. Computacao II", "laboratorio", 35],
    ["Sala 601 - Seminarios", "sala", 60],
    ["Oficina Pratica", "oficina", 25],
    ["Auditorio Central", "auditorio", 300],
  ];
  for (const [nome, tipo, cap] of novosAmbs) {
    const pid = predios.rows[Math.floor(Math.random() * predios.rows.length)].id;
    await c.query("INSERT INTO ambientes (predio_id, nome, tipo, capacidade) VALUES ($1, $2, $3, $4)", [pid, nome, tipo, cap]);
  }
  console.log("5 ambientes adicionados");

  // Vincular recursos aos ambientes novos
  const ambientes = await c.query("SELECT id, nome FROM ambientes ORDER BY nome");
  const labComp = ambientes.rows.find((a) => a.nome.includes("Computacao II"));
  if (labComp) {
    await c.query("INSERT INTO ambiente_recursos (ambiente_id, recurso_id, quantidade) VALUES ($1, $2, 20) ON CONFLICT DO NOTHING", [labComp.id, recMap["Computador Desktop"]]);
    await c.query("INSERT INTO ambiente_recursos (ambiente_id, recurso_id, quantidade) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING", [labComp.id, recMap["Projetor Multimidia"]]);
  }
  const oficina = ambientes.rows.find((a) => a.nome.includes("Oficina Pratica"));
  if (oficina) {
    await c.query("INSERT INTO ambiente_recursos (ambiente_id, recurso_id, quantidade) VALUES ($1, $2, 6) ON CONFLICT DO NOTHING", [oficina.id, recMap["Bancada de Laboratorio"]]);
  }
  console.log("Recursos vinculados aos novos ambientes");

  // Recriar turmas 2026.1 com mais volume
  await c.query("DELETE FROM turmas WHERE semestre = '2026.1'");
  const allDiscs = await c.query("SELECT id FROM disciplinas ORDER BY nome");
  const allDocs = await c.query("SELECT id FROM pessoas WHERE perfil = 'docente' ORDER BY nome");
  const turnos = ["manha", "tarde", "noite"];

  const turmaIds = [];
  for (let i = 0; i < 30; i++) {
    const disc = allDiscs.rows[i % allDiscs.rows.length];
    const doc = allDocs.rows[i % allDocs.rows.length];
    const turno = turnos[i % 3];
    const vagas = 25 + Math.floor(Math.random() * 40);
    const r = await c.query(
      "INSERT INTO turmas (disciplina_id, docente_id, semestre, ano, turno, vagas) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [disc.id, doc.id, "2026.1", 2026, turno, vagas]
    );
    turmaIds.push(r.rows[0].id);
  }
  console.log("30 turmas criadas para 2026.1");

  // Matricular alunos
  const todosAlunos = await c.query("SELECT id FROM pessoas WHERE perfil = 'aluno'");
  let matCount = 0;
  for (const tid of turmaIds) {
    const num = 5 + Math.floor(Math.random() * Math.min(13, todosAlunos.rows.length));
    const shuffled = [...todosAlunos.rows].sort(() => Math.random() - 0.5);
    for (let j = 0; j < num; j++) {
      try {
        await c.query("INSERT INTO matriculas (turma_id, aluno_id) VALUES ($1, $2)", [tid, shuffled[j].id]);
        matCount++;
      } catch (e) {}
    }
  }
  console.log(matCount + " matriculas criadas");

  // Chamados
  const ambList = await c.query("SELECT id FROM ambientes LIMIT 5");
  const chamados = [
    ["Projetor com defeito na Sala 101", "alta"],
    ["Ar condicionado do Lab. Informatica", "urgente"],
    ["Computador nao liga - Lab Comp II", "media"],
    ["Bancada danificada - Oficina", "alta"],
    ["Impressora 3D sem filamento", "media"],
  ];
  for (let i = 0; i < chamados.length; i++) {
    await c.query("INSERT INTO chamados (tipo, referencia_id, titulo, prioridade) VALUES ('ambiente', $1, $2, $3)",
      [ambList.rows[i % ambList.rows.length].id, chamados[i][0], chamados[i][1]]);
  }
  console.log("5 chamados criados");

  // Notificacoes
  await c.query("INSERT INTO notificacoes (tipo, titulo, mensagem) VALUES ('info', 'Dados de demonstracao carregados', 'O sistema foi populado com dados realistas para demonstracao.')");
  await c.query("INSERT INTO notificacoes (tipo, titulo, mensagem) VALUES ('alerta', 'Chamado urgente: Ar condicionado', 'Lab. Informatica I com ar condicionado inoperante.')");
  await c.query("INSERT INTO notificacoes (tipo, titulo, mensagem) VALUES ('sistema', 'Semestre 2026.1 pronto', '30 turmas cadastradas com alunos matriculados.')");

  // Totais
  const t = await c.query(`
    SELECT
      (SELECT count(*) FROM predios) as predios,
      (SELECT count(*) FROM ambientes) as ambientes,
      (SELECT count(*) FROM recursos) as recursos,
      (SELECT count(*) FROM cursos) as cursos,
      (SELECT count(*) FROM disciplinas) as disciplinas,
      (SELECT count(*) FROM pessoas) as pessoas,
      (SELECT count(*) FROM pessoas WHERE perfil = 'aluno') as alunos,
      (SELECT count(*) FROM pessoas WHERE perfil = 'docente') as docentes,
      (SELECT count(*) FROM turmas) as turmas,
      (SELECT count(*) FROM matriculas) as matriculas,
      (SELECT count(*) FROM chamados) as chamados,
      (SELECT count(*) FROM notificacoes) as notificacoes
  `);
  console.log("\n=== TOTAIS FINAIS ===");
  console.log(t.rows[0]);
  await c.end();
}
run().catch((e) => console.error(e.message));
