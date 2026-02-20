# Olera Design System

Reference for the visual language used across the Olera web platform.

---

## Color Palette

### Primary — Teal/Cyan

The brand color, used for interactive elements, accents, and CTAs.

| Token | Hex | Usage |
|-------|-----|-------|
| primary-50 | `#ecfeff` | Backgrounds, hover states |
| primary-100 | `#cffafe` | Light fills |
| primary-200 | `#a5f3fc` | Active borders |
| primary-400 | `#22d3ee` | Active borders, icons |
| primary-500 | `#06b6d4` | Default buttons |
| primary-600 | `#0891b2` | Button hover, badges |
| primary-700 | `#0e7490` | Links, hover text |
| primary-800 | `#155e75` | Dark accents |
| primary-900 | `#164e63` | Heading accents |

### Warm Backgrounds — Vanilla

Warm neutral backgrounds from the iOS OleraClean design system.

| Token | Hex | Usage |
|-------|-----|-------|
| vanilla-50 | `#fdfbf8` | Subtle background |
| vanilla-100 | `#F9F6F2` | Primary warm background (hero sections) |
| vanilla-200 | `#F5F0EA` | Feature cards, elevated surfaces |
| vanilla-300 | `#F1E5D6` | Warm accent areas |

### Warm Accents

Used sparingly for badges, highlights, and premium indicators.

| Token | Hex | Usage |
|-------|-----|-------|
| warm-400 | `#df9a62` | Accent icons |
| warm-500 | `#d67f42` | Badges (e.g., "Top Rated") |

### Gray Scale (Untitled UI)

Neutral grays for text, borders, and backgrounds.

| Token | Hex | Usage |
|-------|-----|-------|
| gray-25 | `#FCFCFD` | Card backgrounds |
| gray-50 | `#F9FAFB` | Page backgrounds |
| gray-100 | `#F2F4F7` | Subtle borders, dividers |
| gray-200 | `#EAECF0` | Borders |
| gray-300 | `#D0D5DD` | Input borders |
| gray-400 | `#98A2B3` | Placeholder text |
| gray-500 | `#667085` | Secondary text |
| gray-600 | `#475467` | Body text |
| gray-700 | `#344054` | Dark body text |
| gray-900 | `#101828` | Headings, primary text |

### Semantic Colors

- **Success**: green scale (`success-50` through `success-900`) — confirmations, positive states
- **Warning**: amber scale (`warning-50` through `warning-900`) — star ratings (`warning-400`), alerts
- **Error**: red scale (`error-50` through `error-900`) — destructive actions, form errors

---

## Typography

### Font Families

| Class | Fonts | Usage |
|-------|-------|-------|
| `font-sans` | Inter, system-ui | All UI text — body, labels, buttons |
| `font-serif` | "New York", Georgia | Display headings, hero text, provider names |
| `font-display` | Same as serif | Alias for serif, used interchangeably |

### Type Scale (Untitled UI)

| Class | Size / Line Height | Usage |
|-------|-------------------|-------|
| `text-display-2xl` | 4.5rem / 5.625rem | Landing hero |
| `text-display-xl` | 3.75rem / 4.5rem | Section hero |
| `text-display-lg` | 3rem / 3.75rem | Page titles |
| `text-display-md` | 2.25rem / 2.75rem | Section headings |
| `text-display-sm` | 1.875rem / 2.375rem | Sub-sections |
| `text-display-xs` | 1.5rem / 2rem | Card headings |
| `text-text-xl` | 1.25rem / 1.875rem | Large body |
| `text-text-lg` | 1.125rem / 1.75rem | Provider names |
| `text-text-md` | 1rem / 1.5rem | Default body |
| `text-text-sm` | 0.875rem / 1.25rem | Small text, labels |
| `text-text-xs` | 0.75rem / 1.125rem | Captions, badges |

### Heading Patterns

