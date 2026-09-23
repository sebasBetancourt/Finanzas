const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:3001";

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const method = options.method?.toUpperCase() || "GET";
  const hasBody = options.body !== undefined && options.body !== null;

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (hasBody || (method !== "DELETE" && method !== "GET" && method !== "HEAD")) {
    headers["Content-Type"] = "application/json";
  }

  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, { ...options, headers, cache: options.cache || "no-store" });

  if (!res.ok) {
    const errorText = await res.text();
    let message = errorText || `Error ${res.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      message = errorJson.message || errorJson.error?.message || message;
    } catch {
      /* keep */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined;

  const resJson = await res.json();
  if (resJson && typeof resJson === "object" && "data" in resJson) {
    return resJson.data;
  }
  return resJson;
};
