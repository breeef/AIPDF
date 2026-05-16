import type { NodeTypes } from "@xyflow/react";
import { KnowledgeNode } from "./KnowledgeNode";
import { DetailNode } from "./DetailNode";

export const nodeTypes: NodeTypes = {
  knowledge: KnowledgeNode,
  detail: DetailNode,
};
