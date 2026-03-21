# OmicsTrack — Theme Design

## Design Philosophy

Clean, professional, medical-grade light theme. Inspired by Aceternity UI's component patterns adapted for a clinical research context. Prioritizes readability, accessibility, and trust.

## Color Palette

### Surface Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#F8F9FC` | Page background (warm off-white) |
| `--s1` | `#FFFFFF` | Card / panel surface |
| `--s2` | `#F1F3F7` | Nested card / inset surface |
| `--s3` | `#E8EBF0` | Deeper inset (accordion body) |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--bd` | `#DDE1E9` | Default border |
| `--bdh` | `#C5CBD6` | Border on hover |
| `--bda` | `rgba(0,133,115,0.25)` | Accent-tinted border |

### Primary Accent (Medical Teal)

| Token | Value | Usage |
|-------|-------|-------|
| `--ac` | `#008573` | Primary accent (buttons, active states) |
| `--acd` | `rgba(0,133,115,0.06)` | Accent tint background |
| `--acb` | `rgba(0,133,115,0.12)` | Accent border tint |

### Text Hierarchy

| Token | Value | Usage |
|-------|-------|-------|
| `--tx` | `#1A1D26` | Primary text (near-black) |
| `--tx2` | `#5F6B7A` | Secondary text (muted) |
| `--tx3` | `#A0A8B4` | Tertiary / placeholder |

### Status Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--ok` | `#16A34A` | Success (completed steps, on treatment) |
| `--okd` | `rgba(22,163,74,0.08)` | Success background tint |
| `--okb` | `rgba(22,163,74,0.18)` | Success border tint |
| `--warn` | `#D97706` | Warning (in progress, attention) |
| `--warnd` | `rgba(217,119,6,0.08)` | Warning background tint |
| `--err` | `#DC2626` | Error (validation, alerts) |
| `--errd` | `rgba(220,38,38,0.07)` | Error background tint |
| `--errb` | `rgba(220,38,38,0.15)` | Error border tint |

### Role Colors

| Token | Value | Role | Usage |
|-------|-------|------|-------|
| `--ac` | `#008573` | Admin | Admin badge, primary actions |
| `--ok` | `#16A34A` | Data Entry | Green badge for entry workers |
| `--viewer` | `#4B6BFB` | Supervisor | Blue-gray badge, distinct from Liege |
| `--liege` | `#7C3AED` | Liege | Purple badge, shipments accent |

### Shadows (light theme uses real shadows instead of glows)

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation (inputs) |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Cards on hover |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.10)` | Modals, dropdowns |

## Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| Brand / headings | Syne | 700-800 | 1.15rem - 1.9rem |
| Body / labels | DM Sans | 300-600 | 0.68rem - 0.9rem |
| Code pills | Monospace | 400 | 0.68rem |

## Component Styling

### Cards (Aceternity-inspired)

```
Default:
  background: white
  border: 1px solid var(--bd)
  border-radius: 14px
  box-shadow: var(--shadow-sm)

Hover:
  border-color: var(--bda)
  box-shadow: var(--shadow-md)

Active/Selected:
  border-left: 3px solid var(--ac)
```

### Buttons

```
Primary (btn-ac):
  background: var(--ac)
  color: white
  hover: slightly darker teal

Outline (btn-bd):
  background: transparent
  border: 1px solid var(--bd)
  hover: border darkens

Ghost (btn-ghost):
  background: transparent
  hover: background var(--s2)
```

### Inputs

```
Default:
  background: var(--s2)
  border: 1px solid var(--bd)
  border-radius: 8px

Focus:
  border-color: var(--ac)
  box-shadow: 0 0 0 3px var(--acd)

Disabled (read-only roles):
  opacity: 0.6
  cursor: not-allowed
```

### Navigation (Animated Tabs)

```
Container:
  background: var(--s2)
  border-radius: 10px
  padding: 4px

Tab:
  padding: 10px 18px
  color: var(--tx2)
  font-weight: 500

Active Tab:
  color: var(--tx)
  font-weight: 600

Sliding Indicator (behind active tab):
  background: var(--s1)
  border-radius: 8px
  box-shadow: var(--shadow-sm)
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

### Badges

```
Success (b-ok):    bg: --okd,   text: --ok,     border: --okb
Warning (b-warn):  bg: --warnd, text: --warn
Error (b-err):     bg: --errd,  text: --err,    border: --errb
Accent (b-ac):     bg: --acd,   text: --ac
Muted (b-muted):   bg: --s2,    text: --tx2
Liege (b-liege):   bg: --lieged, text: --liege
Viewer (b-viewer): bg: blue-tint, text: --viewer
```

### Step Progress Bar

```
Inactive step:
  border: 1.5px solid var(--bd)
  color: var(--tx3)
  background: var(--s1)

Active step:
  border-color: var(--ac)
  color: var(--ac)
  background: var(--acd)

Completed step:
  background: var(--ok)
  border-color: var(--ok)
  color: white
  shows checkmark

Connecting line:
  default: var(--bd)
  completed: var(--ok)
```

## Responsive Breakpoints

| Breakpoint | Target | Navigation | Stat Grid | Layout |
|------------|--------|------------|-----------|--------|
| < 480px | Phone | Bottom icon bar | 1 column | Single column, compact padding |
| 481-768px | Tablet | Top tabs (compact) | 2 columns | 2-column forms |
| 769-1024px | Desktop | Top tabs (full) | 4 columns | 2-column forms, max-width container |
| > 1024px | Wide | Top tabs (full) | 4 columns | 960px max-width centered |

## Animations

| Effect | Duration | Easing | Usage |
|--------|----------|--------|-------|
| Page fade-in | 250ms | ease | View transitions |
| Tab indicator slide | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Tab switching |
| Card hover | 200ms | ease | Border/shadow transitions |
| Button press | 150ms | ease | Background/color transitions |
| Accordion open | 250ms | ease | Section expand/collapse |
| Flash notification | 2000ms total | fade in/out | "Saved" confirmation |

## Accessibility

- All text meets WCAG AA contrast ratio on light backgrounds
- Primary accent `#008573` on white = 4.72:1 contrast ratio (passes AA)
- Error red `#DC2626` on white = 4.63:1 (passes AA)
- Focus states use visible ring (`box-shadow: 0 0 0 3px`)
- Touch targets minimum 44x44px for mobile interactions
- Signature pad supports both mouse and touch events
