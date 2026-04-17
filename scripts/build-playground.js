/**
 * Mimir — Playground File Builder
 *
 * Run this once inside the Mimir Plugin Playground Figma file to replace
 * the template content with Mimir-specific sections.
 *
 * HOW TO USE:
 *   1. Open the playground Figma file in Figma Desktop
 *   2. Plugins → Development → New Plugin → "Run once" (blank, no UI)
 *      - manifest.json: set "main": "build-playground.js", no "ui" field
 *      - or paste this code directly into an existing dev plugin's code.js
 *   3. Run the plugin — it clears the page and rebuilds all sections
 *   4. After running: add screenshots into the placeholder frames, then
 *      draw connector lines from annotation letters to the screenshot
 */

(async () => {
  const page = figma.currentPage;

  // ── 1. Clear existing template content ─────────────────────────────────────
  const existing = [...page.children];
  for (const node of existing) node.remove();

  // ── 2. Load fonts ──────────────────────────────────────────────────────────
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  // ── 3. Palette ─────────────────────────────────────────────────────────────
  const C = {
    dark:     { r: 0.09, g: 0.09, b: 0.11 },
    white:    { r: 1,    g: 1,    b: 1    },
    accent:   { r: 0.38, g: 0.49, b: 1    },
    grayBg:   { r: 0.95, g: 0.95, b: 0.97 },
    grayFill: { r: 0.83, g: 0.85, b: 0.90 },
    grayText: { r: 0.42, g: 0.45, b: 0.52 },
    dimText:  { r: 0.68, g: 0.70, b: 0.76 },
    darkCard: { r: 0.13, g: 0.15, b: 0.20 },
    orange:   { r: 0.90, g: 0.55, b: 0.20 },
  };

  // ── 4. Layout constants ────────────────────────────────────────────────────
  const W   = 1440;
  const PAD = 80;
  let   Y   = 0;
  const GAP = 80;

  // ── 5. Helpers ─────────────────────────────────────────────────────────────

  /** Create a top-level section frame and advance Y. */
  function section(name, height, bg) {
    const f = figma.createFrame();
    f.name = name;
    f.resize(W, height);
    f.x = 0; f.y = Y;
    f.fills = bg ? [{ type: 'SOLID', color: bg }] : [];
    f.clipsContent = true;
    page.appendChild(f);
    Y += height + GAP;
    return f;
  }

  /** Create a child frame inside a parent. */
  function box(parent, name, x, y, w, h, bg, radius) {
    const f = figma.createFrame();
    f.name = name;
    f.resize(w, h);
    f.x = x; f.y = y;
    f.fills = bg ? [{ type: 'SOLID', color: bg }] : [];
    if (radius) f.cornerRadius = radius;
    parent.appendChild(f);
    return f;
  }

  /** Create a text node inside a parent. maxW triggers fixed-width + auto-height. */
  function txt(parent, content, x, y, size, style, color, maxW) {
    const t = figma.createText();
    t.fontName  = { family: 'Inter', style: style || 'Regular' };
    t.fontSize  = size || 14;
    t.fills     = [{ type: 'SOLID', color: color || C.dark }];
    if (maxW) {
      t.textAutoResize = 'HEIGHT';
      t.resize(maxW, 40);
    }
    t.characters = content;
    t.x = x; t.y = y;
    parent.appendChild(t);
    return t;
  }

  /** A grey placeholder box with a centred description label. */
  function placeholder(parent, description, x, y, w, h) {
    const f = box(parent, description, x, y, w, h, C.grayFill, 8);
    const t = figma.createText();
    t.fontName = { family: 'Inter', style: 'Regular' };
    t.fontSize = 12;
    t.fills    = [{ type: 'SOLID', color: C.grayText }];
    t.textAlignHorizontal = 'CENTER';
    t.textAutoResize = 'HEIGHT';
    t.resize(w - 48, 40);
    t.characters = description;
    t.x = 24;
    t.y = Math.max(16, Math.round((h - t.height) / 2));
    f.appendChild(t);
    return f;
  }

  /** A filled circle chip with a letter/number. */
  function chip(parent, label, x, y, bg) {
    const f = box(parent, `chip-${label}`, x, y, 32, 32, bg || C.accent, 16);
    const t = figma.createText();
    t.fontName   = { family: 'Inter', style: 'Bold' };
    t.fontSize   = 13;
    t.fills      = [{ type: 'SOLID', color: C.white }];
    t.characters = label;
    t.x = label.length === 1 ? 10 : 6;
    t.y = 9;
    f.appendChild(t);
    return f;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — HERO
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = section('1 · Hero', 640, C.dark);

    // Tag pill
    const pill = box(s, 'pill', PAD, 80, 200, 30, C.accent, 15);
    txt(pill, 'MIMIR  ·  FIGMA PLUGIN', 16, 8, 10, 'Bold', C.white);

    txt(s, 'Find the right icon.\nEvery time.', PAD, 128, 60, 'Bold', C.white, 620);

    txt(s,
      'Mimir adds semantic tags to icon components so teams can find icons\n' +
      'with natural search terms — not just exact component names.\n' +
      'Without tagging them manually.',
      PAD, 316, 18, 'Regular', C.dimText, 560
    );

    placeholder(s,
      '[ SCREENSHOT: Mimir plugin panel open, scan complete, 6–8 result rows with component names ' +
      'and tag lists visible. Canvas behind shows a set of selected icon components. ]',
      W - PAD - 580, 60, 580, 520
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — HOW IT WORKS (6 steps)
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = section('2 · How It Works', 500, C.grayBg);

    txt(s, 'HOW IT WORKS', PAD, PAD, 11, 'Bold', C.accent);
    txt(s, 'Six steps from selection to searchable', PAD, PAD + 24, 34, 'Bold', C.dark, W - PAD * 2);

    const steps = [
      ['1', 'Select icons',    'Select icon components, component sets, or a mix of frames on your canvas.'],
      ['2', 'Open Mimir',      'Run the plugin. It scans your selection automatically and normalises each name.'],
      ['3', 'Review results',  'See matched names, confidence levels, and proposed semantic tags for each icon.'],
      ['4', 'Strip prefixes',  'Remove prefixes like "ic-" or "01-" to improve match quality. Saved per file.'],
      ['5', 'Choose mode',     'Merge (default) preserves existing descriptions. Append adds alongside them.'],
      ['6', 'Click Write',     'Tags saved to component descriptions. A changelog frame is created automatically.'],
    ];

    const stepW = Math.floor((W - PAD * 2 - 32 * 5) / 6);
    steps.forEach(([n, title, desc], i) => {
      const x = PAD + i * (stepW + 32);
      chip(s, n, x, 176);
      txt(s, title, x, 224, 14, 'Bold',    C.dark,     stepW);
      txt(s, desc,  x, 248, 12, 'Regular', C.grayText, stepW);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — PLUGIN UI BREAKDOWN
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = section('3 · Plugin UI Breakdown', 840, C.white);

    txt(s, 'PLUGIN BREAKDOWN', PAD, PAD, 11, 'Bold', C.accent);
    txt(s, "What you're looking at", PAD, PAD + 24, 34, 'Bold', C.dark, 560);
    txt(s,
      "Mimir's interface is designed to be fast to scan and safe to confirm before anything gets written.",
      PAD, PAD + 74, 16, 'Regular', C.grayText, 520
    );

    // Large plugin screenshot placeholder (left)
    placeholder(s,
      '[ SCREENSHOT: Full Mimir plugin panel — scan complete. 6–10 result rows. ' +
      'Each row: component name left, tag list right. ' +
      'Controls row at bottom: merge/append toggle, Low confidence checkbox, ' +
      'Prefix strip input + Re-match button, Write button. ]',
      PAD, 200, 620, 560
    );

    // Annotation callouts (right)
    const ax = PAD + 620 + 60;
    const aw = W - ax - PAD;

    const annos = [
      ['A', 'Result rows',
       'Each row shows the original component name and its proposed semantic tags. ' +
       'Low-confidence rows are visually separated below a divider.'],
      ['B', 'Low confidence toggle',
       'Low-confidence rows (fuzzy or prefix-adjusted matches) are excluded by default. ' +
       'Check "Low confidence" in the controls row to include them.'],
      ['C', 'Prefix strip input',
       "Type a naming prefix (e.g. 'ic-') to strip before re-matching. " +
       'The plugin saves it per file — you never re-enter it.'],
      ['D', 'Write controls',
       'Choose merge or append mode. Nothing is written until you click Write. Safe by default.'],
    ];

    annos.forEach(([letter, title, desc], i) => {
      const y = 200 + i * 136;
      chip(s, letter, ax, y);
      txt(s, title, ax + 44, y + 6,  14, 'Bold',    C.dark,     aw - 44);
      txt(s, desc,  ax + 44, y + 28, 13, 'Regular', C.grayText, aw - 44);
    });

    txt(s,
      '↑ After adding your screenshot, draw connector lines from each letter to the matching UI element.',
      ax, 760, 12, 'Regular', C.orange, aw
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — TRY IT OUT (real ComponentNodes Mimir can scan)
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = section('4 · Try It Out', 580, C.grayBg);

    txt(s, 'TRY IT YOURSELF', PAD, PAD, 11, 'Bold', C.accent);
    txt(s, 'Select these icons and run Mimir', PAD, PAD + 24, 34, 'Bold', C.dark, 700);
    txt(s,
      'Select all icon components below → Plugins → Mimir → the plugin scans and matches them in real time.',
      PAD, PAD + 74, 16, 'Regular', C.grayText, 700
    );

    // Demo icon components — named to match Phosphor dataset entries
    const icons = [
      'arrow-right',      // → ArrowRight
      'trash',            // → Trash
      'magnifying-glass', // → MagnifyingGlass
      'heart',            // → Heart
      'star',             // → Star
      'bell',             // → Bell
      'lock',             // → Lock
      'user',             // → User
    ];

    const SZ  = 88;
    const IGP = 20;

    icons.forEach((name, i) => {
      const x = PAD + i * (SZ + IGP);

      // Use createComponent so Mimir's plugin code sees a real ComponentNode
      const comp = figma.createComponent();
      comp.name   = name;
      comp.resize(SZ, SZ);
      comp.x = x;
      comp.y = 200;
      comp.fills = [{ type: 'SOLID', color: C.white }];
      comp.cornerRadius = 12;
      comp.strokes      = [{ type: 'SOLID', color: C.grayFill }];
      comp.strokeWeight = 1.5;
      comp.strokeAlign  = 'INSIDE';

      // Inner SVG placeholder
      const inner = figma.createFrame();
      inner.name   = 'svg-placeholder';
      inner.resize(SZ - 32, SZ - 32);
      inner.x = 16; inner.y = 16;
      inner.fills       = [{ type: 'SOLID', color: C.grayBg }];
      inner.cornerRadius = 4;
      comp.appendChild(inner);

      // Icon name label
      const lbl = figma.createText();
      lbl.fontName   = { family: 'Inter', style: 'Regular' };
      lbl.fontSize   = 10;
      lbl.fills      = [{ type: 'SOLID', color: C.grayText }];
      lbl.textAutoResize = 'HEIGHT';
      lbl.resize(SZ, 20);
      lbl.textAlignHorizontal = 'CENTER';
      lbl.characters = name;
      lbl.x = x;
      lbl.y = 200 + SZ + 8;
      s.appendChild(lbl);

      s.appendChild(comp);
    });

    // Instruction card
    const card = box(s, 'Instructions', PAD, 360, W - PAD * 2, 148, C.darkCard, 12);
    txt(card,
      '①  Select all 8 icon components above\n' +
      '②  Plugins → Development → Mimir\n' +
      '③  Scan runs automatically — review the matched tags\n' +
      '④  Click Write Descriptions to save tags to component descriptions',
      32, 24, 14, 'Regular', { r: 0.85, g: 0.87, b: 0.95 }, W - PAD * 2 - 64
    );
    txt(card,
      'Tip: type "magnifying-" in the prefix strip field and click Re-match to see prefix stripping in action.',
      32, 108, 12, 'Regular', C.dimText, W - PAD * 2 - 64
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — BEFORE & AFTER
  // ══════════════════════════════════════════════════════════════════════════
  {
    const s = section('5 · Before & After', 520, C.white);

    txt(s, 'BEFORE & AFTER', PAD, PAD, 11, 'Bold', C.accent);
    txt(s, 'What Mimir writes to a component description', PAD, PAD + 24, 34, 'Bold', C.dark, W - PAD * 2);

    const colW = Math.floor((W - PAD * 2 - 48) / 2);

    // Before card
    const before = box(s, 'Before', PAD, 190, colW, 248, C.grayBg, 12);
    txt(before, 'BEFORE', 28, 28, 10, 'Bold', C.grayText);
    txt(before, 'trash', 28, 52, 22, 'Bold',    C.dark,    colW - 56);
    txt(before, '(no description)', 28, 86, 14, 'Regular', C.dimText, colW - 56);
    placeholder(before,
      '[ SCREENSHOT: Figma right panel — component description field empty or showing terse original text ]',
      28, 126, colW - 56, 88
    );

    // After card
    const after = box(s, 'After', PAD + colW + 48, 190, colW, 248, C.dark, 12);
    txt(after, 'AFTER', 28, 28, 10, 'Bold', C.accent);
    txt(after, 'trash', 28, 52, 22, 'Bold', C.white, colW - 56);
    txt(after,
      'delete, remove, bin, dustbin, waste, clear, discard, recycle',
      28, 86, 13, 'Regular', C.dimText, colW - 56
    );
    txt(after,
      '(mimir 1.0.0 · added: 2026-04-16 10:01 am)\n______________',
      28, 140, 11, 'Regular', { r: 0.32, g: 0.36, b: 0.48 }, colW - 56
    );
    placeholder(after,
      '[ SCREENSHOT: Figma right panel — same component, description now shows semantic tags + Mimir metadata block ]',
      28, 186, colW - 56, 44
    );

    txt(s,
      'After writing, Figma\'s component search will surface \u201ctrash\u201d when users type ' +
      '\u201cdelete\u201d, \u201cbin\u201d, \u201cremove\u201d, or \u201cdustbin\u201d \u2014 without anyone tagging it manually.',
      PAD, 464, 14, 'Regular', C.grayText, W - PAD * 2
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Done
  // ══════════════════════════════════════════════════════════════════════════
  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.closePlugin(
    '✅ Mimir playground file built! ' +
    'Next: add screenshots into placeholder frames, draw connector lines in Section 3, then publish.'
  );
})();
