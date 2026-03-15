import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Create a chainable mock
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
  // Make it thenable so `await query` resolves
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

// Import after mock
import { GET, POST } from "../route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/predios", () => {
  it("returns list of predios", async () => {
    const predios = [
      { id: "1", nome: "Predio A", endereco: "Rua X" },
      { id: "2", nome: "Predio B", endereco: "Rua Y" },
    ];
    chainMock = createChainMock(predios);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(predios);
    expect(mockFrom).toHaveBeenCalledWith("predios");
  });

  it("returns 500 on Supabase error", async () => {
    chainMock = createChainMock(null, { message: "DB error" });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB error");
  });
});

describe("POST /api/predios", () => {
  it("creates a predio and returns 201", async () => {
    const created = { id: "new-id", nome: "Predio C", endereco: null };
    chainMock = createChainMock(created);

    const request = new NextRequest("http://localhost/api/predios", {
      method: "POST",
      body: JSON.stringify({ nome: "Predio C" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual(created);
    expect(mockFrom).toHaveBeenCalledWith("predios");
  });

  it("returns 400 when nome is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/predios", {
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

    const request = new NextRequest("http://localhost/api/predios", {
      method: "POST",
      body: JSON.stringify({ nome: "Predio D" }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Insert failed");
  });
});
