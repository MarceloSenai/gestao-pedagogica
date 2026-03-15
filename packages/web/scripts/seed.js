const { Client } = require("pg");

const client = new Client({
  connectionString:
    "postgresql://postgres:GGCogxGOYtQgczFe@db.jaesievksmuipmfjshzb.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  await client.connect();
  console.log("Connected to Supabase");

  // Predios
  const predios = await client.query(`
    INSERT INTO predios (nome, endereco) VALUES
      ('Bloco A - Engenharias', 'Av. Principal, 100'),
      ('Bloco B - Saude', 'Av. Principal, 200'),
      ('Bloco C - Humanas', 'Av. Principal, 300'),
      ('Bloco D - Exatas', 'Rua da Ciencia, 50'),
      ('Bloco E - Artes', 'Rua da Cultura, 75'),
      ('Bloco F - Administrativo', 'Av. Principal, 10'),
      ('Bloco G - Biblioteca Central', 'Praca do Saber, 1'),
      ('Bloco H - Esportes', 'Alameda Olimpica, 30'),
      ('Bloco I - Tecnologia', 'Rua Digital, 120'),
      ('Bloco J - Pesquisa', 'Rua da Inovacao, 200')
    RETURNING id, nome
  `);
  console.log("Predios:", predios.rowCount);
  const pids = predios.rows.map((r) => r.id);

  // Ambientes
  const ambientes = [
    [pids[0], "Sala 101", "sala", 40],
    [pids[0], "Lab. Informatica I", "laboratorio", 30],
    [pids[1], "Auditorio Principal", "auditorio", 200],
    [pids[1], "Lab. Anatomia", "laboratorio", 25],
    [pids[2], "Sala 301 - Humanidades", "sala", 35],
    [pids[2], "Oficina de Artes", "oficina", 20],
    [pids[3], "Lab. Fisica Experimental", "laboratorio", 28],
    [pids[3], "Sala 401 - Matematica", "sala", 45],
    [pids[4], "Atelie de Design", "oficina", 22],
    [pids[4], "Auditorio Secundario", "auditorio", 150],
  ];
  for (const [pid, nome, tipo, cap] of ambientes) {
    await client.query(
      "INSERT INTO ambientes (predio_id, nome, tipo, capacidade) VALUES ($1,$2,$3,$4)",
      [pid, nome, tipo, cap]
    );
  }
  console.log("Ambientes: 10");

  // Recursos
  await client.query(`
    INSERT INTO recursos (nome, quantidade) VALUES
      ('Projetor Multimidia', 15),
      ('Quadro Branco', 30),
      ('Computador Desktop', 60),
      ('Microscopio Digital', 10),
      ('Kit Arduino', 20),
      ('Bancada de Laboratorio', 8),
      ('Ar Condicionado Split', 25),
      ('Sistema de Som', 5),
      ('Impressora 3D', 3),
      ('Lousa Digital Interativa', 12)
  `);
  console.log("Recursos: 10");

  // Cursos
  const cursos = await client.query(`
    INSERT INTO cursos (nome, descricao) VALUES
      ('Engenharia de Software', 'Desenvolvimento de sistemas e arquitetura'),
      ('Administracao', 'Gestao empresarial e estrategia'),
      ('Medicina', 'Formacao medica com residencia'),
      ('Direito', 'Ciencias juridicas e pratica forense'),
      ('Arquitetura e Urbanismo', 'Projetos e planejamento urbano'),
      ('Pedagogia', 'Formacao de educadores'),
      ('Ciencia da Computacao', 'Algoritmos e inteligencia artificial'),
      ('Enfermagem', 'Cuidados em saude e gestao hospitalar'),
      ('Psicologia', 'Comportamento humano e clinica'),
      ('Design Grafico', 'Comunicacao visual e UX/UI')
    RETURNING id, nome
  `);
  console.log("Cursos:", cursos.rowCount);
  const cids = cursos.rows.map((r) => r.id);

  // Disciplinas
  const disciplinas = [
    [cids[0], "Algoritmos e Estruturas de Dados", 80],
    [cids[0], "Engenharia de Requisitos", 60],
    [cids[2], "Anatomia Humana", 120],
    [cids[3], "Direito Constitucional", 60],
    [cids[4], "Projeto Arquitetonico I", 80],
    [cids[5], "Didatica e Pratica de Ensino", 40],
    [cids[6], "Banco de Dados Relacional", 60],
    [cids[7], "Farmacologia Clinica", 80],
    [cids[8], "Psicologia Social", 40],
    [cids[1], "Calculo Diferencial I", 60],
  ];
  for (const [cid, nome, ch] of disciplinas) {
    await client.query(
      "INSERT INTO disciplinas (curso_id, nome, carga_horaria) VALUES ($1,$2,$3)",
      [cid, nome, ch]
    );
  }
  console.log("Disciplinas: 10");

  // Pessoas
  await client.query(`
    INSERT INTO pessoas (nome, perfil, competencias, disponibilidade) VALUES
      ('Ana Clara Silva', 'coordenador', '["Gestao academica", "Planejamento curricular"]', '["Seg-Sex 8h-17h"]'),
      ('Prof. Carlos Oliveira', 'docente', '["Algoritmos", "Python", "Java"]', '["Seg, Qua, Sex 8h-12h"]'),
      ('Profa. Maria Santos', 'docente', '["Anatomia", "Fisiologia"]', '["Ter, Qui 8h-17h"]'),
      ('Prof. Joao Pereira', 'docente', '["Direito Civil", "Constitucional"]', '["Seg-Qui 14h-18h"]'),
      ('Fernanda Lima', 'secretaria', '["Matriculas", "Atendimento"]', '["Seg-Sex 8h-17h"]'),
      ('Prof. Roberto Costa', 'docente', '["Calculo", "Algebra Linear"]', '["Seg, Qua 8h-12h"]'),
      ('Juliana Alves', 'aluno', '[]', '["Manha e Tarde"]'),
      ('Pedro Souza', 'aluno', '[]', '["Manha"]'),
      ('Beatriz Rocha', 'gestor', '["Administracao escolar", "Orcamento"]', '["Seg-Sex 8h-18h"]'),
      ('Lucas Martins', 'apoio_ti', '["Redes", "Suporte", "Linux"]', '["Seg-Sex 8h-17h"]')
  `);
  console.log("Pessoas: 10");

  // Totals
  const counts = await client.query(`
    SELECT
      (SELECT count(*) FROM predios) as predios,
      (SELECT count(*) FROM ambientes) as ambientes,
      (SELECT count(*) FROM recursos) as recursos,
      (SELECT count(*) FROM cursos) as cursos,
      (SELECT count(*) FROM disciplinas) as disciplinas,
      (SELECT count(*) FROM pessoas) as pessoas
  `);
  console.log("\n=== TOTAIS ===");
  console.log(counts.rows[0]);

  await client.end();
  console.log("\nSeed completo!");
}

seed().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
