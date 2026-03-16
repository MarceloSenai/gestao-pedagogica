import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

function createChainMock(finalData: unknown = [], finalError: unknown = null, finalCount: number | null = null) {
  const mock: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };
  mock.then = (resolve: (value: { data: unknown; error: unknown; count: number | null }) => void) =>
    resolve({ data: finalData, error: finalError, count: finalCount });
  return mock;
}

let chainMock: ReturnType<typeof createChainMock>;
const mockFrom = vi.fn(() => chainMock);

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}));

import { GET, POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/disciplinas", () => {
  it("returns list of disciplinas", async () => {
    const disciplinas = [
      { id: "1", nome: "Calculo I", curso_id: "c1", carga_horaria: 60, cursos: { nome: "Engenharia" } },
    ];
    chainMock = createChainMock(disciplinas);

    const request = new NextRequest("http://localhost/api/disciplinas");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(disciplinas);
    expect(mockFrom).toHaveBeenCalledWith("disciplinas");
  });

  it("filters by curso_id when provided", async () => {
    chainMock = createChainMock([]);
    const eqSpy = chainMock.eq as ReturnType<typeof vi.fn>;

    const request = new NextRequest("http://localhost/api/disciplinas?curso_id=c1");
    await GET(request);

    expect(eqSpy).toHaveBeenCalledWith("curso_id", "c1");
  });

  it("returns 500 on Supabase error", async () => {
    chainMock = createChainMock(null, { message: "DB error" });

    const request = new NextRequest("http://localhost/api/disciplinas");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB error");
  });
});

describe("POST /api/disciplinas", () => {
  it("creates a disciplina and returns 201", async () => {
    const created = { id: "new", nome: "Fisica I", curso_id: "c1", carga_horaria: 80, requisitos_recursos: [] };
    chainMock = createChainMock(created);

    const request = new NextRequest("http://localhost/api/disciplinas", {
      method: "POST",
      body: JSON.stringify({ nome: "Fisica I", curso_id: "c1", carga_horaria: 80 }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual(created);
  });

  it("returns 400 when nome is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/disciplinas", {
      method: "POST",
      body: JSON.stringify({ curso_id: "c1", carga_horaria: 60 }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("nome is required");
  });

  it("returns 400 when curso_id is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/disciplinas", {
      method: "POST",
      body: JSON.stringify({ nome: "Fisica I", carga_horaria: 60 }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("curso_id is required");
  });

  it("returns 400 when carga_horaria is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/disciplinas", {
      method: "POST",
      body: JSON.stringify({ nome: "Fisica I", curso_id: "c1" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("carga_horaria is required");
  });

  it("returns 400 when carga_horaria is null", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/disciplinas", {
      method: "POST",
      body: JSON.stringify({ nome: "Fisica I", curso_id: "c1", carga_horaria: null }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("carga_horaria is required");
  });

  it("returns 500 on Supabase insert error", async () => {
    chainMock = createChainMock(null, { message: "Insert failed" });

    const request = new NextRequest("http://localhost/api/disciplinas", {
      method: "POST",
      body: JSON.stringify({ nome: "Fisica I", curso_id: "c1", carga_horaria: 60 }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Insert failed");
  });
});
