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

describe("GET /api/ambientes", () => {
  it("returns list of ambientes", async () => {
    const ambientes = [
      { id: "1", nome: "Sala 101", predio_id: "p1", tipo: "sala", predios: { nome: "Predio A" } },
    ];
    chainMock = createChainMock(ambientes);

    const request = new NextRequest("http://localhost/api/ambientes");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(ambientes);
    expect(mockFrom).toHaveBeenCalledWith("ambientes");
  });

  it("filters by predio_id when provided", async () => {
    chainMock = createChainMock([]);
    const eqSpy = chainMock.eq as ReturnType<typeof vi.fn>;

    const request = new NextRequest("http://localhost/api/ambientes?predio_id=p1");
    await GET(request);

    expect(eqSpy).toHaveBeenCalledWith("predio_id", "p1");
  });

  it("returns 500 on Supabase error", async () => {
    chainMock = createChainMock(null, { message: "DB error" });

    const request = new NextRequest("http://localhost/api/ambientes");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB error");
  });
});

describe("POST /api/ambientes", () => {
  it("creates an ambiente and returns 201", async () => {
    const created = { id: "new", nome: "Lab 1", predio_id: "p1", tipo: "laboratorio", capacidade: 30 };
    chainMock = createChainMock(created);

    const request = new NextRequest("http://localhost/api/ambientes", {
      method: "POST",
      body: JSON.stringify({ nome: "Lab 1", predio_id: "p1", tipo: "laboratorio", capacidade: 30 }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual(created);
  });

  it("returns 400 when nome is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/ambientes", {
      method: "POST",
      body: JSON.stringify({ predio_id: "p1", tipo: "sala" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("nome is required");
  });

  it("returns 400 when predio_id is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/ambientes", {
      method: "POST",
      body: JSON.stringify({ nome: "Sala 1", tipo: "sala" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("predio_id is required");
  });

  it("returns 400 when tipo is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/ambientes", {
      method: "POST",
      body: JSON.stringify({ nome: "Sala 1", predio_id: "p1" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("tipo is required");
  });

  it("returns 500 on Supabase insert error", async () => {
    chainMock = createChainMock(null, { message: "Insert failed" });

    const request = new NextRequest("http://localhost/api/ambientes", {
      method: "POST",
      body: JSON.stringify({ nome: "Sala", predio_id: "p1", tipo: "sala" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Insert failed");
  });
});
