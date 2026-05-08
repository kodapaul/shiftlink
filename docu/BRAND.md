# BRAND & DESIGN SYSTEM

The visual language of ShiftLink. Read before doing any UI work.

## North star

- **Theme reference:** [eucalyptus.health](https://eucalyptus.health) — copy the *theme* only. Colors, typography, radius, component aesthetic, visual register. **Do not copy their layout.** ShiftLink's page structure is original to ShiftLink.
- **Information-architecture reference:** [upaged.com](https://upaged.com) — for the *pattern* of a two-sided marketplace (dual CTA, parallel audience sections). Borrow the *structure idea*, not the visuals.

The tension between these two references is the brief: take a busy commercial pattern (two-sided marketplace) and render it in a vibrant, editorial visual language.

### What "copy theme, not layout" means

| Copy (theme) | Do NOT copy (layout) |
|---|---|
| Color palette and how colors combine | Specific page structure (eucalyptus.health is a multi-clinic brand site — different product) |
| Typography (Fraunces + Inter, weights, tracking) | Hero composition (their hero is image + headline + nav; ours is a marketplace pitch) |
| Border radius scale and softness | Section order (mission → research → team is *their* product story, not ours) |
| Card aesthetic (flat, generous padding, pill tags) | Specific multi-image grids or content patterns unique to their brand |
| Color-block accent cards (sage / blush / marigold trios) | The exact text/CTA arrangements they use |
| Visual register (vibrant, warm, editorial) | Their navigation pattern |

If you find yourself studying a specific eucalyptus page to figure out *where* something should go, stop. Use the brief and the upaged dual-CTA pattern for *what* and *where*; use eucalyptus only for *how it should look*.

## Anti-patterns (what we are NOT)

- ❌ Default Bootstrap / Tailwind UI templates
- ❌ Default shadcn aesthetic (slate/zinc, soft shadows)
- ❌ Material Design / Vuetify look
- ❌ Corporate healthcare blue + white
- ❌ Stock-photo nurse imagery
- ❌ Dense SaaS dashboard layouts
- ❌ Restrained / muted earth-tone palettes (this is the trap I fell into first — eucalyptus is *vibrant*, not muted)

## Typography

Type does ~60% of the visual work. Get this right first.

| Role | Font | Weights | Usage |
|---|---|---|---|
| Display / Headlines | **Fraunces** (variable, optical sizing) | 500, 600, 700 | Hero headline, section titles, large numbers — use heavier weights (600+) for the chunky-serif eucalyptus feel |
| Body / UI | **Inter** | 400, 500, 600 | Body copy, navigation, buttons, form labels, microcopy |

### Loading

Both fonts are loaded from Google Fonts via `<link>` tags in `index.html`. Use the variable versions and enable optical sizing for Fraunces.

### Type scale

Use a deliberate, editorial scale — bigger than a typical SaaS app:

| Token | Size | Line height | Usage |
|---|---|---|---|
| `text-display` | 4.5rem (72px) → 6rem (96px) on desktop | 1.05 | Hero headline only |
| `text-h1` | 3rem (48px) → 4rem (64px) | 1.1 | Section titles |
| `text-h2` | 2rem (32px) → 2.5rem (40px) | 1.15 | Sub-section titles |
| `text-h3` | 1.5rem (24px) | 1.25 | Card titles, smaller headings |
| `text-lead` | 1.25rem (20px) | 1.5 | Hero subhead, intro paragraphs |
| `text-body` | 1rem (16px) | 1.6 | Default body |
| `text-small` | 0.875rem (14px) | 1.5 | Microcopy, labels |
| `text-caption` | 0.75rem (12px) | 1.4 | Eyebrow text, footnotes (use letter-spacing) |

### Typographic rules

- **Display headlines use Fraunces.** Body uses Inter. Never the reverse.
- **Tight tracking on large display text** (`tracking-tight` or custom -0.02em).
- **Wider tracking on small caps / eyebrow text** (`tracking-widest`, uppercase, smaller size).
- **Line length capped at ~65–75ch** for body paragraphs.
- **Numbers in display contexts use Fraunces' tabular figures.**

## Color palette

Eucalyptus.health is **vibrant, not muted** — bold dark-green hero blocks alternate with cream content sections punctuated by vivid yellow, soft coral, and pale-sage accent cards. Seven tokens.

| Token | Hex | Usage |
|---|---|---|
| `forest` | `#043F2E` | Primary brand. Hero backgrounds, primary buttons in cream contexts, headings on cream. |
| `cream` | `#F0EDE3` | Page background — warm cream, never pure white. |
| `bone` | `#FAF6EE` | Card surfaces — slightly lighter than `cream` so cards feel raised without shadow. |
| `ink` | `#1A1A1A` | Primary text on light surfaces. Soft black, not `#000`. |
| `marigold` | `#F0BB37` | Vivid yellow. Primary CTA accent — buttons in dark-green hero, tertiary content cards. |
| `blush` | `#E8A6A6` | Soft coral. Secondary accent — urgency tags, secondary content cards. |
| `sage` | `#B8C9A8` | Pale green. Tertiary accent for content blocks and shift-type tags. |
| `mist` | `#E0DCCF` | Warm beige. Borders, dividers, muted secondary surfaces. |

### Usage rules

- **No pure white (`#FFFFFF`).** Use `cream` (page) or `bone` (cards). Pure white feels clinical.
- **No pure black (`#000000`).** Use `ink`. Soft black, more editorial.
- **`forest` is the dominant brand color.** Hero blocks live in forest. Most pages have at least one full-bleed forest section.
- **`marigold` is the loudest accent — use it for key CTAs only.** It's vivid; if everything is marigold, nothing is.
- **`blush`, `sage`, and `marigold` rotate as block colors.** Audience cards / category cards use these full-bleed (no border) on a `cream` page background.
- **`bone` cards on `cream` pages.** A subtle 1px `mist` border or no border at all — never shadows.
- **Text on accent blocks uses `ink`.** Text on `forest` uses `cream`.

### Background-by-context

| Context | Surface |
|---|---|
| Page wrapper | `cream` |
| Hero / major brand statement | `forest` (with `cream` text) |
| Card / shift card | `bone` on `cream` |
| Audience or category card | `marigold`, `blush`, or `sage` block (with `ink` text) |
| Form input | `bone` with `mist` border |

## Spacing rhythm

Editorial layouts breathe. Sections use big vertical padding.

| Token | Value | Usage |
|---|---|---|
| `space-section` | 8rem (128px) | Between standard sections |
| `space-section-lg` | 12rem (192px) | Around hero / major breaks |
| `space-gutter` | 1.5rem (24px) | Default container gutter |
| `space-stack-sm` | 0.75rem (12px) | Tight vertical rhythm |
| `space-stack-md` | 1.5rem (24px) | Default vertical rhythm |
| `space-stack-lg` | 3rem (48px) | Generous vertical rhythm |

**Rule of thumb:** if a section feels cramped, double the vertical padding before adjusting anything else.

## Layout

- **Max content width:** 1200px (`max-w-screen-xl`) for most sections, 720px (`max-w-3xl`) for prose-heavy sections.
- **Asymmetric is allowed and encouraged.** Magazine-style layouts (e.g., headline left + image right at unequal widths) feel more editorial than perfectly symmetric grids.
- **Mobile-first.** Design the mobile layout first, then upgrade for `md:` and `lg:` breakpoints.

## Component philosophy

Translate the typographic restraint into UI components.

### Buttons

- **No drop shadows.** Flat fills only.
- **Generous border radius:** `rounded-lg` (12px) by default — soft and modern. `rounded-full` is acceptable for pill-style CTAs in the hero.
- **Generous padding:** `px-6 py-3` minimum for primary CTAs.
- **Variants:**
  - **Primary:** `bg-ink text-bone` or `bg-sage text-bone`
  - **Secondary:** `border border-ink text-ink bg-transparent`
  - **Ghost:** `text-ink underline-offset-4 hover:underline` (text-only, for tertiary actions)

### Inputs

- **Bottom-border-only style is preferred** for the editorial feel — `border-b border-ink/20 focus:border-ink` with no other borders.
- Alternative: thin all-around border `border border-mist focus:border-ink rounded-lg`.
- **Match the global radius** — `rounded-lg` (12px) when using all-around borders.
- **Generous height:** `py-3` minimum.
- Labels above the input, small caps style optional (`text-caption uppercase tracking-widest`).

### Cards (shift cards)

- **Flat.** No shadows.
- **Generous radius** — `rounded-xl` (16px) or `rounded-2xl` (20px). Soft, modern, friendly.
- **Thin border** in `mist`, or no border with whitespace doing the separation.
- **Generous internal padding** — `p-8` minimum.
- **Typography hierarchy inside the card** carries the visual weight (large role name in Fraunces, smaller details in Inter).

### Dividers / borders

- Use `border-mist` for any divider.
- Hairline borders (1px) — never thicker.
- Often, more whitespace removes the need for a border at all.

## shadcn-vue theming

shadcn-vue uses CSS variables. We override them in `src/assets/main.css` to enforce our palette.

### Required override block

```css
@layer base {
  :root {
    --background: 40 33% 95%;        /* bone */
    --foreground: 0 0% 10%;          /* ink */

    --card: 40 33% 95%;
    --card-foreground: 0 0% 10%;

    --popover: 40 33% 95%;
    --popover-foreground: 0 0% 10%;

    --primary: 130 10% 38%;          /* sage */
    --primary-foreground: 40 33% 95%;

    --secondary: 38 18% 88%;         /* mist */
    --secondary-foreground: 0 0% 10%;

    --muted: 38 18% 88%;
    --muted-foreground: 0 0% 35%;

    --accent: 30 30% 65%;            /* clay */
    --accent-foreground: 0 0% 10%;

    --destructive: 0 60% 45%;
    --destructive-foreground: 40 33% 95%;

    --border: 38 18% 85%;
    --input: 38 18% 85%;
    --ring: 130 10% 38%;

    --radius: 0.75rem;               /* 12px — generous, modern */
  }
}
```

### Per-component overrides

When you `npx shadcn-vue add <component>`, open the generated file in `src/components/ui/` and:

- Remove any drop-shadow classes (`shadow-sm`, `shadow`, `shadow-md`, etc.)
- Keep generous radius — defaults from shadcn-vue (`rounded-md`/`rounded-lg`) align with our 12px base; only adjust if a specific component looks wrong
- Increase padding values where they feel cramped
- Swap any `font-medium` on display text to use `font-serif` (Fraunces) where appropriate

Document any component-level overrides in DOCUMENTATIONS.md so they are not accidentally reverted.

## Imagery

- **Avoid stock-photo healthcare imagery.** It reads as generic.
- **Prefer:** abstract photography (textures, hands at work, nature), editorial portraits if any, or no imagery at all.
- **If no good imagery is available, lean harder on typography.** A well-set headline beats a bad photo.

## Tone of voice

- **Direct, warm, professional.** Not chirpy, not corporate.
- **Short sentences.** No marketing buzzwords ("revolutionary," "seamless," "world-class").
- **Specific over vague.** "240+ facilities" beats "thousands of facilities."
- **Address the user directly.** "You pick the shifts you want" — not "professionals are empowered to choose."

## Quick checklist before committing UI

- [ ] No pure black or pure white in the design
- [ ] Display text uses Fraunces, body uses Inter
- [ ] No drop shadows
- [ ] Border radius is generous (12px+) on buttons, cards, inputs
- [ ] Section vertical padding is at least 96px on desktop
- [ ] Buttons are flat with generous padding
- [ ] Mobile layout works at 375px width
- [ ] Focus states are visible (keyboard nav works)
- [ ] No magic numbers — all spacing/colors come from tokens
