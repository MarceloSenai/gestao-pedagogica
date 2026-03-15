import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

function createChainMock(finalData: unknown = [], finalError: unknown = null) {
  const mock: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  };
  mock.then = (resolve: (value: { data: unknown; error: unknown }) => void) =>
    resolve({ data: finalData, error: finalError });
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

describe("GET /api/cursos", () => {
  it("returns list of cursos", async () => {
    const cursos = [
      { id: "1", nome: "Engenharia", descricao: "Curso de eng" },
      { id: "2", nome: "Medicina", descricao: null },
    ];
    chainMock = createChainMock(cursos);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(cursos);
    expect(mockFrom).toHaveBeenCalledWith("cursos");
  });

  it("returns 500 on Supabase error", async () => {
    chainMock = createChainMock(null, { message: "DB error" });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB error");
  });
});

describe("POST /api/cursos", () => {
  it("creates a curso and returns 201", async () => {
    const created = { id: "new", nome: "Direito", descricao: null };
    chainMock = createChainMock(created);

    const request = new NextRequest("http://localhost/api/cursos", {
      method: "POST",
      body: JSON.stringify({ nome: "Direito" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual(created);
  });

  it("returns 400 when nome is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/cursos", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("nome is required");
  });

  it("returns 500 on Supabase insert error", async () => {
    chainMock = createChainMock(null, { message: "Insert failed" });

    const request = new NextRequest("http://localhost/api/cursos", {
      method: "POST",
      body: JSON.stringify({ nome: "Direito" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Insert failed");
  });
});
