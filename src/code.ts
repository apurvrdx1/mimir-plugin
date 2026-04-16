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
    if (!Array.isArray(msg.items)) {
      figma.notify("Internal error: invalid write payload", { error: true });
      return;
    }
    await handleWriteDescriptions(msg.items);
  } else if (msg.type === "CREATE_CHANGELOG") {
    if (!Array.isArray(msg.entries) || !Array.isArray(msg.unchangedEntries) || !msg.meta) {
      figma.notify("Internal error: invalid changelog payload", { error: true });
      return;
    }
    await handleCreateChangelog(msg.entries, msg.unchangedEntries, msg.meta);
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

  // Notify on write failures before sending result to UI
  const errorCount = results.filter((r) => !r.success).length;
  if (errorCount > 0) {
    if (errorCount === results.length) {
      figma.notify("Write failed — check that you have edit access to this file", { error: true });
    } else {
      figma.notify(`${errorCount} of ${results.length} writes failed — check edit access`, { error: true });
    }
  }

  const response: PluginToUiMessage = { type: "WRITE_RESULT", results };
  figma.ui.postMessage(response);
}

async function handleCreateChangelog(
  entries: ChangelogEntry[],
  unchangedEntries: ChangelogEntry[],
  meta: ChangelogMeta
): Promise<void> {
  // Nothing to record (all writes failed upstream)
  if (entries.length === 0 && unchangedEntries.length === 0) return;

  const originalPage = figma.currentPage;

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
    await page.loadAsync();

    // Navigate to changelog page so createFrame()/createText() attach there
    await figma.setCurrentPageAsync(page);

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

    // Main write frame (vertical auto-layout, fixed 420px wide)
    const frameLabel = `mimir write · ${meta.date} ${meta.time}`;
    const writeFrame = figma.createFrame();
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

      // Row separator
      const rowSep = figma.createFrame();
      writeFrame.appendChild(rowSep);
      rowSep.name = "row-sep";
      rowSep.resize(FRAME_WIDTH - PADDING * 2, 1);
      rowSep.layoutSizingHorizontal = "FILL";
      rowSep.layoutSizingVertical = "FIXED";
      rowSep.fills = [{ type: "SOLID", color: { r: 0.93, g: 0.93, b: 0.93 } }];
    }

    // "No changes" section — items whose tags were already up to date
    if (unchangedEntries.length > 0) {
      const noChangeHeader = figma.createText();
      writeFrame.appendChild(noChangeHeader);
      noChangeHeader.fontName = { family: "Inter", style: "Regular" };
      noChangeHeader.fontSize = 10;
      noChangeHeader.characters = "No changes — tags already up to date";
      noChangeHeader.setRangeFontName(0, 10, { family: "Inter", style: "Medium" });
      noChangeHeader.layoutSizingHorizontal = "FILL";
      noChangeHeader.fills = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];

      const namesNode = figma.createText();
      writeFrame.appendChild(namesNode);
      namesNode.fontName = { family: "Inter", style: "Regular" };
      namesNode.fontSize = 11;
      namesNode.characters = unchangedEntries.map((e) => e.componentName).join(", ");
      namesNode.resize(FRAME_WIDTH - PADDING * 2, namesNode.height);
      namesNode.textAutoResize = "HEIGHT";
      namesNode.layoutSizingHorizontal = "FILL";
      namesNode.layoutSizingVertical = "HUG";
      namesNode.fills = [{ type: "SOLID", color: { r: 0.15, g: 0.15, b: 0.15 } }];
    }

    // Return to the user's original page immediately
    await figma.setCurrentPageAsync(originalPage);

    // Success notification — persists until dismissed so user can click the button
    const capturedPage = page;
    const capturedFrame = writeFrame;
    if (entries.length > 0) {
      const taggedPart = `✓ ${entries.length} icon${entries.length !== 1 ? "s" : ""} tagged`;
      const unchangedPart = unchangedEntries.length > 0
        ? ` · ${unchangedEntries.length} unchanged`
        : "";
      figma.notify(taggedPart + unchangedPart, {
        timeout: Infinity,
        button: {
          text: "View changelog",
          action: () => {
            figma.setCurrentPageAsync(capturedPage).then(() => {
              figma.viewport.scrollAndZoomIntoView([capturedFrame]);
            }).catch(() => {});
          },
        },
      });
    } else {
      // All unchanged — brief informational toast, no button needed
      figma.notify(
        `All ${unchangedEntries.length} icon${unchangedEntries.length !== 1 ? "s" : ""} already up to date`
      );
    }
  } catch (err) {
    // Best-effort return to original page before surfacing the error
    try { await figma.setCurrentPageAsync(originalPage); } catch (_) {}
    const message = err instanceof Error ? err.message : String(err);
    figma.notify(`Could not create changelog: ${message}`, { error: true });
  }
}
