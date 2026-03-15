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

describe("GET /api/pessoas", () => {
  it("returns list of pessoas", async () => {
    const pessoas = [
      { id: "1", nome: "Joao", perfil: "professor", competencias: [], disponibilidade: {} },
      { id: "2", nome: "Maria", perfil: "aluno", competencias: [], disponibilidade: {} },
    ];
    chainMock = createChainMock(pessoas);

    const request = new NextRequest("http://localhost/api/pessoas");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(pessoas);
    expect(mockFrom).toHaveBeenCalledWith("pessoas");
  });

  it("filters by perfil when provided", async () => {
    chainMock = createChainMock([]);
    const eqSpy = chainMock.eq as ReturnType<typeof vi.fn>;

    const request = new NextRequest("http://localhost/api/pessoas?perfil=professor");
    await GET(request);

    expect(eqSpy).toHaveBeenCalledWith("perfil", "professor");
  });

  it("does not filter when perfil is not provided", async () => {
    chainMock = createChainMock([]);
    const eqSpy = chainMock.eq as ReturnType<typeof vi.fn>;

    const request = new NextRequest("http://localhost/api/pessoas");
    await GET(request);

    expect(eqSpy).not.toHaveBeenCalled();
  });

  it("returns 500 on Supabase error", async () => {
    chainMock = createChainMock(null, { message: "DB error" });

    const request = new NextRequest("http://localhost/api/pessoas");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB error");
  });
});

describe("POST /api/pessoas", () => {
  it("creates a pessoa and returns 201", async () => {
    const created = { id: "new", nome: "Carlos", perfil: "professor", competencias: [], disponibilidade: {} };
    chainMock = createChainMock(created);

    const request = new NextRequest("http://localhost/api/pessoas", {
      method: "POST",
      body: JSON.stringify({ nome: "Carlos", perfil: "professor" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual(created);
  });

  it("returns 400 when nome is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/pessoas", {
      method: "POST",
      body: JSON.stringify({ perfil: "professor" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("nome is required");
  });

  it("returns 400 when perfil is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/pessoas", {
      method: "POST",
      body: JSON.stringify({ nome: "Carlos" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("perfil is required");
  });

  it("returns 500 on Supabase insert error", async () => {
    chainMock = createChainMock(null, { message: "Insert failed" });

    const request = new NextRequest("http://localhost/api/pessoas", {
      method: "POST",
      body: JSON.stringify({ nome: "Carlos", perfil: "professor" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Insert failed");
  });
});
