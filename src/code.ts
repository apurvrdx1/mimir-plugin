import type {
  UiToPluginMessage,
  PluginToUiMessage,
  PluginNodeData,
  WriteResult,
  ChangelogEntry,
  ChangelogMeta,
} from "./types";

figma.showUI(__html__, { width: 320, height: 560, title: "Mimir" });

figma.ui.onmessage = async (msg: UiToPluginMessage) => {
  if (msg.type === "SCAN_SELECTION") {
    await handleScanSelection();
  } else if (msg.type === "WRITE_DESCRIPTIONS") {
    await handleWriteDescriptions(msg.items);
  } else if (msg.type === "CREATE_CHANGELOG") {
    await handleCreateChangelog(msg.entries, msg.meta);
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

async function handleCreateChangelog(
  entries: ChangelogEntry[],
  meta: ChangelogMeta
): Promise<void> {
  try {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });

    // Find or create the changelog page
    let page = figma.root.children.find(
      (p): p is PageNode => p.type === "PAGE" && p.name === "mimir changelog"
    );
    if (!page) {
      page = figma.createPage();
      page.name = "mimir changelog";
    }
    // Must load the page before accessing its children
    await page.loadAsync();

    // Layout constants
    const FRAME_WIDTH = 420;
    const FRAME_GAP = 100;
    const PADDING = 16;
    const COL_COMPONENT = 120;
    const COL_GAP = 8;
    const COL_TAGS = FRAME_WIDTH - PADDING * 2 - COL_COMPONENT - COL_GAP;

    // X position: place to the right of the rightmost existing frame
    let xPos = 0;
    for (const node of page.children) {
      const right = node.x + node.width + FRAME_GAP;
      if (right > xPos) xPos = right;
    }

    // Create the write frame (vertical auto-layout, fixed 420px wide)
    const frameLabel = `mimir write · ${meta.date} ${meta.time}`;
    const writeFrame = figma.createFrame();
    page.appendChild(writeFrame);
    writeFrame.name = frameLabel;
    writeFrame.resize(FRAME_WIDTH, 100);
    writeFrame.x = xPos;
    writeFrame.y = 0;
    writeFrame.layoutMode = "VERTICAL";
    writeFrame.primaryAxisSizingMode = "AUTO";
    writeFrame.counterAxisSizingMode = "FIXED";
    writeFrame.paddingTop = PADDING;
    writeFrame.paddingBottom = PADDING;
    writeFrame.paddingLeft = PADDING;
    writeFrame.paddingRight = PADDING;
    writeFrame.itemSpacing = 6;
    writeFrame.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];

    // Title
    const titleNode = figma.createText();
    writeFrame.appendChild(titleNode);
    titleNode.fontName = { family: "Inter", style: "Medium" };
    titleNode.fontSize = 12;
    titleNode.characters = frameLabel;
    titleNode.layoutSizingHorizontal = "FILL";
    titleNode.fills = [{ type: "SOLID", color: { r: 0.1, g: 0.1, b: 0.1 } }];

    // Meta line
    const metaNode = figma.createText();
    writeFrame.appendChild(metaNode);
    metaNode.fontName = { family: "Inter", style: "Regular" };
    metaNode.fontSize = 11;
    metaNode.characters = `mode: ${meta.writeMode} · source: ${meta.source} · ${meta.totalWritten} written · v${meta.pluginVersion}`;
    metaNode.layoutSizingHorizontal = "FILL";
    metaNode.fills = [{ type: "SOLID", color: { r: 0.45, g: 0.45, b: 0.45 } }];

    // Separator line
    const sep = figma.createFrame();
    writeFrame.appendChild(sep);
    sep.name = "separator";
    sep.resize(FRAME_WIDTH - PADDING * 2, 1);
    sep.layoutSizingHorizontal = "FILL";
    sep.layoutSizingVertical = "FIXED";
    sep.fills = [{ type: "SOLID", color: { r: 0.88, g: 0.88, b: 0.88 } }];

    // Table rows
    for (const entry of entries) {
      const rowFrame = figma.createFrame();
      writeFrame.appendChild(rowFrame);
      rowFrame.name = entry.componentName;
      rowFrame.layoutMode = "HORIZONTAL";
      rowFrame.primaryAxisSizingMode = "FIXED";
      rowFrame.counterAxisSizingMode = "AUTO";
      rowFrame.counterAxisAlignItems = "MIN";
      rowFrame.layoutSizingHorizontal = "FILL";
      rowFrame.itemSpacing = COL_GAP;
      rowFrame.fills = [];

      // Component name column — fixed 120px, single line, truncated
      const compText = figma.createText();
      rowFrame.appendChild(compText);
      compText.fontName = { family: "Inter", style: "Regular" };
      compText.fontSize = 11;
      compText.characters = entry.componentName;
      compText.resize(COL_COMPONENT, compText.height);
      compText.textAutoResize = "NONE";
      compText.textTruncation = "ENDING";
      compText.layoutSizingHorizontal = "FIXED";
      compText.layoutSizingVertical = "FIXED";
      compText.fills = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];

      // Tags column — fills remaining width, wraps text
      const tagsText = figma.createText();
      rowFrame.appendChild(tagsText);
      tagsText.fontName = { family: "Inter", style: "Regular" };
      tagsText.fontSize = 11;
      tagsText.characters = entry.tags.join(", ");
      tagsText.resize(COL_TAGS, tagsText.height);
      tagsText.textAutoResize = "HEIGHT";
      tagsText.layoutSizingHorizontal = "FILL";
      tagsText.layoutSizingVertical = "HUG";
      tagsText.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
    }

    // Navigate to the changelog page
    figma.currentPage = page;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    figma.notify(`Could not create changelog: ${message}`, { error: true });
  }
}
