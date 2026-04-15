import type { UiToPluginMessage, PluginToUiMessage, PluginNodeData, WriteResult } from "./types";

figma.showUI(__html__, { width: 320, height: 560, title: "Mimir" });

figma.ui.onmessage = async (msg: UiToPluginMessage) => {
  if (msg.type === "SCAN_SELECTION") {
    await handleScanSelection();
  } else if (msg.type === "WRITE_DESCRIPTIONS") {
    await handleWriteDescriptions(msg.items);
  }
};

async function handleScanSelection(): Promise<void> {
  const selection = figma.currentPage.selection;
  const nodes: PluginNodeData[] = [];

  for (const node of selection) {
    if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
      nodes.push({
        id: node.id,
        name: node.name,
        nodeType: node.type,
        existingDescription: node.description ?? "",
      });
    } else {
      nodes.push({
        id: node.id,
        name: node.name,
        nodeType: "UNSUPPORTED",
        existingDescription: "",
        skipReason: `Unsupported node type: ${node.type}`,
      });
    }
  }

  const response: PluginToUiMessage = { type: "SELECTION_RESULT", nodes };
  figma.ui.postMessage(response);
}

async function handleWriteDescriptions(
  items: Array<{ nodeId: string; finalDescription: string }>
): Promise<void> {
  const results: WriteResult[] = [];

  for (const item of items) {
    try {
      const node = await figma.getNodeByIdAsync(item.nodeId);
      if (!node) {
        results.push({ nodeId: item.nodeId, success: false, error: "Node not found" });
        continue;
      }
      if (node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
        results.push({ nodeId: item.nodeId, success: false, error: `Unexpected node type: ${node.type}` });
        continue;
      }
      node.description = item.finalDescription;
      results.push({ nodeId: item.nodeId, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ nodeId: item.nodeId, success: false, error: message });
    }
  }

  const response: PluginToUiMessage = { type: "WRITE_RESULT", results };
  figma.ui.postMessage(response);
}
