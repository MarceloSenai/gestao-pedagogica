import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

function createChainMock(
  finalData: unknown = null,
  finalError: unknown = null,
  finalCount: number | null = null
) {
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
  mock.then = (
    resolve: (value: {
      data: unknown;
      error: unknown;
      count: number | null;
    }) => void
  ) => resolve({ data: finalData, error: finalError, count: finalCount });
  return mock;
}

let chainMock: ReturnType<typeof createChainMock>;
const mockFrom = vi.fn(() => chainMock);

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}));

import { PATCH } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/alocacoes/[id]", () => {
  const makeParams = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  it("updates ambiente_id and returns updated alocacao", async () => {
    // First call: fetch alocacao with planejamento status
    const fetchMock = createChainMock({
      id: "aloc-1",
      ambiente_id: "amb-old",
      planejamentos: { status: "rascunho" },
    });
    // Second call: update
    const updateMock = createChainMock({
      id: "aloc-1",
      ambiente_id: "amb-new",
      status: "alocada",
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1
        ? (fetchMock as ReturnType<typeof createChainMock>)
        : (updateMock as ReturnType<typeof createChainMock>);
    });

    const request = new NextRequest("http://localhost/api/alocacoes/aloc-1", {
      method: "PATCH",
      body: JSON.stringify({ ambiente_id: "amb-new" }),
    });

    const response = await PATCH(request, makeParams("aloc-1"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ambiente_id).toBe("amb-new");
  });

  it("returns 400 when planejamento is not rascunho", async () => {
    chainMock = createChainMock({
      id: "aloc-1",
      planejamentos: { status: "publicado" },
    });

    const request = new NextRequest("http://localhost/api/alocacoes/aloc-1", {
      method: "PATCH",
      body: JSON.stringify({ ambiente_id: "amb-new" }),
    });

    const response = await PATCH(request, makeParams("aloc-1"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain("rascunho");
  });

  it("returns 500 on Supabase update error", async () => {
    // First call: fetch succeeds
    const fetchMock = createChainMock({
      id: "aloc-1",
      ambiente_id: "amb-old",
      planejamentos: { status: "rascunho" },
    });
    // Second call: update fails
    const updateMock = createChainMock(null, { message: "Update failed" });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1
        ? (fetchMock as ReturnType<typeof createChainMock>)
        : (updateMock as ReturnType<typeof createChainMock>);
    });

    const request = new NextRequest("http://localhost/api/alocacoes/aloc-1", {
      method: "PATCH",
      body: JSON.stringify({ ambiente_id: "amb-new" }),
    });

    const response = await PATCH(request, makeParams("aloc-1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Update failed");
  });

  it("sets status to nao_alocada when ambiente_id is null", async () => {
    const fetchMock = createChainMock({
      id: "aloc-1",
      ambiente_id: "amb-old",
      planejamentos: { status: "rascunho" },
    });
    const updateMock = createChainMock({
      id: "aloc-1",
      ambiente_id: null,
      status: "nao_alocada",
    });

    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount++;
      return callCount === 1
        ? (fetchMock as ReturnType<typeof createChainMock>)
        : (updateMock as ReturnType<typeof createChainMock>);
    });

    const request = new NextRequest("http://localhost/api/alocacoes/aloc-1", {
      method: "PATCH",
      body: JSON.stringify({ ambiente_id: null }),
    });

    const response = await PATCH(request, makeParams("aloc-1"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ambiente_id).toBeNull();
    expect(json.status).toBe("nao_alocada");
  });
});