- **Page hero**: `font-serif text-display-lg md:text-display-xl font-bold text-gray-900`
- **Browse heading**: `font-serif text-2xl md:text-3xl font-bold text-gray-900`
- **Section heading**: `font-semibold text-text-xl text-gray-900`
- **Card title**: `font-serif font-bold text-lg text-gray-900`

---

## Spacing

Based on a **4px grid** (Untitled UI system).

Common spacings: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px`

- **Card padding**: `p-4` (16px) to `p-5` (20px)
- **Section gaps**: `gap-4` (16px) for tight, `gap-6` (24px) for comfortable
- **Page padding**: `px-4 sm:px-6 lg:px-8`
- **Max content width**: `max-w-7xl` (80rem / 1280px)

---

## Border Radius

| Token | Size | Usage |
|-------|------|-------|
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 10px | Cards, dropdowns |
| `rounded-xl` | 12px | Feature cards, images |
| `rounded-2xl` | 16px | Map container, hero images |
| `rounded-full` | 9999px | Pills, badges, avatars, filter buttons |

---

## Shadows (Untitled UI)

| Token | Usage |
|-------|-------|
| `shadow-xs` | Subtle depth (form inputs) |
| `shadow-sm` | Cards at rest |
| `shadow-md` | Card hover, dropdowns |
| `shadow-lg` | Elevated modals, map popups |
| `shadow-xl` | Primary dropdowns |

---

## Component Patterns

### Cards

- **Background**: `bg-white`
- **Border**: `border border-gray-200`
- **Radius**: `rounded-xl`
- **Shadow**: `shadow-sm` at rest, `shadow-md` on hover
- **Hover**: `hover:shadow-md hover:border-gray-300 transition-all duration-200`

### Buttons

- **Primary**: `bg-primary-600 text-white rounded-lg hover:bg-primary-700`
- **Secondary**: `border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50`
- **Ghost**: `text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg`
- **Pill (filter)**: `rounded-full border border-gray-300 text-gray-700 px-4 h-9`
  - Active: `border-2 border-primary-400 text-gray-900`

### Badges

- **Teal badge**: `bg-primary-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full`
- **Warm badge**: `bg-warm-500 text-white text-xs font-semibold px-3 rounded-full`
- **Category pill**: `border border-gray-200 text-gray-600 bg-gray-50 text-xs font-medium px-2 py-0.5 rounded-full`

### Star Rating

- **Star icon**: `text-warning-400` (filled), `text-gray-300` (empty)
- **Rating text**: `font-semibold text-gray-900`

---

## Page Layout Patterns

### Hero to Content

Many pages use a warm vanilla hero section transitioning to white content:

```
+-----------------------------------+
|  Vanilla Hero (vanilla-100 bg)    |
|  Serif heading, centered          |
|  Subtitle text                    |
|  CTA button                       |
+-----------------------------------+
+-----------------------------------+
|  White Content (bg-white)         |
|  Cards, lists, details            |
+-----------------------------------+
```

### Browse / City Page

Split layout with scrollable list and sticky map:

```
+--Filter bar (sticky)-------------------+
| [Location] [Type] [Rating] [Payments] |
+---------+-----------+------------------+
| Left    | Right     |
| (scroll)| (map)     |
|         |           |
| Heading | Leaflet   |
| Sort    | markers   |
|         |           |
| Card    |           |
| Card    |           |
| Card    |           |
|         |           |
| Paging  |           |
+---------+-----------+
| Mobile: Cards only, no map            |
+---------------------------------------+
```

### Provider Detail Page

Full-width hero image with vanilla section then white content sections.

```
+-----------------------------------+
|  Hero Image (full bleed)          |
+-----------------------------------+
|  Vanilla section (vanilla-100)    |
|  Provider name (serif), rating    |
+-----------------------------------+
|  White content sections           |
|  About, Services, Pricing, etc.   |
+-----------------------------------+
```
