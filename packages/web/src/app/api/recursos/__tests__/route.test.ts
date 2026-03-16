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

describe("GET /api/recursos", () => {
  it("returns list of recursos", async () => {
    const recursos = [
      { id: "1", nome: "Projetor", quantidade: 10 },
      { id: "2", nome: "Computador", quantidade: 50 },
    ];
    chainMock = createChainMock(recursos);

    const request = new NextRequest("http://localhost/api/recursos");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(recursos);
    expect(mockFrom).toHaveBeenCalledWith("recursos");
  });

  it("returns 500 on Supabase error", async () => {
    chainMock = createChainMock(null, { message: "DB error" });

    const request = new NextRequest("http://localhost/api/recursos");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB error");
  });
});

describe("POST /api/recursos", () => {
  it("creates a recurso and returns 201", async () => {
    const created = { id: "new", nome: "Projetor", quantidade: 5 };
    chainMock = createChainMock(created);

    const request = new NextRequest("http://localhost/api/recursos", {
      method: "POST",
      body: JSON.stringify({ nome: "Projetor", quantidade: 5 }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual(created);
  });

  it("returns 400 when nome is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/recursos", {
      method: "POST",
      body: JSON.stringify({ quantidade: 5 }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("nome is required");
  });

  it("returns 400 when quantidade is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/recursos", {
      method: "POST",
      body: JSON.stringify({ nome: "Projetor" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("quantidade is required");
  });

  it("returns 400 when quantidade is null", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/recursos", {
      method: "POST",
      body: JSON.stringify({ nome: "Projetor", quantidade: null }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("quantidade is required");
  });

  it("returns 500 on Supabase insert error", async () => {
    chainMock = createChainMock(null, { message: "Insert failed" });

    const request = new NextRequest("http://localhost/api/recursos", {
      method: "POST",
      body: JSON.stringify({ nome: "Projetor", quantidade: 5 }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Insert failed");
  });
});
