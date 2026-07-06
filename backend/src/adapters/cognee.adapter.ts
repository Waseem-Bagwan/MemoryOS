import { env } from "../config/env";

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

function datasetName(userId: string): string {
  return `user_${userId}`;
}

function isDatasetNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /404|DatasetNotFound|No datasets/i.test(message);
}

export const cogneeAdapter = {
  // remember() — add text + cognify. Never throws — returns mock ID on failure.
  async remember(text: string, userId: string): Promise<string> {
    try {
      const addResult = await cogneeRequest<unknown>("/api/v1/add", "POST", {
        data: text,
        dataset_name: datasetName(userId),
      });

      let dataId = `item-${Date.now()}`;
      if (Array.isArray(addResult) && addResult.length > 0) {
        const first = addResult[0] as Record<string, string>;
        dataId = first.id ?? first.data_id ?? dataId;
      } else if (addResult && typeof addResult === "object") {
        const r = addResult as Record<string, string>;
        dataId = r.id ?? r.data_id ?? dataId;
      }

      // cognify runs async — catch separately so add() result is not lost
      cogneeRequest<unknown>("/api/v1/cognify", "POST", {
        datasets: [datasetName(userId)],
      }).catch((err) => console.warn("[Cognee] cognify failed (non-fatal):", err));

      return dataId;
    } catch (error) {
      // Never crash the pipeline — return a fallback ID
      console.warn("[Cognee] remember() failed, using fallback ID:", error);
      return `fallback-${Date.now()}`;
    }
  },

  // recall() — search Cognee. Returns [] on any error including 404 (no dataset yet).
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

      const result = await cogneeRequest<SearchItem[] | { results: SearchItem[] }>(
        "/api/v1/search",
        "POST",
        {
          query,
          search_type: "CHUNKS",
          datasets: [datasetName(userId)],
          limit,
        }
      );

      const raw: SearchItem[] = Array.isArray(result)
        ? result
        : (result as { results: SearchItem[] }).results ?? [];

      return raw.map((r, i) => ({
        id:      r.id      ?? `result-${i}`,
        content: r.text    ?? r.content ?? "",
        score:   r.score   ?? r.relevance ?? 0,
      }));
    } catch (error) {
      // 404 = no dataset yet (new user) — completely normal, return empty
      if (isDatasetNotFoundError(error)) return [];
      console.warn("[Cognee] recall() failed, returning []:", error);
      return [];  // never throw — caller gets empty results
    }
  },

  // forget() — delete one item. Silent on missing dataset.
  async forget(cogneeDataId: string, userId: string): Promise<void> {
    try {
      const datasets = await cogneeRequest<Array<{ id: string; name: string }>>(
        "/api/v1/datasets",
        "GET"
      );

      const dataset = datasets.find((d) => d.name === datasetName(userId));
      if (!dataset) return; // dataset doesn't exist — nothing to forget

      await cogneeRequest<unknown>(
        `/api/v1/datasets/${dataset.id}/data/${cogneeDataId}`,
        "DELETE"
      );
    } catch (error) {
      if (isDatasetNotFoundError(error)) return;
      console.warn("[Cognee] forget() failed (non-fatal):", error);
      // non-fatal — Postgres still archives the memory record
    }
  },

  // improve() — re-run cognify on dataset.
  async improve(userId: string): Promise<void> {
    try {
      await cogneeRequest<unknown>("/api/v1/cognify", "POST", {
        datasets: [datasetName(userId)],
      });
    } catch (error) {
      console.warn("[Cognee] improve() failed (non-fatal):", error);
    }
  },

  // forgetAll() — delete entire user dataset.
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
      console.warn("[Cognee] forgetAll() failed (non-fatal):", error);
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