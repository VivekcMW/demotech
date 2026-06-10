# Aarogya DS — Design System for Advanced EHR (Indian Market)

**Version:** 1.0.0 · **Status:** Foundation spec · **Last updated:** 10 June 2026
**Scope:** Light + Dark themes · Web (desktop-first), tablet, mobile · Print

---

## Table of contents

1. [Design principles](#1-design-principles)
2. [Token architecture](#2-token-architecture)
3. [Color — primitives](#3-color--primitives)
4. [Color — semantic tokens (Light theme)](#4-color--semantic-tokens-light-theme)
5. [Color — semantic tokens (Dark theme)](#5-color--semantic-tokens-dark-theme)
6. [Clinical semantic layer](#6-clinical-semantic-layer)
7. [Typography](#7-typography)
8. [Spacing, layout & density](#8-spacing-layout--density)
9. [Shape, borders & elevation](#9-shape-borders--elevation)
10. [Iconography](#10-iconography)
11. [Motion](#11-motion)
12. [Core components](#12-core-components)
13. [Clinical patterns](#13-clinical-patterns)
14. [Data visualization](#14-data-visualization)
15. [Accessibility](#15-accessibility)
16. [Localization & multilingual rules](#16-localization--multilingual-rules)
17. [Print system](#17-print-system)
18. [Implementation](#18-implementation)
19. [Governance](#19-governance)

---

## 1. Design principles

1. **Safety before style.** Color, weight, and motion are clinical signals first, aesthetics second. Red, amber, and green are reserved exclusively for clinical meaning and are never used decoratively.
2. **Never color alone.** Every status is communicated by the triad: color + icon + text label. This protects users with color vision deficiency and prevents misreads on poorly calibrated hospital monitors.
3. **Dense but breathable.** Indian OPDs run 60–100 patients per doctor per day. The system supports a Compact density mode without ever dropping below accessibility floors.
4. **Both themes are clinical tools.** Light theme serves bright OPDs and daytime wards; dark theme serves ICUs, night-shift nursing stations, radiology reading rooms. Semantic meaning is identical across themes — a critical value reads as critical in both.
5. **Nine scripts, one system.** Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, Gujarati, Punjabi, and Odia are first-class citizens, metrically harmonized with Latin.
6. **Works on the worst machine in the hospital.** Assume 1366×768 displays, old Chrome, flaky bandwidth, and shared nursing-station PCs. Self-hosted assets, subsetted fonts, no heavy effects.

---

## 2. Token architecture

Three layers. Components never reference primitives directly.

```
┌──────────────────────────────────────────────────────────┐
│ Layer 1 · PRIMITIVE   teal-600: #0D9488   (raw values)   │
├──────────────────────────────────────────────────────────┤
│ Layer 2 · SEMANTIC    color-action-primary: {teal-600}   │
│                       (theme-switched: light/dark)       │
├──────────────────────────────────────────────────────────┤
│ Layer 3 · COMPONENT   button-primary-bg:                 │
│                       {color-action-primary}             │
└──────────────────────────────────────────────────────────┘
```

- **Primitives** are theme-agnostic raw values (color ramps, px sizes, ms durations).
- **Semantic tokens** carry meaning (`color-status-critical-bg`) and are the only layer that changes between Light and Dark themes.
- **Component tokens** exist only where a component needs an override hook.

Naming convention: `{category}-{concept}-{variant?}-{state?}`
Examples: `color-surface-raised`, `color-text-secondary`, `color-status-critical-bg`, `space-4`, `radius-lg`, `text-body-strong`.

---

## 3. Color — primitives

Eleven-stop ramps. Stops 50–300 are tints (light-theme fills), 400–500 are dark-theme accents, 600–700 are light-theme accents, 800–950 are dark fills and deep text.

### 3.1 Care Teal (brand / primary action)

| Stop | Hex | Typical use |
|---|---|---|
| 50 | `#F0FDFA` | Light: subtle fills, selected rows |
| 100 | `#CCFBF1` | Light: hover fills |
| 200 | `#99F6E4` | Light: borders on tinted fills |
| 300 | `#5EEAD4` | Dark: text on teal-900 fills |
| 400 | `#2DD4BF` | Dark: primary interactive |
| 500 | `#14B8A6` | Dark: hover on primary |
| 600 | `#0D9488` | Light: primary interactive |
| 700 | `#0F766E` | Light: hover/pressed, links |
| 800 | `#115E59` | Dark: borders on teal fills |
| 900 | `#134E4A` | Dark: subtle teal fills |
| 950 | `#042F2E` | Dark: text on teal-400 buttons |

### 3.2 Slate (neutrals)

| Stop | Hex | Typical use |
|---|---|---|
| 50 | `#F8FAFC` | Light: page background |
| 100 | `#F1F5F9` | Light: secondary surfaces, table stripes |
| 200 | `#E2E8F0` | Light: default borders |
| 300 | `#CBD5E1` | Light: strong borders, disabled text floor |
| 400 | `#94A3B8` | Both: tertiary text, placeholders |
| 500 | `#64748B` | Light: secondary icons / Dark: tertiary text |
| 600 | `#475569` | Light: secondary text |
| 700 | `#334155` | Dark: borders |
| 800 | `#283548` | Dark: elevated surface (custom stop) |
| 850 | `#1E293B` | Dark: raised surface (cards) |
| 900 | `#0F172A` | Light: primary text / Dark: sunken surface |
| 950 | `#0B1220` | Dark: page background (custom stop) |

### 3.3 Critical Red — reserved for clinical danger

| Stop | Hex | | Stop | Hex |
|---|---|---|---|---|
| 50 | `#FEF2F2` | | 500 | `#EF4444` |
| 100 | `#FEE2E2` | | 600 | `#DC2626` |
| 200 | `#FECACA` | | 700 | `#B91C1C` |
| 300 | `#FCA5A5` | | 800 | `#991B1B` |
| 400 | `#F87171` | | 900 | `#7F1D1D` |
| | | | 950(D-bg) | `#3A1D1D` |

### 3.4 Warning Amber — reserved for caution/abnormal

| Stop | Hex | | Stop | Hex |
|---|---|---|---|---|
| 50 | `#FFFBEB` | | 500 | `#F59E0B` |
| 100 | `#FEF3C7` | | 600 | `#D97706` |
| 200 | `#FDE68A` | | 700 | `#B45309` |
| 300 | `#FCD34D` | | 800 | `#92400E` |
| 400 | `#FBBF24` | | 900 | `#78350F` |
| | | | 950(D-bg) | `#3A2E14` |

### 3.5 Normal Green — reserved for in-range/success

| Stop | Hex | | Stop | Hex |
|---|---|---|---|---|
| 50 | `#F0FDF4` | | 500 | `#22C55E` |
| 100 | `#DCFCE7` | | 600 | `#16A34A` |
| 200 | `#BBF7D0` | | 700 | `#15803D` |
| 300 | `#86EFAC` | | 800 | `#166534` |
| 400 | `#4ADE80` | | 900 | `#14532D` |
| | | | 950(D-bg) | `#16321F` |

### 3.6 Info Sky — informational, in-progress

| Stop | Hex | | Stop | Hex |
|---|---|---|---|---|
| 50 | `#F0F9FF` | | 500 | `#0EA5E9` |
| 100 | `#E0F2FE` | | 600 | `#0284C7` |
| 200 | `#BAE6FD` | | 700 | `#0369A1` |
| 300 | `#7DD3FC` | | 800 | `#075985` |
| 400 | `#38BDF8` | | 900 | `#0C4A6E` |
| | | | 950(D-bg) | `#14303F` |

### 3.7 Categorical hues — department & tag coding ONLY

Never used for status. Used for department color coding, calendar categories, chart series.

| Name | 100 (L fill) | 600 (L accent) | 300 (D accent) | 900 (D fill) |
|---|---|---|---|---|
| Violet | `#EDE9FE` | `#7C3AED` | `#C4B5FD` | `#3B1D6E` |
| Fuchsia | `#FAE8FF` | `#C026D3` | `#F0ABFC` | `#5C1666` |
| Rose | `#FFE4E6` | `#E11D48` ⚠ | `#FDA4AF` | `#5C1626` |
| Cyan | `#CFFAFE` | `#0891B2` | `#67E8F9` | `#134E5C` |
| Indigo | `#E0E7FF` | `#4F46E5` | `#A5B4FC` | `#272163` |
| Lime | `#ECFCCB` | `#65A30D` ⚠ | `#BEF264` | `#2C3D0A` |
| Orange | `#FFEDD5` | `#EA580C` ⚠ | `#FDBA74` | `#5C2A0A` |

⚠ Rose, Lime and Orange sit near reserved semantic hues — only assign them to departments when paired with a text label, never adjacent to status indicators in the same view.

---
## 4. Color — semantic tokens (Light theme)

### 4.1 Surfaces

| Token | Value | Use |
|---|---|---|
| `color-surface-page` | slate-50 `#F8FAFC` | App background |
| `color-surface-raised` | white `#FFFFFF` | Cards, panels, tables |
| `color-surface-sunken` | slate-100 `#F1F5F9` | Wells, input groups, table stripes |
| `color-surface-overlay` | white `#FFFFFF` | Modals, popovers (with shadow) |
| `color-surface-inverse` | slate-900 `#0F172A` | Tooltips, toasts |
| `color-scrim` | `rgba(15,23,42,0.5)` | Modal backdrop |

### 4.2 Text

| Token | Value | Contrast vs white | Use |
|---|---|---|---|
| `color-text-primary` | slate-900 `#0F172A` | 17.8:1 | Default text |
| `color-text-secondary` | slate-600 `#475569` | 7.5:1 | Supporting text, table headers |
| `color-text-tertiary` | slate-400 `#94A3B8` | 3.0:1 ⚠ large/disabled only | Placeholders, timestamps ≥18px or non-essential |
| `color-text-disabled` | slate-300 `#CBD5E1` | — | Disabled labels |
| `color-text-inverse` | slate-50 `#F8FAFC` | — | On dark/teal fills |
| `color-text-link` | teal-700 `#0F766E` | 5.1:1 | Links, inline actions |
| `color-text-on-primary` | white `#FFFFFF` | 4.6:1 on teal-600 | Button labels |

### 4.3 Actions

| Token | Value | Use |
|---|---|---|
| `color-action-primary` | teal-600 `#0D9488` | Primary buttons, active nav, focus accents |
| `color-action-primary-hover` | teal-700 `#0F766E` | Hover |
| `color-action-primary-pressed` | teal-800 `#115E59` | Pressed |
| `color-action-primary-subtle` | teal-50 `#F0FDFA` | Selected rows, active tab fill |
| `color-action-secondary-border` | slate-200 `#E2E8F0` | Secondary button border |
| `color-action-destructive` | red-600 `#DC2626` | Delete, discontinue med |
| `color-focus-ring` | teal-500 `#14B8A6` | 2px ring, 2px offset |

### 4.4 Borders & status

| Token | Value |
|---|---|
| `color-border-default` | slate-200 `#E2E8F0` |
| `color-border-strong` | slate-300 `#CBD5E1` |
| `color-border-input` | slate-300 `#CBD5E1` |
| `color-status-critical-bg / -border / -fg` | red-50 / red-200 / red-700 (`#B91C1C`, 6.0:1 on red-50) |
| `color-status-warning-bg / -border / -fg` | amber-50 / amber-200 / amber-800 (`#92400E`) |
| `color-status-normal-bg / -border / -fg` | green-50 / green-200 / green-700 (`#15803D`) |
| `color-status-info-bg / -border / -fg` | sky-50 / sky-200 / sky-700 (`#0369A1`) |
| `color-status-neutral-bg / -fg` | slate-100 / slate-600 |

Strong accents (icons, vital values, badges-on-white): critical `#DC2626`, warning `#D97706`, normal `#16A34A`, info `#0284C7`.

---

## 5. Color — semantic tokens (Dark theme)

Dark theme is desaturated slate, never pure black. Elevation = lighter surface, not shadow.

### 5.1 Surfaces

| Token | Value | Use |
|---|---|---|
| `color-surface-page` | slate-950 `#0B1220` | App background |
| `color-surface-raised` | slate-850 `#1E293B` | Cards, panels |
| `color-surface-sunken` | slate-900 `#0F172A` | Wells, input groups |
| `color-surface-elevated` | slate-800 `#283548` | Hover rows, nested cards, popovers |
| `color-surface-overlay` | slate-800 `#283548` | Modals |
| `color-surface-inverse` | slate-50 `#F8FAFC` | Tooltips |
| `color-scrim` | `rgba(2,6,16,0.65)` | Modal backdrop |

### 5.2 Text

| Token | Value | Contrast vs slate-850 | Use |
|---|---|---|---|
| `color-text-primary` | slate-100 `#F1F5F9` | 14.9:1 | Default (avoid pure white — halation) |
| `color-text-secondary` | slate-400 `#94A3B8` | 5.9:1 | Supporting text |
| `color-text-tertiary` | slate-500 `#64748B` | 3.4:1 ⚠ | Non-essential metadata only |
| `color-text-disabled` | slate-700 `#334155` | — | Disabled |
| `color-text-link` | teal-300 `#5EEAD4` | 10.4:1 | Links |
| `color-text-on-primary` | teal-950 `#042F2E` | 8.9:1 on teal-400 | Button labels |

### 5.3 Actions

| Token | Value |
|---|---|
| `color-action-primary` | teal-400 `#2DD4BF` |
| `color-action-primary-hover` | teal-300 `#5EEAD4` |
| `color-action-primary-pressed` | teal-500 `#14B8A6` |
| `color-action-primary-subtle` | teal-900 `#134E4A` |
| `color-action-destructive` | red-400 `#F87171` |
| `color-focus-ring` | teal-300 `#5EEAD4` |

### 5.4 Borders & status

| Token | Value |
|---|---|
| `color-border-default` | slate-700 `#334155` |
| `color-border-strong` | slate-600 `#475569` |
| `color-status-critical-bg / -border / -fg` | `#3A1D1D` / red-900 `#7F1D1D` / red-200 `#FECACA` |
| `color-status-warning-bg / -border / -fg` | `#3A2E14` / amber-900 `#78350F` / amber-200 `#FDE68A` |
| `color-status-normal-bg / -border / -fg` | `#16321F` / green-900 `#14532D` / green-200 `#BBF7D0` |
| `color-status-info-bg / -border / -fg` | `#14303F` / sky-900 `#0C4A6E` / sky-200 `#BAE6FD` |

Strong accents on dark surfaces: critical red-400 `#F87171` (5.1:1), warning amber-400 `#FBBF24` (8.4:1), normal green-400 `#4ADE80` (8.2:1), info sky-400 `#38BDF8` (6.7:1).

### 5.5 Dark-theme rules

1. No pure `#000000` backgrounds and no pure `#FFFFFF` text.
2. Saturated 600-stop colors from light theme are forbidden on dark surfaces — always shift to the 300/400 stop.
3. Elevation is expressed by surface lightening (`page → raised → elevated`), shadows are minimal (subtle, for overlays only).
4. Large filled areas of semantic color are replaced by tinted backgrounds + colored text (reduces glow/halation for night-adapted eyes).
5. Charts and medical imagery get their own dark palette (see §14); never auto-invert images, X-rays, or scan thumbnails.

---

## 6. Clinical semantic layer

This layer is what makes the system an EHR system. All mappings are identical in both themes — only the underlying color values switch.

### 6.1 Lab result flags

| Flag | Meaning | Visual treatment | Icon (Tabler) |
|---|---|---|---|
| `HH` | Critically high | critical fg, bold, tinted bg row chip, `▲▲` | `ti-alert-octagon` |
| `H` | Above range | warning fg, `▲` | `ti-arrow-up` |
| `N` | In range | normal fg (value stays text-primary; only flag colored) | `ti-check` |
| `L` | Below range | warning fg, `▼` | `ti-arrow-down` |
| `LL` | Critically low | critical fg, bold, tinted bg row chip, `▼▼` | `ti-alert-octagon` |
| `—` | No range / pending | neutral fg | `ti-minus` |

Rule: in result tables the **value** stays `text-primary`; the **flag chip** carries color. Coloring every abnormal number turns the table into noise.

### 6.2 Vital sign states

| State | Token pair | Example |
|---|---|---|
| Normal | `status-normal` | SpO₂ 97% |
| Borderline | `status-warning` | HR 104 |
| Critical | `status-critical` + pulse animation (≤2 blinks, then static) | BP 200/120 |
| Stale (>X min old) | `status-neutral` + `ti-clock` + timestamp | Last: 42 min ago |

Staleness thresholds are configurable per ward type (ICU 5 min, ward 60 min).

### 6.3 Alert severity (CDSS, drug interaction, allergy)

| Level | Behavior | Treatment |
|---|---|---|
| L1 Critical (hard stop) | Blocks action, requires override + reason | Critical tokens, modal, `ti-ban` |
| L2 High (interruptive) | Dialog, dismiss with acknowledgement | Critical tokens, inline banner |
| L3 Moderate | Inline banner, non-blocking | Warning tokens, `ti-alert-triangle` |
| L4 Info | Passive note | Info tokens, `ti-info-circle` |

Anti-alert-fatigue rule: L3/L4 never use red; reserve red strictly for L1/L2 so it retains meaning.

### 6.4 Bed / patient status (IPD board)

| Status | Color | Icon |
|---|---|---|
| Occupied — stable | normal | `ti-bed` |
| Occupied — watch | warning | `ti-eye` |
| Occupied — critical | critical | `ti-heart-rate-monitor` |
| Vacant — clean | teal subtle | `ti-bed-off` |
| Vacant — needs cleaning | neutral | `ti-spray` |
| Blocked / maintenance | neutral + strikethrough label | `ti-tool` |
| Discharge in progress | info | `ti-logout` |

### 6.5 Queue / order status

Registered → info · In progress → info (spinner) · Completed → normal · On hold → warning · Cancelled → neutral + strikethrough · STAT/urgent → critical chip prefix `STAT`.

### 6.6 Department color coding (categorical hues §3.7)

Suggested defaults: Cardiology=Rose, Neurology=Violet, Ortho=Orange, OBG=Fuchsia, Pediatrics=Cyan, Oncology=Indigo, General Medicine=Teal-tint, Surgery=Lime. Configurable per hospital; max 8 active hues per view; always paired with the department label.

---
## 7. Typography

### 7.1 Families & roles

| Role | Family | Why |
|---|---|---|
| UI & body (Latin) | **Inter** (variable) | Tall x-height at 12–14px, `tabular-nums`, disambiguated I/l/1 via `ss01` |
| Indic scripts | **Noto Sans [Script] UI** ×9 | Vertically compact UI variants; metrically harmonized across scripts |
| Data & codes | **JetBrains Mono** | UHID/ABHA, ICD/SNOMED codes, lab IDs; exposes 0/O 1/l errors |
| Brand/display | Marketing site only — never in product | Consistency builds clinical trust |

Scripts covered: Devanagari (hi, mr), Tamil (ta), Telugu (te), Bengali (bn, as*), Kannada (kn), Malayalam (ml), Gujarati (gu), Gurmukhi (pa), Odia (or). *Assamese requires the ra/wa variant — verify glyphs in QA.

### 7.2 Font stacks

```css
:root {
  --font-ui:   'Inter', 'Noto Sans', system-ui, sans-serif;
  --font-data: 'JetBrainsMono', 'Noto Sans Mono', ui-monospace, monospace;
}
/* Script-first stacks, applied via :lang() — never via classes */
:lang(hi), :lang(mr) { font-family: 'Noto Sans Devanagari UI', 'Inter', sans-serif; }
:lang(ta) { font-family: 'Noto Sans Tamil UI', 'Inter', sans-serif; }
:lang(te) { font-family: 'Noto Sans Telugu UI', 'Inter', sans-serif; }
:lang(bn) { font-family: 'Noto Sans Bengali UI', 'Inter', sans-serif; }
:lang(kn) { font-family: 'Noto Sans Kannada UI', 'Inter', sans-serif; }
:lang(ml) { font-family: 'Noto Sans Malayalam UI', 'Inter', sans-serif; }
:lang(gu) { font-family: 'Noto Sans Gujarati UI', 'Inter', sans-serif; }
:lang(pa) { font-family: 'Noto Sans Gurmukhi UI', 'Inter', sans-serif; }
:lang(or) { font-family: 'Noto Sans Oriya UI', 'Inter', sans-serif; }
```

The Indic font precedes Inter so mixed content (an English drug name inside a Hindi sentence) shapes on one baseline.

### 7.3 Type scale

| Token | Size | LH Latin | LH Indic | Weight | Use |
|---|---|---|---|---|---|
| `text-display` | 28px | 1.25 | 1.40 | 600 | Page titles, empty states |
| `text-h1` | 22px | 1.30 | 1.45 | 600 | Section headers |
| `text-h2` | 18px | 1.35 | 1.50 | 600 | Card titles, modal headers |
| `text-h3` | 16px | 1.40 | 1.55 | 500 | Subsections, form groups |
| `text-body` | 14px | 1.50 | 1.65 | 400 | Default |
| `text-body-strong` | 14px | 1.50 | 1.65 | 500 | Patient names, emphasis |
| `text-secondary` | 13px | 1.45 | 1.60 | 400 | Table cells, metadata |
| `text-caption` | 12px | 1.40 | 1.55 | 400 | Labels, timestamps |
| `text-data` | 13px | 1.40 | — | 400 mono | IDs, codes |
| `text-vital` | 20px | 1.20 | — | 500 tab-nums | Vitals, key lab values |
| `text-vital-lg` | 28px | 1.15 | — | 600 tab-nums | ICU dashboard tiles |

Line-height switches with `:lang()` exactly like font-family.

### 7.4 Weights

Load **400 / 500 / 600 only.** No 300 (contrast risk for fatigued users), no 700 (Noto Indic gets blobby at small sizes; 600 is the ceiling). Hierarchy comes from size + color + space first, weight last.

### 7.5 Hard rules

1. **Floors:** 12px absolute minimum; 13px minimum for Indic scripts; 14px minimum for doses, allergies, patient identifiers.
2. **Letter-spacing:** −0.01em allowed on Latin ≥18px. **Zero tracking on Indic text, always** — negative tracking breaks conjunct shaping.
3. **Numerals:** ASCII digits 0-9 for ALL clinical data in every language. Devanagari/Tamil numerals only on patient-facing prints behind an explicit setting. `font-variant-numeric: tabular-nums` on every table, vital, and trend column. Slashed zero in mono contexts.
4. **Case:** Sentence case everywhere. No ALL-CAPS UI labels (Indic scripts have no casing; mixed screens look broken). Patient names render as entered.
5. **Truncation:** Never truncate drug names, doses, or allergy text. Wrap instead. Names/IDs may middle-truncate with full value on hover/focus.
6. **No italic for Indic scripts** (synthesized obliques distort conjuncts) — use weight or color for emphasis instead.

### 7.6 Loading & performance

- Self-host all fonts as variable woff2 (hospital firewalls block external CDNs).
- `unicode-range` subsets per script: a Tamil Nadu deployment downloads Latin + Tamil only (~180KB total).
- `font-display: swap`; preload Inter + the deployment's primary Indic font.
- Define `size-adjust` / `ascent-override` on local fallbacks to prevent layout shift mid-form-entry.
- Budget: ≤250KB fonts on first load per deployment language.

---

## 8. Spacing, layout & density

### 8.1 Spacing scale (4px base)

| Token | px | Use |
|---|---|---|
| `space-1` | 4 | Icon-to-label gaps, chip padding-y |
| `space-2` | 8 | Intra-component gaps |
| `space-3` | 12 | Form field gaps, card padding (compact) |
| `space-4` | 16 | Card padding (default), grid gutters |
| `space-5` | 20 | Section padding |
| `space-6` | 24 | Between cards |
| `space-8` | 32 | Section breaks |
| `space-10` | 40 | Page-level separation |
| `space-12` | 48 | Hero/empty-state spacing |

### 8.2 Density modes

| Property | Comfortable | Compact |
|---|---|---|
| Table row height | 44px | 32px |
| Input height | 40px | 32px |
| Card padding | 16px | 12px |
| Body size | 14px | 13px (floor) |

Density is a user-level setting, defaulted by role: front desk & billing → Compact; doctors → Comfortable; nursing tablets → Comfortable (touch).

### 8.3 Breakpoints & grid

| Token | Width | Layout |
|---|---|---|
| `bp-sm` | ≥640px | Single column, patient app |
| `bp-md` | ≥768px | Tablet nursing — 2 col |
| `bp-lg` | ≥1024px | Compact desktop — collapsible sidebar |
| `bp-xl` | ≥1366px | **Primary target** (most hospital PCs) |
| `bp-2xl` | ≥1600px | Multi-panel ICU dashboards |

12-column grid, 16px gutters at `xl`. App shell: 64px topbar, 240px sidebar (64px collapsed), max content width 1600px.
Touch targets: 44×44px minimum on tablet/mobile; 24×24px minimum pointer targets on desktop.

---

## 9. Shape, borders & elevation

### 9.1 Radius

| Token | px | Use |
|---|---|---|
| `radius-sm` | 4 | Chips, tags, checkboxes |
| `radius-md` | 8 | Buttons, inputs, badges |
| `radius-lg` | 12 | Cards, modals, panels |
| `radius-full` | 999 | Pills, avatars |

### 9.2 Borders

Default 1px. Status banners use a 3px left accent (with `radius: 0` on that edge). Focus = 2px ring, 2px offset, `color-focus-ring`.

### 9.3 Elevation

Light theme (shadows):

| Token | Value | Use |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(15,23,42,0.05)` | Cards |
| `shadow-sm` | `0 2px 8px rgba(15,23,42,0.08)` | Dropdowns, popovers |
| `shadow-md` | `0 8px 24px rgba(15,23,42,0.12)` | Modals |
| `shadow-lg` | `0 16px 48px rgba(15,23,42,0.16)` | Command palette |

Dark theme (surface lightening): page `#0B1220` → raised `#1E293B` → elevated `#283548`; overlays add `0 8px 24px rgba(0,0,0,0.4)`.

---

## 10. Iconography

- Library: **Tabler Icons** (outline), 1.5px stroke, 24px grid. One library only.
- Sizes: 16px (inline/table), 20px (buttons, nav), 24px (page headers, empty states).
- Color: inherits text color; semantic icons use the status `-fg` token.
- Filled variants reserved exclusively for active nav states and L1/L2 alert icons.
- Clinical icon vocabulary is fixed system-wide (one icon = one meaning): `ti-heart-rate-monitor` vitals · `ti-pill` medication · `ti-test-pipe` lab · `ti-radioactive` radiology · `ti-bed` IPD · `ti-stethoscope` OPD · `ti-emergency-bed` ER · `ti-scissors` OT · `ti-receipt` billing · `ti-shield-check` insurance/TPA · `ti-alert-octagon` critical alert · `ti-ban` contraindication.
- Never rely on an icon alone for critical meaning (pair with label) — see Principle 2.

---

## 11. Motion

| Token | Value | Use |
|---|---|---|
| `duration-fast` | 100ms | Hover, pressed states |
| `duration-base` | 180ms | Dropdowns, tooltips, tabs |
| `duration-slow` | 280ms | Modals, drawers, toasts |
| `ease-standard` | cubic-bezier(0.2, 0, 0, 1) | Default |
| `ease-exit` | cubic-bezier(0.4, 0, 1, 1) | Dismissals |

Rules: no motion on data values except the critical-vital pulse (max 2 cycles, then static — continuous blinking causes alarm fatigue and seizure risk). Respect `prefers-reduced-motion` by disabling all non-essential animation. Skeleton loaders over spinners for tables/records.

---
## 12. Core components

Each component is specified for both themes via semantic tokens; only key specs listed here. States required for every interactive component: default, hover, pressed, focus-visible, disabled, loading (where applicable), error (inputs).

### 12.1 Buttons

| Variant | Light | Dark | Notes |
|---|---|---|---|
| Primary | teal-600 bg, white text | teal-400 bg, teal-950 text | One per view region |
| Secondary | white bg, slate-200 border, text-primary | slate-850 bg, slate-700 border | Default choice |
| Tertiary/ghost | transparent, teal-700 text | transparent, teal-300 text | Inline actions |
| Destructive | red-600 bg, white text | red-400 bg, red-950 text | Confirm-gated |
| Sizes | sm 32px · md 40px · lg 44px (touch) | | Label 14px/500, icon 20px |

### 12.2 Inputs (text, select, date, search)

Height 40px (32 compact) · radius-md · 1px `color-border-input` · focus: 2px ring · error: red-600/400 border + 12px message with `ti-alert-circle` · label 13px/500 above, never placeholder-as-label · helper text 12px secondary. Date inputs display `DD MMM YYYY` (10 Jun 2026) — unambiguous across Indian users; never `MM/DD`.

### 12.3 Badges & chips

Height 20px (status) / 24px (interactive chips) · radius-full · 12px/500 label · tinted bg + `-fg` text + optional 14px icon. Status badges are never clickable; chips (filters, multi-select) show `ti-x` affordance.

### 12.4 Tables (the most important component)

- Header: 13px/500 text-secondary, sticky, sortable columns get `ti-arrows-sort`.
- Rows: 44/32px; zebra optional via surface-sunken; hover surface-elevated (dark) / slate-50 (light); selected row teal-subtle + 2px teal left accent.
- Numeric columns right-aligned, tabular-nums. Flags as chips (§6.1). Row-level critical state: critical-bg tint on the full row + icon in first column.
- Pagination ≥50 rows; virtualized scroll for live queues; column visibility user-configurable per role.

### 12.5 Patient banner (persistent context header)

Always visible during a patient session. Contains: avatar/initials (dept-colored ring), name + age/sex, UHID + ABHA (mono), encounter type chip, allergy chip (critical, `ti-alert-triangle`, max 2 + "+n more"), blood group, primary doctor. Height 64px (collapses to 48px on scroll). Allergy chip is the one element that may never collapse, truncate, or hide.

### 12.6 Alert banners & toasts

Banner: tinted bg, 3px left accent, 20px icon, title 14px/500, body 13px, optional action. Toast: surface-inverse, 4s auto-dismiss (success/info only — warnings and criticals never auto-dismiss), max 3 stacked, bottom-right.

### 12.7 Modals & drawers

Modal widths 480/640/880px, radius-lg, header 18px/600, scrim per theme. L1 clinical alert modal: no close-on-scrim-click, no Esc — explicit action required. Drawers 480px right-anchored for record preview, order details.

### 12.8 Navigation

Sidebar item: 40px height, 20px icon + 14px label, active = teal-subtle bg + 3px left teal accent + 500 weight. Top bar: global patient search (UHID/name/phone/ABHA), facility switcher, notifications, profile. Breadcrumbs 13px in module headers.

### 12.9 Forms — clinical entry patterns

- Single column, 640px max width; group with `text-h3` + space-6.
- Doses: numeric stepper + unit select; free-text dose forbidden where structured options exist.
- Mandatory clinical fields marked "(required)" in label — not color-only asterisks.
- Autosave drafts with visible "Saved 14:32" indicator; unsaved-changes guard on exit.

### 12.10 Empty, loading & error states

Empty: 24px icon (neutral), 16px/500 title, 14px secondary body, one primary action. Loading: skeletons matching final layout. Error: explain what failed + retry; never expose stack traces; offline banner with queued-actions count (critical for Indian connectivity).

---

## 13. Clinical patterns

### 13.1 Role-based shells

| Role | Default density | Home view |
|---|---|---|
| Doctor (OPD) | Comfortable | Today's queue + consult workspace |
| Doctor (IPD) | Comfortable | Ward list + patient timeline |
| Nurse | Comfortable (touch) | Task list + vitals entry |
| Front desk | Compact | Registration + appointments |
| Pharmacy | Compact | Order queue + dispensing |
| Billing/TPA | Compact | Invoice list + claims |
| Lab/Radiology | Compact | Worklist + result entry |

### 13.2 Consult workspace (SOAP)

Two-panel: left = patient context (history, vitals, recent results, scrollable), right = active note + orders. Order sets per specialty (maps to your specialty master data). Quick-text templates support all 9 scripts.

### 13.3 e-Prescription composer

Drug search with generic + brand display (generic primary — NMC guideline), strength/form/route/frequency/duration as structured selects, Hindi-numeral-free dosing, auto interaction + allergy check on add (alert levels §6.3), preview matches print template (§17).

### 13.4 Vitals & ICU dashboard

Tile grid, `text-vital-lg`, threshold coloring per §6.2, sparkline trend (last 8 readings), stale indicator. Dark theme default for ICU deployments; theme is per-workstation, not per-user, in shared-terminal contexts.

### 13.5 IPD bed board

Ward grid using §6.4 statuses; click → patient mini-card drawer; filters by ward/status/doctor.

### 13.6 Billing & GST

Amounts right-aligned, tabular-nums, `₹` prefix with Indian digit grouping (₹1,23,456.00 — lakh/crore format via `Intl.NumberFormat('en-IN')`). Negative/refund amounts in parentheses + critical fg. GST breakup rows in text-secondary.

---

## 14. Data visualization

- Series palette (light): teal-600, indigo-600, fuchsia-600, cyan-700, violet-600, slate-500. Dark: 300/400 stops of the same hues.
- Reference/normal ranges on clinical charts: green-tinted band (light: green-50 @ 60%; dark: `#16321F` @ 60%); out-of-range points use warning/critical fg with shape change (▲) — never color alone.
- Gridlines: slate-200 (light) / slate-700 (dark). Axis labels 12px secondary.
- Trend charts use tabular-nums tooltips with timestamp; no smoothing on clinical series (interpolation can fabricate values between readings).
- Never auto-invert or recolor DICOM/scan imagery in dark theme; image viewers keep a neutral dark chrome in both themes.

---

## 15. Accessibility

**Targets: WCAG 2.1 AA + NABH digital health expectations.**

1. Contrast: text ≥4.5:1 (≥3:1 for ≥18px/500); UI components & focus indicators ≥3:1. All token pairs in §4–5 are pre-verified; any new pair must be checked in both themes.
2. Never color alone (Principle 2) — verified per component in review.
3. Full keyboard support: visible focus ring everywhere, logical tab order, Esc closes (except L1 modals), typeahead in long selects, documented shortcuts (e.g. `/` global search).
4. Screen readers: semantic landmarks, `aria-live="assertive"` for L1/L2 alerts, `polite` for toasts; lab flags carry text alternatives ("critically high"), `lang` attributes on every localized string (required for correct Indic pronunciation).
5. Zoom to 200% without horizontal scroll at `bp-xl`; rem-based type.
6. Color-blindness: all status pairs tested for protanopia/deuteranopia/tritanopia; red/green never the only differentiator (icons + ▲▼ shapes).
7. `prefers-reduced-motion` honored globally.
8. Touch: 44px targets, 8px between adjacent targets on tablet.

---

## 16. Localization & multilingual rules

1. UI chrome language ≠ content language: a Hindi UI must render a Tamil patient note correctly via per-element `lang`.
2. Layout must absorb +35% string expansion (Hindi/Tamil run long); no fixed-width labels; buttons grow.
3. Dates `DD MMM YYYY`, time 24h in clinical contexts, IST assumed, `Intl` for all formatting (`en-IN` numbers).
4. Names: single full-name field (many Indian names don't split into first/last cleanly); optional structured fields for ABDM compliance; transliteration search (Ram = राम) in patient lookup.
5. Phone: +91 default, 10-digit validation. Address: state/district/PIN structured for statutory reporting.
6. ABHA number formatting: `XX-XXXX-XXXX-XXXX` in mono.
7. Translation keys, never hardcoded strings; pseudo-localization build for QA.

---

## 17. Print system

Prescriptions, discharge summaries, lab reports, bills — legal documents under NMC/NABH.

- A4 + A5 (prescription) templates; print stylesheet is part of the system.
- Body ≥10.5pt; drug name + dose + frequency ≥11pt/500; Indic line-height 1.6.
- Black text on white only; status conveyed by flags/text (H, L, ▲▼), never color (assume B/W printers).
- Header: hospital identity, doctor name + registration number; footer: page X of Y, generated timestamp, digital signature block (ABDM-compliant).
- Bilingual prescriptions: instruction line printed in English + patient's language stacked.
- QR code (ABHA/visit link) at 2.5cm minimum.

---

## 18. Implementation

### 18.1 CSS custom properties (excerpt)

```css
:root, [data-theme="light"] {
  --surface-page: #F8FAFC; --surface-raised: #FFFFFF; --surface-sunken: #F1F5F9;
  --text-primary: #0F172A; --text-secondary: #475569; --text-link: #0F766E;
  --action-primary: #0D9488; --action-primary-hover: #0F766E; --action-subtle: #F0FDFA;
  --border-default: #E2E8F0; --focus-ring: #14B8A6;
  --critical-bg: #FEF2F2; --critical-fg: #B91C1C; --critical-strong: #DC2626;
  --warning-bg: #FFFBEB; --warning-fg: #92400E; --warning-strong: #D97706;
  --normal-bg: #F0FDF4; --normal-fg: #15803D; --normal-strong: #16A34A;
  --info-bg: #F0F9FF; --info-fg: #0369A1; --info-strong: #0284C7;
}
[data-theme="dark"] {
  --surface-page: #0B1220; --surface-raised: #1E293B; --surface-sunken: #0F172A;
  --surface-elevated: #283548;
  --text-primary: #F1F5F9; --text-secondary: #94A3B8; --text-link: #5EEAD4;
  --action-primary: #2DD4BF; --action-primary-hover: #5EEAD4; --action-subtle: #134E4A;
  --border-default: #334155; --focus-ring: #5EEAD4;
  --critical-bg: #3A1D1D; --critical-fg: #FECACA; --critical-strong: #F87171;
  --warning-bg: #3A2E14; --warning-fg: #FDE68A; --warning-strong: #FBBF24;
  --normal-bg: #16321F; --normal-fg: #BBF7D0; --normal-strong: #4ADE80;
  --info-bg: #14303F; --info-fg: #BAE6FD; --info-strong: #38BDF8;
}
```

Theme switching: `data-theme` on `<html>`; default follows OS (`prefers-color-scheme`) with per-workstation override for shared terminals; persist per device, not per user, in ICU/nursing-station contexts.

### 18.2 Tailwind mapping (excerpt)

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      surface: { page: 'var(--surface-page)', raised: 'var(--surface-raised)', sunken: 'var(--surface-sunken)' },
      content: { DEFAULT: 'var(--text-primary)', secondary: 'var(--text-secondary)', link: 'var(--text-link)' },
      action:  { DEFAULT: 'var(--action-primary)', hover: 'var(--action-primary-hover)', subtle: 'var(--action-subtle)' },
      critical:{ bg: 'var(--critical-bg)', fg: 'var(--critical-fg)', strong: 'var(--critical-strong)' },
      warning: { bg: 'var(--warning-bg)', fg: 'var(--warning-fg)', strong: 'var(--warning-strong)' },
      normal:  { bg: 'var(--normal-bg)', fg: 'var(--normal-fg)', strong: 'var(--normal-strong)' },
      info:    { bg: 'var(--info-bg)', fg: 'var(--info-fg)', strong: 'var(--info-strong)' },
    },
    fontFamily: { ui: 'var(--font-ui)', data: 'var(--font-data)' },
  }
}
```

### 18.3 Figma structure

- Variable collections: `Primitives` (no modes) · `Semantic` (modes: Light, Dark) · `Density` (modes: Comfortable, Compact).
- Text styles: `text/display … text/vital-lg`, with Indic line-height handled as a second mode on a `Typography` collection.
- Component library file → published; pattern/template file consumes it; one playground page per component showing all states × both themes.
- Naming mirrors token names 1:1 so dev handoff is a string match.

### 18.4 Token pipeline

Single source of truth: `tokens.json` (W3C DTCG format) → Style Dictionary → CSS vars + Tailwind config + Figma variables (via plugin/API) + iOS/Android exports if needed later.

---

## 19. Governance

- **Versioning:** semver. Color/semantic changes = minor; token renames/removals = major with codemod.
- **Contribution:** proposal → a11y check (both themes, both densities, 2 scripts minimum) → review → docs → release.
- **Definition of done for any component:** both themes ✓ · both densities ✓ · keyboard + SR pass ✓ · Latin + 1 Indic script render check ✓ · print behavior defined (if printable) ✓ · tokens only, zero hardcoded values ✓.
- **Clinical change control:** any change to §6 (clinical semantics) requires sign-off from a clinical stakeholder, not just design — these mappings are patient-safety logic.

---

*End of specification v1.0.0*