# Editor Components

## Main Component: `mindustry-json-editor.jsx` (1253 lines)
React class component. Key rendering flow:

### Field Rendering
1. `render()` → `renderSection()` → `renderField()`
2. `renderField()` checks field type and delegates:
   - `enum` → `renderSearchableSelect()`
   - `forceTeam` → team color selector (特殊处理)
   - `int/float` → number input (size → special size selector)
   - `REFERENCE_TYPES` / `research` → `renderContentSelect()` (内容搜索下拉)
   - `array` → `renderArrayField()`
   - `object` → `renderObjectEditor()`
   - `boolean` → checkbox
   - default → text input

### Key References
- `REFERENCE_TYPES` (line 49-53): Set of content type names
- `ENUM_VALUES` (line 14-23): Hardcoded enum options keyed by field name
- `ENHANCED_RESEARCH` (line 49-67): Research field sub-field overrides: `parent` (all content types, localizedName: '父节点') + `objectives` (custom type-discriminated array) + `requirements` (StackRequirement array) + `root`/`requiresUnlock` (booleans with localizedName)
- `RESEARCH_CONTENT_TYPES` (line 48): Filter categories for research-related fields: Block, Item, Liquid, UnitType, SectorPreset, Planet
- `OBJECTIVE_TYPE_DEFS` (line 24-50): 5 objective types (Produce/Research/SectorComplete/OnSector/OnPlanet) each with type-specific sub-fields
- `renderObjectivesArray()`: Custom array renderer for `objectives` — type dropdown + dynamic sub-fields based on selected type. Handles backward-compatible string items with convert-to-object button.

### renderSearchableSelect
- Portaled dropdown on document.body
- Search input for filtering
- Smart up/down orientation
- Selected item shows in trigger display

### renderContentSelect
- Filters VANILLA_CONTENT + mod assets by field.type
- Exception: `research` shows ALL content types
- Searchable dropdown

### renderArrayField
- For array of objects: shows nested field rows
- For array of primitives: shows list with add/remove
- `renderSubFieldControl(enhanced, subValue, onChange, subCkey, parentFieldName)` — 5th param `parentFieldName` identifies the parent object field (e.g., `'research'`)
- When `name === 'parent' && parentFieldName === 'research'`: shows all researchable content (Block/Item/Liquid/UnitType/SectorPreset/Planet) with category filter tabs via SearchableSelect
- Intercepts `name === 'objectives'` before generic array handling

### renderObjectivesArray
- Type-discriminated renderer for `objectives` array
- Two entry points: top-level (`renderField`) and nested under research (`renderSubFieldControl`)
- Each item shows type `<select>` and sub-fields matching selected type only
- String items (legacy format) shown as text input with convert button
- **Bug history**: `getFieldLabel()` used to return field name as fallback, overriding `sf.localizedName` in `||` chain. Fixed: `getFieldLabel` now returns `null` when no zh_CN match found.

## Label Resolution Order
`getFieldLabel(type, fieldName)` walks parentType chain:
1. Check zh_CN for field's localizedName
2. If not found, check parent type
3. Returns `null` if not found anywhere (changed from returning fieldName)
4. Main field label: `getFieldLabel() || field.name`
5. Array subfield label: `getFieldLabel() || sf.localizedName || sf.name`

## forceTeam Special Selector
- Shows 256 teams (0-255) + -1 (默认)
- Team 0-6 have fixed names/colors from Mindustry Team.java
- Team 7-255 use exact Mindustry xorshift128+ RNG with seed=8 for colors
- Color applied as text color (color property on option)
- `-1` represents "use default team"
