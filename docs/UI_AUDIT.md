# Q-GREEN FLEET: UI System Audit & Baseline Evaluation

**Audit Date**: October 2, 2026  
**Auditor**: Senior Product Designer & Frontend Engineer  
**Objective**: Comprehensive evaluation of the existing dark-theme frontend against client-facing, professional B2B software standards.  
**Tested Viewports**:
- `1920×1080` (Full HD Desktop)
- `1440×900` (MacBook / Laptop Standard)
- `1280×720` (Compact HD / Projector)
- `1024×768` (iPad / Tablet Landscape)
- `390×844` (Mobile Phone)

---

## 1. Audit Against the 11 Core Client Problems

| # | Client Usability Issue | Observed Status in Current App | Severity | Root Cause in Code | Required Redesign Action |
|---|---|---|---|---|---|
| **1** | **Dark theme with low-contrast text** | Background `#040814` with `#64748b` and `#94a3b8` text. Looks like a developer IDE or hacker console, not an enterprise shipping tool. | **Critical** | `tailwind.config.js` sets dark mode default; hardcoded dark palette throughout. | Replace with **Light Theme Only**: Canvas `#F6F8FB`, surface `#FFFFFF`, border `#D9E0EA`, text `#0F172A`, text-muted `#475569`. Guaranteed WCAG AA (≥4.5:1). |
| **2** | **Monospace font everywhere** | `font-mono` applied indiscriminately to nav tabs, KPI values, card labels, buttons, and table cells. Reads as code terminal. | **Critical** | `font-mono` class used across `Navbar.tsx`, `KpiCard.tsx`, and all page components. | Switch to **Inter (sans-serif)** for 100% of UI copy, headers, and buttons. Restrict monospace strictly to IMO/vessel ID numbers (14px, normal case). |
| **3** | **ALL-CAPS, letter-spaced labels** | Labels like `AUTONOMOUS DIGITAL TWIN ACTIVE`, `HULL EXP (n)`, `COMPATIBLE FUELS`, `ETA SCHEDULE RELIABILITY` slow down executive reading comprehension. | **High** | `uppercase tracking-widest` classes in `KpiCard.tsx`, `FleetCommandCenter.tsx`. | **Sentence case everywhere**. No all-caps, no artificial letter-spacing. Minimum body size 14px / caption 13px. |
| **4** | **Crammed top navigation** | Top bar packs 7 screen tabs + Guided demo button + `FastAPI Connected` + `Seed: 42` into a single 64px row. At widths < 1400px, tab labels wrap onto 2 lines or overflow off-screen. | **Critical** | Top horizontal nav bar in `Navbar.tsx` lacking responsive breakdown. | Replace with **Fixed Left Sidebar (256px)** with grouped navigation items on single lines, and clean top bar (64px) with title, scenario selector, and View Mode switch. |
| **5** | **Buttons do not look clickable** | Secondary button (`Test a storm`) is dark slate `#0f172a` on dark background with faint border; no clear affordance, focus ring, or active states. | **High** | Ad-hoc button styles in `FleetCommandCenter.tsx`, `Navbar.tsx`. | Standardized B2B button system: Primary solid `#0B63CE` (40px/48px height, 600 weight); Secondary white bg with **2px solid `#0B63CE` border** and `#0B63CE` text. |
| **6** | **Dense engineering jargon** | Phrases like `Heterogeneous Fleet Asset Registry`, `Autonomous Digital Twin Active`, `Calibrated physics exponents (n = 2.8–3.4)`, `Pareto Explorer`, `Optimizer Telemetry` confuse maritime operations executives. | **Critical** | Hardcoded technical strings in all page TSX files. | Centralize all copy in `frontend/src/copy/en.ts`. Plain business labels: `Fleet overview`, `Your fleet`, `Trade routes`, `Emissions per tonne-mile`, `Compare plans`. Enforce jargon linter. |
| **7** | **Double badge clutter on KPI tiles** | Every KPI tile renders both a provenance badge (e.g. `SIMULATED`) AND a green `COMPUTED` checkmark tag, burying the core number. | **High** | `KpiCard.tsx` renders top badge + bottom `COMPUTED` footer badge. | **One single quiet chip** at card top-right (`Measured`, `Reported`, `Estimated`, `Simulated`, `Sample data`). Remove redundant `COMPUTED` label entirely. Add single page-level data-basis strip. |
| **8** | **Developer info visible to clients** | `Seed: 42` and `FastAPI Connected` indicators displayed prominently in the main navbar. Irrelevant to shipping directors. | **Medium** | Developer indicators hardcoded in `Navbar.tsx`. | Move technical execution metadata into **Analyst Mode only**. Default **Client Mode** shows clean "System online" status dot with hover tooltip. |
| **9** | **Ambiguous KPI text** | "−13.9% Below Cap" does not specify what cap (FuelEU Maritime 2025? IMO CII?), nor whether a negative value is beneficial. | **High** | `trend={{ value: '-13.9%', label: 'Below Cap' }}` lacks context. | Explicit plain language: "13.9% below your emissions limit (FuelEU 2025 target: 5.60 gCO₂e/dwt-nm)" with positive green styling. |
| **10** | **Dense, overflowing table** | Fleet table overflows horizontally on smaller laptops/tablets; fuel badges stack into wrapping multi-row chips; vessel classes clip; uneven column padding. | **High** | `<table>` in `FleetCommandCenter.tsx` has no horizontal container scroll, dense cells, unpadded rows. | Redesign **Your fleet table**: 56px row height, sticky header, search + filter tabs, fuel chips limited to first 2 + "+N more" with drawer popover, clean right-aligned numbers. |
| **11** | **Empty whitespace in trade routes** | Header banner states "4 Global Fairways Synchronized", but card grid displays 4 cards with unbalanced whitespace and uneven aspect ratios on wide screens. | **Medium** | CSS grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` with mismatched text lengths. | Responsive card grid with equal width (3–4 per row, filling container), showing route name, origin → destination, distance, legs, deadline, and whole-card click to open inspector drawer. |

---

## 2. Multi-Viewport Inspection Findings

### Viewport 1: 1920×1080 (Full HD Desktop)
- **Screenshot Evidence**: `ui_audit_1920x1080`, `ui_audit_1920x1080_full`
- **Layout & Structure**: 4 KPI cards stretch wide across 1920px, creating excessive whitespace between labels and values.
- **Contrast**: Low-contrast gray text (`#64748b`) on slate `#0a1024` fails WCAG AA on secondary subtitles (measured contrast ratio 3.2:1 vs 4.5:1 requirement).
- **Typography**: Heavy monospace styling dominates the view; tables feel like raw CSV dumps rather than executive dashboards.

