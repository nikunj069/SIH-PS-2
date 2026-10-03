# UI Audit Report

This document contains the results of the grep-based discovery for legacy dark-theme styling patterns in the `frontend/src` directory.

## Legacy Pattern Occurrences

| Pattern | Files Affected | Approximate Count |
|---------|---------------|-------------------|
| `text-white`, `text-cyan-*`, `text-slate-[1-5]00`, `text-gray-[1-5]00` | VoyageReplay.tsx, DigitalTwinMap.tsx, StormSimulator.tsx, ParetoExplorer.tsx, OptimizerTelemetry.tsx, FuelIntelligence.tsx, Sidebar.tsx, Navbar.tsx, Tooltip.tsx | ~232 occurrences |
| `bg-black`, `bg-slate-[7-9]00`, `bg-gray-[7-9]00`, `bg-opacity-*` | VoyageReplay.tsx, DigitalTwinMap.tsx, StormSimulator.tsx, ParetoExplorer.tsx, OptimizerTelemetry.tsx, FuelIntelligence.tsx, Sidebar.tsx, Navbar.tsx, Tooltip.tsx, Drawer.tsx | ~78 occurrences |
| `font-mono`, `uppercase`, `tracking-*`, `backdrop-blur-*`, `mix-blend-*`, `drop-shadow-*` | VoyageReplay.tsx, DigitalTwinMap.tsx, StormSimulator.tsx, ParetoExplorer.tsx, OptimizerTelemetry.tsx, FuelIntelligence.tsx, Sidebar.tsx, Navbar.tsx, Tooltip.tsx, Drawer.tsx | ~250+ occurrences |

**Summary**: 
The legacy dark theme styling is deeply embedded in nearly all the page components, utilizing hard-coded slate colors, font-mono, and cyan accents that conflict with the new light-theme design system.

The components need a systematic migration to the new semantic tokens provided by the design system, and legacy CSS utility classes must be stripped out completely.
