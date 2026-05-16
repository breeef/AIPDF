import type { AppSettings, ChatMessage, GraphData, GraphDiff, GraphNode, GraphEdge, Paper } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function uploadPaper(file: File): Promise<Paper> {
  const form = new FormData();
  form.append("file", file);
  return request<Paper>("/api/papers", { method: "POST", body: form });
}

export async function listPapers(): Promise<Paper[]> {
  return request<Paper[]>("/api/papers");
}

export async function getPaper(id: string): Promise<Paper> {
  return request<Paper>(`/api/papers/${id}`);
}

export async function getGraph(paperId: string): Promise<GraphData> {
  return request<GraphData>(`/api/papers/${paperId}/graph`);
}

export async function saveGraph(
  paperId: string,
  nodes: GraphNode[],
  edges: GraphEdge[]
): Promise<GraphData> {
  return request<GraphData>(`/api/papers/${paperId}/graph`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodes, edges }),
  });
}

export async function sendChatMessage(
  paperId: string,
  message: string,
  selectedNodeIds: string[]
): Promise<{ role: string; content: string; diff: GraphDiff | null; suggestions?: string[] }> {
  return request(`/api/papers/${paperId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, selected_node_ids: selectedNodeIds }),
  });
}

export async function getSuggestions(
  paperId: string
): Promise<{ questions: string[] }> {
  return request<{ questions: string[] }>(`/api/papers/${paperId}/chat/suggestions`);
}

export async function getChatHistory(
  paperId: string
): Promise<{ messages: ChatMessage[] }> {
  return request(`/api/papers/${paperId}/chat`);
}

export function getPdfUrl(paperId: string): string {
  return `${API}/api/papers/${paperId}/pdf`;
}

export async function retryPaper(paperId: string): Promise<Paper> {
  return request<Paper>(`/api/papers/${paperId}/retry`, { method: "POST" });
}

export async function deletePaper(paperId: string): Promise<void> {
  await request(`/api/papers/${paperId}`, { method: "DELETE" });
}

export async function getSettings(): Promise<AppSettings> {
  return request<AppSettings>("/api/settings");
}

export async function updateSettings(
  updates: Partial<AppSettings & { openai_api_key: string }>
): Promise<AppSettings> {
  return request<AppSettings>("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function translateText(
  text: string
): Promise<{ translation: string }> {
  return request<{ translation: string }>("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export async function explainText(
  paperId: string,
  text: string
): Promise<{ title: string; description: string }> {
  return request<{ title: string; description: string }>("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, paper_id: paperId }),
  });
}