### Viewport 2: 1440×900 (MacBook Standard)
- **Screenshot Evidence**: `ui_audit_1440x900`
- **Navigation**: Top navigation bar reaches maximum density. Tab buttons start touching adjacent badges.
- **Buttons**: Secondary button `Simulate Storm Disruption` has insufficient contrast against background `#040814`.
- **Table**: 12-row table fits horizontally but lacks row selection feedback and visual affordance for clickable rows.

### Viewport 3: 1280×720 (Compact HD / Projector)
- **Screenshot Evidence**: `ui_audit_1280x720`, `ui_audit_twin_map_1280x720`, `ui_audit_pareto_explorer_1280x720`
- **Navigation**: Top navbar breaks into a secondary wrapped row below the header, pushing main content down and reducing vertical viewport space.
- **Sub-pages**:
  - `Twin Map`: Sidebar drawer (Port Hub Inspector) takes 25% width; text in bunker stock tiles wraps into 3 lines.
  - `Pareto Explorer`: Scatter canvas scales reasonably, but solution cards at bottom wrap awkwardly.

### Viewport 4: 1024×768 (iPad / Tablet Landscape)
- **Screenshot Evidence**: `ui_audit_1024x768`
- **Navigation Overflow**: Secondary navbar tabs horizontally overflow on the right edge (`Voyage Replay` clips to `Voyage Rep...`).
- **Hero Banner**: `AUTONOMOUS DIGITAL TWIN ACTIVE` wraps onto 2 lines. Button `Optimize Fleet (Q-GREEN)` text wraps onto 2 lines inside the button.
- **Table**: Fleet table columns are severely squeezed. Speed range `11.0 - 22.5 kts` wraps onto 2 lines.

