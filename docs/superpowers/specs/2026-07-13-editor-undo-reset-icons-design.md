# Editor: Undo/Redo, Reset to Default, Empty Array Filter, Emoji→Icons

## Overview

Three enhancements to the Mindustry JSON editor:

1. **Undo/Redo** — history stack within `MindustryJsonEditor`, Ctrl+Z/Ctrl+Shift+Z, button in editor header
2. **Reset to Default** — per-field icon button that restores `parseDefault(field)` value
3. **Empty Array Filter** — `diffData` filters `(Array.isArray(v) && v.length === 0)` so empty lists don't appear in the preview panel
4. **Emoji to Material Icons** — replace all hand-typed emoji in Mindustry components with `<span class="material-symbols-outlined">icon_name</span>`

## Implementation

### 1. Undo/Redo (in mindustry-json-editor.jsx)

**State additions:**
```
this.state = {
    data: {...},
    collapsedSections: Set,
    undoStack: [data_snapshot, ...],   // max 50
    redoStack: [...]
};
```

**Snapshot trigger:** push `{...this.state.data}` to `undoStack` on:
- Array add/remove item
- Toggle boolean
- Select dropdown / content change
- Text input → debounced (300ms after last change, coalesce rapid keystrokes)
- Reset to default

**Undo (Ctrl+Z):** pop undoStack → push current data to redoStack → setState
**Redo (Ctrl+Shift+Z):** pop redoStack → push current data to undoStack → setState

**Focus guard:** `onFocus`/`onBlur` on the editor's root div, track `this.editorFocused`. Only process keyboard shortcut when `true`.

**UI:** An undo button (`undo` icon) in the section-rendering header or a dedicated top-right toolbar in the editor's card, next to the section title. The undo button is disabled when `undoStack.length === 0`.

### 2. Reset to Default

**Location:** Each field row gets a small icon button (`settings_backup_restore` icon) at the far right.

**Behavior:**
- On click: push current state to undoStack, then set field to `this.parseDefault(field)`
- Only shown in advanced mode? No — shown for all fields that have been changed (value !== default)
- But simpler to show always, as it's inexpensive

**Determining "changed":** Compare `currentValue` against `this.parseDefault(field)`. Simple reference equality for objects, else use `===`.

**In the render flow:** In both `renderField` (top-level fields) and `renderSubFieldControl` / `renderObjectField` (nested fields), add the reset button after the field control. For array/object fields, place it before the field content.

### 3. Empty Array Filter

**File:** `resolve-schema.js` in `diffData()`:

```js
for (const key of Object.keys(currentData)) {
    const v = currentData[key];
    if (Array.isArray(v) && v.length === 0) continue; // ← NEW
    const dv = defaults[key];
    ...
}
```

### 4. Emoji → Material Icons

**Font:** Import `material-symbols/outlined.css` in `mindustry.css`.

**Usage:** Replace `{S.removeBtn}` (= `✕`) with `<span class="material-symbols-outlined">close</span>` etc.

Mapping:

| Component | Emoji | Material Icon |
|---|---|---|
| json-editor S.emptyIcon (empty state) | 📝 | `edit_note` |
| json-editor S.notFoundIcon (no match) | ❓ | `search_off` |
| json-editor S.removeBtn (array remove) | ✕ | `close` |
| json-editor section collapse arrows | ▶ / ▼ | `chevron_right` / `expand_more` |
| json-editor reset button (NEW) | — | `settings_backup_restore` |
| searchable-select dropdown arrow | ▲ / ▼ | `expand_less` / `expand_more` |
| mod-editor tag remove | ✕ | `close` |
| asset-cards: modconfig | ⚙️ | `settings` |
| asset-cards: java | ☕ | `code` |
| asset-cards: default | 📄 | `description` |
| asset-cards: wall/block | 🧱 | `grid_view` |
| asset-cards: item/liquid | 💎 | `diamond` |
| asset-cards: turret/weapon | 🎯 | `ads_click` |
| asset-cards: bullet | 💥 | `explosion` |
| asset-cards: conveyor/duct | ⚙️ | `alt_route` |
| asset-cards: drill/pump | ⛏️ | `hardware` |
| asset-cards: generator/reactor | ⚡ | `bolt` |
| asset-cards: unit/factory | 🤖 | `smart_toy` |
| asset-cards: shield/force | 🛡️ | `shield` |
| asset-cards: ability | ✨ | `auto_awesome` |
| asset-cards: crafter | 🏭 | `factory` |
| asset-cards: bridge/massdriver | 📡 | `satellite_alt` |
| asset-cards: effect/weather | 🌊 | `water_drop` |
| asset-cards: sector | 🌍 | `public` |
| asset-cards: planet | 🪐 | `language` |
| asset-cards: team | 🏆 | `emoji_events` |

## Files Changed

| File | Changes |
|---|---|
| `packages/turbowarp/package.json` | Add `material-symbols` dep (done) |
| `mindustry.css` | Import material-symbols/outlined.css |
| `mindustry-json-editor.jsx` | Undo/redo state + keyboard handler + reset button + icon replacement |
| `mindustry-json-editor.css` | Styles for undo button + reset button |
| `searchable-select.jsx` | Dropdown arrow → Material Icons |
| `searchable-select.css` | Adjust icon alignment |
| `mod-editor.jsx` | ✕ → close icon |
| `mod-editor.css` | Adjust icon alignment |
| `mindustry-asset-cards.jsx` | All emoji → Material Icons |
| `mindustry-asset-cards.css` | Adjust icon font styling |
| `resolve-schema.js` | Empty array filter in diffData |
