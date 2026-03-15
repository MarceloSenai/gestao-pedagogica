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

import { GET, PUT, DELETE } from "../route";

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/predios/[id]", () => {
  it("returns a single predio by id", async () => {
    const predio = { id: "abc", nome: "Predio A", endereco: "Rua X" };
    chainMock = createChainMock(predio);

    const request = new NextRequest("http://localhost/api/predios/abc");
    const response = await GET(request, makeParams("abc"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(predio);
    expect(mockFrom).toHaveBeenCalledWith("predios");
  });

  it("returns 404 on Supabase error", async () => {
    chainMock = createChainMock(null, { message: "Not found" });

    const request = new NextRequest("http://localhost/api/predios/xyz");
    const response = await GET(request, makeParams("xyz"));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Not found");
  });
});

describe("PUT /api/predios/[id]", () => {
  it("updates a predio", async () => {
    const updated = { id: "abc", nome: "Updated", endereco: "New Addr" };
    chainMock = createChainMock(updated);

    const request = new NextRequest("http://localhost/api/predios/abc", {
      method: "PUT",
      body: JSON.stringify({ nome: "Updated", endereco: "New Addr" }),
    });

    const response = await PUT(request, makeParams("abc"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(updated);
  });

  it("returns 400 when nome is missing", async () => {
    chainMock = createChainMock();

    const request = new NextRequest("http://localhost/api/predios/abc", {
      method: "PUT",
      body: JSON.stringify({ endereco: "Some addr" }),
    });

    const response = await PUT(request, makeParams("abc"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("nome is required");
  });

  it("returns 500 on Supabase update error", async () => {
    chainMock = createChainMock(null, { message: "Update failed" });

    const request = new NextRequest("http://localhost/api/predios/abc", {
      method: "PUT",
      body: JSON.stringify({ nome: "Test" }),
    });

    const response = await PUT(request, makeParams("abc"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Update failed");
  });
});

describe("DELETE /api/predios/[id]", () => {
  it("deletes a predio and returns success", async () => {
    chainMock = createChainMock(null, null);

    const request = new NextRequest("http://localhost/api/predios/abc", {
      method: "DELETE",
    });

    const response = await DELETE(request, makeParams("abc"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true });
  });

  it("returns 500 on Supabase delete error", async () => {
    chainMock = createChainMock(null, { message: "Delete failed" });

    const request = new NextRequest("http://localhost/api/predios/abc", {
      method: "DELETE",
    });

    const response = await DELETE(request, makeParams("abc"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Delete failed");
  });
});
