export type PaperStatus = "uploading" | "parsing" | "generating" | "ready" | "error";

export interface Paper {
  id: string;
  original_title: string;
  short_title: string | null;
  status: PaperStatus;
  error_message?: string | null;
  created_at: string;
}

export type NodeType = "input" | "module" | "mechanism" | "output" | "hyperparam" | "phase" | "detail";

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  input: "输入",
  module: "模块",
  mechanism: "机制",
  output: "输出",
  hyperparam: "超参数",
  phase: "阶段",
  detail: "详解",
};

export interface FontStyle {
  fontSize?: string;
  letterSpacing?: string;
  fontFamily?: string;
  color?: string;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  color: string;
  position_x: number;
  position_y: number;
  page_ref?: string | null;
  width?: number;
  importance?: number;
  label_style?: Record<string, string> | null;
  desc_style?: Record<string, string> | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  id: string;
  paper_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  version: number;
}

export interface GraphDiff {
  add_nodes: GraphNode[];
  remove_nodes: string[];
  update_nodes: Record<string, unknown>[];
  add_edges: GraphEdge[];
  remove_edges: string[];
  update_edges: Record<string, unknown>[];
  explanation: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  diff?: GraphDiff | null;
  suggestions?: string[];
}

export interface AppSettings {
  llm_provider: string;
  openai_base_url: string;
  openai_api_key: string;
  llm_model: string;
  graph_model: string;
  graph_thinking: boolean;
  chat_model: string;
  chat_thinking: boolean;
  title_model: string;
  title_thinking: boolean;
  translate_model: string;
  translate_thinking: boolean;
  explain_model: string;
  explain_thinking: boolean;
}
