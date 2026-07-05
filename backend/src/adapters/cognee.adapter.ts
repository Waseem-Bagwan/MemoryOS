// Auth headers needed for Cloud:
//   X-Api-Key: your-api-key
//   X-Tenant-Id: your-tenant-id
//
// Real Cognee API endpoints (verified):
//   POST   /api/v1/add           → ingest raw text into a dataset
//   POST   /api/v1/cognify       → build knowledge graph from ingested data
//   POST   /api/v1/search        → search memory
//   GET    /api/v1/datasets      → list datasets
//   DELETE /api/v1/datasets/{id} → delete a whole dataset
// ─────────────────────────────────────────────────────────────
import { env } from "../config/env";

// Build headers for every Cognee Cloud request
function buildHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": env.COGNEE_API_KEY,
    "X-Tenant-Id": env.COGNEE_TENANT_ID,
  };
}

async function cogneeRequest<T>(
  path: string,
  method: "GET" | "POST" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(`${env.COGNEE_API_URL}${path}`, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cognee ${method} ${path} → ${res.status}: ${text}`);
  }

  const text = await res.text();
  if (!text || text === "null") return {} as T;
  return JSON.parse(text) as T;
}

// Each user gets their own dataset name so memories never mix
function datasetName(userId: string): string {
  return `user_${userId}`;
}

export const cogneeAdapter = {
  // ─────────────────────────────────────────
  // remember()
  // Step 1: POST /api/v1/add    → send raw text
  // Step 2: POST /api/v1/cognify → build knowledge graph
  // Returns a data item ID we store in Postgres
  // so we can delete this specific item later
  // ─────────────────────────────────────────
  async remember(text: string, userId: string): Promise<string> {
    try {
      // Step 1: Add the raw text
      const addResult = await cogneeRequest<unknown>("/api/v1/add", "POST", {
        data: text,
        dataset_name: datasetName(userId),
      });

      // Extract the item ID from whatever shape Cognee returns
      let dataId = `item-${Date.now()}`;
      if (Array.isArray(addResult) && addResult.length > 0) {
        const first = addResult[0] as Record<string, string>;
        dataId = first.id ?? first.data_id ?? dataId;
      } else if (addResult && typeof addResult === "object") {
        const r = addResult as Record<string, string>;
        dataId = r.id ?? r.data_id ?? dataId;
      }

      // Step 2: Cognify — builds the knowledge graph in the background
      await cogneeRequest<unknown>("/api/v1/cognify", "POST", {
        datasets: [datasetName(userId)],
      });

      return dataId;
    } catch (error) {
      if (env.IS_DEV) {
        console.warn("[Cognee] Not reachable in dev, using mock ID");
        return `dev-mock-${Date.now()}`;
      }
      throw error;
    }
  },

  // ─────────────────────────────────────────
  // recall()
  // POST /api/v1/search
  // search_type "CHUNKS" = raw matching text chunks
  // ─────────────────────────────────────────
  async recall(
    query: string,
    userId: string,
    limit: number = 10
  ): Promise<Array<{ id: string; content: string; score: number }>> {
    try {
      type SearchItem = {
        id?: string;
        text?: string;
        content?: string;
        score?: number;
        relevance?: number;
      };

      const result = await cogneeRequest<
        SearchItem[] | { results: SearchItem[] }
      >("/api/v1/search", "POST", {
        query,
        search_type: "CHUNKS",
        datasets: [datasetName(userId)],
        limit,
      });

      const raw: SearchItem[] = Array.isArray(result)
        ? result
        : (result as { results: SearchItem[] }).results ?? [];

      return raw.map((r, i) => ({
        id: r.id ?? `result-${i}`,
        content: r.text ?? r.content ?? "",
        score: r.score ?? r.relevance ?? 0,
      }));
    } catch (error) {
      if (env.IS_DEV) {
        console.warn("[Cognee] recall failed in dev mode, returning []");
        return [];
      }
      throw error;
    }
  },

  // ─────────────────────────────────────────
  // forget()
  // Delete one specific item from a dataset.
  // First looks up the dataset ID by name,
  // then deletes the specific data item.
  // ─────────────────────────────────────────
  async forget(cogneeDataId: string, userId: string): Promise<void> {
    try {
      const datasets = await cogneeRequest<Array<{ id: string; name: string }>>(
        "/api/v1/datasets",
        "GET"
      );

      const dataset = datasets.find((d) => d.name === datasetName(userId));
      if (!dataset) {
        console.warn(`[Cognee] No dataset found for user ${userId}`);
        return;
      }

      await cogneeRequest<unknown>(
        `/api/v1/datasets/${dataset.id}/data/${cogneeDataId}`,
        "DELETE"
      );
    } catch (error) {
      if (env.IS_DEV) {
        console.warn(`[Cognee] forget(${cogneeDataId}) failed in dev mode`);
        return;
      }
      throw error;
    }
  },

  // ─────────────────────────────────────────
  // improve()
  // Re-run cognify to strengthen relationships
  // between existing memories.
  // ─────────────────────────────────────────
  async improve(userId: string): Promise<void> {
    try {
      await cogneeRequest<unknown>("/api/v1/cognify", "POST", {
        datasets: [datasetName(userId)],
      });
    } catch (error) {
      if (env.IS_DEV) {
        console.warn("[Cognee] improve() failed in dev mode");
        return;
      }
      throw error;
    }
  },

  // ─────────────────────────────────────────
  // forgetAll()
  // Wipe the entire user dataset from Cognee.
  // Called if user requests full memory reset.
  // ─────────────────────────────────────────
  async forgetAll(userId: string): Promise<void> {
    try {
      const datasets = await cogneeRequest<Array<{ id: string; name: string }>>(
        "/api/v1/datasets",
        "GET"
      );

      const dataset = datasets.find((d) => d.name === datasetName(userId));
      if (!dataset) return;

      await cogneeRequest<unknown>(`/api/v1/datasets/${dataset.id}`, "DELETE");
    } catch (error) {
      if (env.IS_DEV) {
        console.warn("[Cognee] forgetAll() failed in dev mode");
        return;
      }
      throw error;
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      await cogneeRequest<unknown>("/health", "GET");
      return true;
    } catch {
      return false;
    }
  },
};