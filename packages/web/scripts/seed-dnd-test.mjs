// Seed script to create a planejamento with alocacoes for DnD testing
const BASE = "http://localhost:3000";

async function main() {
  // 1. Create planejamento 2026.2 rascunho
  const planRes = await fetch(`${BASE}/api/planejamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ semestre: "2026.2", ano: 2026 }),
  });
  const plan = await planRes.json();
  console.log("Planejamento criado:", plan.id, plan.status);

  // 2. Check turmas exist for 2026.2 — if not, create some
  const turmasRes = await fetch(`${BASE}/api/turmas`);
  const turmas = await turmasRes.json();
  const turmas2026_2 = (Array.isArray(turmas) ? turmas : turmas.data ?? []).filter(
    (t) => t.semestre === "2026.2" && t.ano === 2026
  );

  if (turmas2026_2.length === 0) {
    console.log("Nenhuma turma para 2026.2 — criando turmas de teste...");

    // Get disciplinas
    const discRes = await fetch(`${BASE}/api/disciplinas`);
    const discs = await discRes.json();
    const disciplinas = Array.isArray(discs) ? discs : discs.data ?? [];

    if (disciplinas.length === 0) {
      console.error("Nenhuma disciplina cadastrada. Cadastre disciplinas primeiro.");
      process.exit(1);
    }

    // Get docentes
    const pesRes = await fetch(`${BASE}/api/pessoas?perfil=docente`);
    const pessoas = await pesRes.json();
    const docentes = Array.isArray(pessoas) ? pessoas : pessoas.data ?? [];

    const turnos = ["manha", "tarde", "noite"];
    for (let i = 0; i < Math.min(6, disciplinas.length); i++) {
      const turma = {
        disciplina_id: disciplinas[i].id,
        docente_id: docentes[i % docentes.length]?.id ?? null,
        semestre: "2026.2",
        ano: 2026,
        turno: turnos[i % 3],
        vagas: 30 + (i * 5),
      };
      const r = await fetch(`${BASE}/api/turmas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(turma),
      });
      const t = await r.json();
      console.log(`  Turma: ${disciplinas[i].nome} (${turma.turno}) -> ${t.id}`);
    }
  } else {
    console.log(`${turmas2026_2.length} turmas já existem para 2026.2`);
  }

  // 3. Execute allocation
  console.log("Executando alocação...");
  const execRes = await fetch(`${BASE}/api/planejamentos/${plan.id}/executar`, {
    method: "POST",
  });
  const execData = await execRes.json();

  if (!execRes.ok) {
    console.error("Erro na alocação:", execData.error);
    process.exit(1);
  }

  console.log("\nResultado da alocação:");
  console.log(`  Total: ${execData.summary.total}`);
  console.log(`  Alocadas: ${execData.summary.alocadas}`);
  console.log(`  Não alocadas: ${execData.summary.nao_alocadas}`);
  console.log(`  Conflitos: ${execData.summary.conflitos}`);
  console.log(`  Taxa sucesso: ${execData.summary.taxa_sucesso}%`);

  console.log(`\n>>> Abra no browser: http://localhost:3000/planejamentos/${plan.id}/grade`);
  console.log(">>> O planejamento está em RASCUNHO — drag and drop habilitado!");
}

main().catch(console.error);