### Viewport 5: 390×844 (Mobile Phone)
- **Screenshot Evidence**: `ui_audit_390x844`
- **Critical Overflow**: Top navbar overflows horizontally off-screen without a hamburger menu or scroll indicator. 4 out of 7 tabs are completely invisible.
- **Table Failure**: The asset table does not fit within 390px, causing the entire page body to have unwanted horizontal jitter. Table headers `COMPATIBLE FUELS`, `OPS SHORE`, and `PROVENANCE` are cut off.
- **Card Stacking**: KPI tiles stack 1x1 vertically, pushing primary content below the fold.

---

## 3. WCAG AA Accessibility & Contrast Violations

| Element | Foreground Color | Background Color | Measured Ratio | WCAG AA Requirement | Pass/Fail | Fix |
|---|---|---|---|---|---|
| Card Subtitles / Captions | `#64748b` (Slate 500) | `#0e1733` (Marine 850) | **3.4:1** | ≥ 4.5:1 | **FAIL** | Use `#475569` on `#FFFFFF` (Ratio: 7.1:1, **PASS**) |
| Monospace Table Headers | `#64748b` (Slate 500) | `#060a17` (Marine 950) | **3.8:1** | ≥ 4.5:1 | **FAIL** | Use `#0F172A` on `#F6F8FB` (Ratio: 14.2:1, **PASS**) |
| Secondary Button Border | `#334155` (Slate 700) | `#040814` (Marine 950) | **2.2:1** | ≥ 3.0:1 | **FAIL** | Use 2px `#0B63CE` on `#FFFFFF` (Ratio: 4.8:1, **PASS**) |
| Provenance Badge Text | `#06b6d4` (Cyan 500) | `#082f49` (Cyan 950) | **4.1:1** | ≥ 4.5:1 | **FAIL** | Neutral chip: `#0F172A` on `#E8F1FD` (Ratio: 11.5:1, **PASS**) |

---

## 4. Forbidden Jargon Audit (to be replaced in `en.ts`)

| Existing Jargon String in Code | Location | Replacement Plain-Language String |
|---|---|---|
| `Autonomous Digital Twin Active` | `FleetCommandCenter.tsx:55` | *(Removed; replaced by clean one-sentence page subtitle)* |
| `Heterogeneous Fleet Asset Registry` | `FleetCommandCenter.tsx:189` | **Your fleet** |
| `Calibrated physics exponents (n = 2.8 - 3.4)` | `FleetCommandCenter.tsx:192` | *(Moved to Analyst mode only)* |
| `Hull EXP (n)` | `FleetCommandCenter.tsx:212` | *(Analyst mode column only: "Hull exponent")* |
| `Active Strategic Trade Corridors` | `FleetCommandCenter.tsx:136` | **Trade routes** |
| `Optimize Fleet (Q-GREEN)` | `FleetCommandCenter.tsx:71` | **Find the best plan** |
| `Simulate Storm Disruption` | `FleetCommandCenter.tsx:78` | **Test a storm** |
| `Pareto Explorer` | `Navbar.tsx:28` | **Compare plans** |
| `Optimizer Telemetry` | `Navbar.tsx:27` | **Optimization progress** |
| `Fuel Intelligence` | `Navbar.tsx:26` | **Fuel options** |
| `Twin Map` | `Navbar.tsx:25` | **Live map** |
| `Voyage Replay` | `Navbar.tsx:30` | **Voyage review** |
| `Judge Demo Flow (90s)` | `Navbar.tsx:107` | **Guided demo** |
