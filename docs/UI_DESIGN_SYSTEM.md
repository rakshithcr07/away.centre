# UI Design System

Design tokens, components, and patterns for the Away Intelligence dashboard.

---

## 1. Design Principles

1. **Dark-first** — reduces eye strain for daily sales use
2. **Score-driven** — color immediately communicates intent level
3. **Data-dense** — tables and KPIs optimized for scanning
4. **Action-oriented** — every view leads to a next step (contact, review, nurture)
5. **Minimal chrome** — content over decoration

---

## 2. Color Palette

### Brand — Away Green

| Token | Hex | Usage |
|-------|-----|-------|
| `away-400` | `#4ade80` | High scores, active links |
| `away-500` | `#22c55e` | Primary buttons, progress bars |
| `away-600` | `#16a34a` | Button backgrounds, logo |
| `away-700` | `#15803d` | Avatar backgrounds |

### Surface (Dark Theme)

| Token | Hex | Usage |
|-------|-----|-------|
| `surface` | `#0f1419` | Page background |
| `surface-card` | `#1a1f2e` | Card backgrounds |
| `surface-border` | `#2a3142` | Borders, dividers |
| `surface-hover` | `#242b3d` | Row hover, input backgrounds |

### Semantic Colors

| Purpose | Color | Class |
|---------|-------|-------|
| High score (≥75) | Green | `score-high` / `text-away-400` |
| Medium score (50-74) | Amber | `score-medium` / `text-amber-400` |
| Low score (<50) | Red | `score-low` / `text-red-400` |
| Hiring signal | Blue | `badge-hiring` |
| Funding signal | Emerald | `badge-funding` |
| Social signal | Purple | `badge-social` |
| Expansion signal | Amber | `badge-expansion` |

---

## 3. Typography

**Font:** Inter (Google Fonts)

| Element | Size | Weight | Class |
|---------|------|--------|-------|
| Page title | 24px | Bold | `text-2xl font-bold` |
| Section title | 18px | Semibold | `text-lg font-semibold` |
| Body | 14px | Regular | `text-sm` |
| Label | 12px | Regular | `text-xs text-gray-500` |
| Score (large) | 24px | Semibold | `text-2xl font-semibold` |
| Table header | 14px | Medium | `text-sm font-medium text-gray-400` |

---

## 4. Spacing & Layout

```
┌──────────────────────────────────────────────────┐
│ Sidebar (256px fixed) │ Main Content (fluid)      │
│                       │  padding: 32px (p-8)      │
│  Logo + nav           │                           │
│  User profile         │  Header                   │
│                       │  Content grid             │
└──────────────────────────────────────────────────┘
```

| Token | Value | Usage |
|-------|-------|-------|
| Sidebar width | 256px (`w-64`) | Fixed left nav |
| Main padding | 32px (`p-8`) | Content area |
| Card padding | 24px (`p-6`) | Card interiors |
| Grid gap | 16-24px (`gap-4` / `gap-6`) | Between cards |
| Border radius | 12px (`rounded-xl`) | Cards |
| Border radius (buttons) | 8px (`rounded-lg`) | Buttons, inputs |

---

## 5. Components

### 5.1 Card

```html
<div class="card">
  <!-- bg-surface-card, border, rounded-xl, p-6 -->
</div>
```

### 5.2 Buttons

| Variant | Class | Usage |
|---------|-------|-------|
| Primary | `btn-primary` | Sync CRM, main actions |
| Secondary | `btn-secondary` | Recalculate, cancel |

### 5.3 Badges

Signal type badges — pill shape, color-coded background at 20% opacity:

```
HIRING    → blue
FUNDING   → emerald
SOCIAL    → purple
EXPANSION → amber
CRM synced → green
CRM failed → red
```

### 5.4 KPI Card

```
┌─────────────────────────┐
│ Title (gray-400)    [icon]│
│ 42 (white, 3xl bold)     │
│ subtitle (gray-500, xs)  │
└─────────────────────────┘
```

### 5.5 Score Display

Scores use semantic color classes based on value:

```typescript
function getScoreClass(score: number | null): string {
  if (score >= 75) return 'score-high';    // green
  if (score >= 50) return 'score-medium';  // amber
  return 'score-low';                       // red
}
```

### 5.6 Data Table

- Full-width inside card (card `p-0`, table cells `p-4`)
- Header row: `text-gray-400`, bottom border
- Body rows: hover `bg-surface-hover`, bottom border at 50% opacity
- Horizontal scroll on mobile (`overflow-x-auto`)

### 5.7 Signal Timeline

- Left border accent: `border-l-2 border-away-600`
- Badge + date on same line
- Signal text below in `text-gray-300`

### 5.8 Sales Queue Columns

Each category has a tinted card border:

| Category | Border Color |
|----------|-------------|
| Immediate Outreach | `border-away-500/50` |
| Nurture | `border-amber-500/50` |
| Manual Review | `border-blue-500/50` |
| Ignored | `border-gray-500/30` |

---

## 6. Icons

Library: **Lucide React**

| Icon | Usage |
|------|-------|
| `Zap` | Logo |
| `LayoutDashboard` | Dashboard nav |
| `Building2` | Leads nav |
| `Search` | Signal Explorer nav |
| `Users` | Sales Queue nav |
| `Target` | High Intent KPI |
| `Radio` | New Signals KPI |
| `Send` | CRM KPI |
| `TrendingUp` | Conversion KPI |
| `RefreshCw` | Recalculate action |
| `Upload` | CRM sync action |
| `ExternalLink` | Website links |
| `Mail` | Contact email |
| `User` | Contact avatar |
| `Phone` | Immediate outreach |
| `Clock` | Nurture |
| `Eye` | Manual review |
| `Ban` | Ignored |

---

## 7. States

### Empty State

Centered text in card:
```
text-gray-400, py-12, text-center
"No companies found. Run the pipeline to collect signals."
```

### Loading State

Buttons show spinning `RefreshCw` icon when action in progress.

### Error State (API down)

Dashboard falls back to zero KPIs and empty tables — no error boundary crash.

### Review Required

Amber badge: `Requires Review` on outreach sections when `ai_confidence < 0.70`.

---

## 8. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Table horizontal scroll, KPI grid 1 column |
| Tablet (768px+) | KPI grid 2 columns |
| Desktop (1024px+) | KPI grid 5 columns, sidebar visible |
| Wide (1280px+) | 3-column dashboard grid |

---

## 9. File Locations

| Asset | Path |
|-------|------|
| Global styles | `frontend/src/app/globals.css` |
| Tailwind config | `frontend/tailwind.config.ts` |
| Layout (sidebar) | `frontend/src/components/layout/Sidebar.tsx` |
| KPI component | `frontend/src/components/dashboard/KpiCard.tsx` |
| Score utilities | `frontend/src/lib/api.ts` |

---

## 10. Do's and Don'ts

**Do:**
- Use semantic score colors consistently
- Keep signal badges color-coded by type
- Use `away-` green for primary actions only
- Maintain dark surface hierarchy (page → card → hover)

**Don't:**
- Use light mode (not implemented)
- Mix score colors arbitrarily
- Use more than 2 button styles per page section
- Add decorative gradients or illustrations (data-first UI)
