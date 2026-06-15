# Vela Design Tokens

Source: Figma file `zBAzDAE9t9xWsA3xThAZ7Z`, Page 1.

Inspected frames:
- `35:2` Flux
- `40:2303` Category expand
- `38:1643` Movements Expand
- `36:706` AEon
- `35:26` Fav

The Figma file is a fast iteration file, so these values translate observed layer values into an implementation-ready token system. When Figma export and product direction differ, product direction wins.

## Foundations

### Viewports

| Token | Value | Notes |
| --- | ---: | --- |
| `--viewport-mobile-w` | `390px` | Figma mobile frame width. |
| `--viewport-flux-h` | `844px` | Flux, Category expand, Movements Expand. |
| `--viewport-aeon-h` | `966px` | Analytics page is taller/scroll-oriented. |
| `--app-pad-x` | `18px` | Main horizontal page padding. |
| `--app-pad-y` | `24px` | Top/bottom frame padding. |

### Colors

| Token | Value | Observed usage |
| --- | --- | --- |
| `--color-bg` | `#0C0F0E` | App base background. |
| `--color-bg-raised` | `#0C0F0E` | Movement overlay panel. |
| `--color-bg-modal` | `rgba(12, 15, 14, 0.88)` | Entry expanded modal. |
| `--color-overlay` | `rgba(0, 0, 0, 0.60)` | Expansion overlays. |
| `--color-overlay-soft` | `rgba(0, 0, 0, 0.30)` | Current Category frame export; keep only if a lighter state is needed. |
| `--color-text` | `#6A7873` | Primary low-contrast sage text. |
| `--color-text-strong` | `#869D94` | Movement names, CTA surface, selected controls. |
| `--color-text-muted` | `rgba(106, 120, 115, 0.75)` | Captions, helper text, inactive analytics labels. |
| `--color-text-inverse` | `#1E1E1E` | CTA text over sage. |
| `--color-text-inverse-deep` | `#0C0F0E` | Selected category/installment text. |
| `--color-text-subtle` | `#2F3734` | Disabled/ghost numeric zero, month labels, divider-adjacent text. |
| `--color-stroke` | `#2F3734` | Card, tile, modal, divider base. |
| `--color-green` | `#247E5C` | Semantic positive/status accent. |
| `--color-red` | `#A30606` | Semantic negative base. |
| `--color-red-soft` | `rgba(163, 6, 6, 0.30)` | Expense bars and heatmap danger cells. |
| `--color-cta` | `#869D94` | Primary CTA and selected controls. |
| `--color-input-fill` | `rgba(106, 120, 115, 0.11)` | Description field. |

### Backgrounds

| Token | Value | Notes |
| --- | --- | --- |
| `--bg-base` | `linear-gradient(90deg, #0C0F0E 0%, #0C0F0E 100%)` | Solid base from Figma export. |
| `--bg-light-source` | radial, effective opacity `0.32` | Green light source from top-right/off-canvas. |
| `--bg-card` | `linear-gradient(155deg, rgba(217,217,217,0.08) 16%, rgba(115,115,115,0.08) 100%)` | Observed angles vary roughly `150deg` to `166deg`; standardize to `155deg`. |
| `--bg-fav` | `linear-gradient(143deg, #0D1311 5%, #1A211E 95%)` | Fav frame background. |
| `--bg-scroll-fade` | `linear-gradient(to bottom, rgba(0,0,0,0) 92%, rgba(0,0,0,0.93) 100%)` | Movement overlay bottom fade. |

Recommended CSS for the app background:

```css
background:
  radial-gradient(
    ellipse at 130% -8%,
    rgba(36, 126, 92, 0) 0%,
    rgba(24, 70, 53, 0.16) 50%,
    rgba(18, 43, 34, 0.24) 75%,
    rgba(12, 15, 14, 0.32) 100%
  ),
  #0c0f0e;
```

## Typography

Product direction:
- Instrument Serif is used for impactful information.
- Albert Sans is used for trivial, operational, and supporting text.
- Figma export still contains some `Inter:Light`; normalize those to Albert Sans.
- Type follows a 2px step. Any observed `9px` should be normalized to `10px`.
- Smallest allowed font size is `8px`.
- Use tabular numerals for money values where Albert Sans is used.

### Font Tokens

| Token | Value |
| --- | --- |
| `--font-sans` | `"Albert Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` |
| `--font-accent` | `"Instrument Serif", Georgia, "Times New Roman", serif` |
| `--font-fav` | `"Jacquard 12", "Instrument Serif", serif` |

### Type Scale

| Token | Size | Family | Usage |
| --- | ---: | --- | --- |
| `--fs-micro` | `8px` | Albert Sans | Modal eyebrow, category labels, small status pills. |
| `--fs-tiny` | `10px` | Albert Sans | Chart legend, allocation helper, normalized stat labels. |
| `--fs-caption` | `12px` | Albert Sans | Captions, metadata, stat values, inactive tabs. |
| `--fs-action` | `14px` | Albert Sans Medium | CTA labels, amount list values. |
| `--fs-card-title` | `16px` | Instrument Serif | Compact card titles, metric titles. |
| `--fs-list-title` | `18px` | Instrument Serif | Movement names. |
| `--fs-subsection` | `20px` | Instrument Serif | Modal subheads/month breaks. |
| `--fs-section` | `24px` | Instrument Serif | Section headers, large metric titles, currency prefix. |
| `--fs-brand` | `32px` | Instrument Serif | Flux/AEon top label. |
| `--fs-value` | `40px` | Instrument Serif | Analytics values, allocation percentages. |
| `--fs-entry-value` | `48px` | Instrument Serif | Entry amount. |

### Type Roles

| Role | Token Composition |
| --- | --- |
| `text-brand` | `32px / normal`, Instrument Serif, `#6A7873` |
| `text-section` | `24px / normal`, Instrument Serif, `#6A7873` |
| `text-card-title` | `16px / normal`, Instrument Serif, `#6A7873` |
| `text-movement-title` | `18px / normal`, Instrument Serif, `#869D94` |
| `text-money-xl` | `48px / normal`, Instrument Serif |
| `text-money-lg` | `40px / normal`, Instrument Serif |
| `text-money-md` | `32px / normal`, Instrument Serif |
| `text-caption` | `12px / normal`, Albert Sans Regular/Light |
| `text-micro` | `8px / normal`, Albert Sans Light |

## Spacing

Spacing direction from product: `4, 8, 12, 16, 24, 32, 40`.

Observed additions:
- `18px` is the main page gutter and should remain a named layout token.
- `22px` is bottom-nav icon gap.
- `9px` appears in the category grid x-gap; use only if exact modal fit requires it.
- `10px` appears in stat-strip gaps and movement list row gaps.
- `11px` appears in AEon allocation row gap.

| Token | Value | Usage |
| --- | ---: | --- |
| `--space-1` | `4px` | Tight card/chart gaps. |
| `--space-2` | `8px` | Default component padding/gap. |
| `--space-3` | `12px` | CTA padding, card vertical padding. |
| `--space-4` | `16px` | Medium stack gap. |
| `--space-5` | `24px` | Top/bottom bars, large rhythm gap. |
| `--space-6` | `32px` | Large section distance. |
| `--space-7` | `40px` | Major page distance. |
| `--space-page-x` | `18px` | Screen gutter. |
| `--space-nav-gap` | `22px` | Bottom nav icon gap. |
| `--space-list-gap` | `10px` | Movement list row stack. |
| `--space-carousel-gap` | `8px` | Metric carousel cards. |

## Radius, Stroke, Blur

| Token | Value | Usage |
| --- | ---: | --- |
| `--radius-card` | `8px` | Cards, CTA, category tiles, input fields. |
| `--radius-graph` | `4px` | Heatmap cells and bar chart bars. |
| `--radius-panel` | `12px` | Movements overlay panel observed in Figma. Use sparingly; cards stay `8px`. |
| `--radius-pill` | `999px` | Period pills, nav island, status chips. |
| `--stroke-thin` | `0.5px` | Fine/active outlines. |
| `--stroke-default` | `1px` | Cards, modal, tiles. |
| `--blur-overlay` | `4px` | Product direction. MCP export shows `2px`; use `4px` as the design token. |

## Components

### App Shell

| Token | Value |
| --- | --- |
| `--shell-width` | `390px` reference, responsive `max-width: 560px` in app can remain. |
| `--topbar-pad` | `24px 18px` |
| `--topbar-icon` | `32px` |
| `--bottom-nav-pad` | `8px 18px` |
| `--bottom-nav-gap` | `22px` |
| `--bottom-nav-icon` | `24px` |
| `--bottom-nav-mark` | `24px x 30px` |

### Cards

| Token | Value |
| --- | --- |
| `--card-bg` | `var(--bg-card)` |
| `--card-border` | `1px solid var(--color-stroke)` |
| `--card-radius` | `8px` |
| `--card-pad-x` | `8px` |
| `--card-pad-y` | `12px` |
| `--card-gap` | `4px` or `8px` depending density |

Observed card sizes:
- Compact entry card: outer container `354px` wide inside `18px` gutters, about `181px` visible height.
- Flux accounts card row: `128px` high, `8px` gap.
- Flux investment card: `213px` wide.
- AEon metric carousel cards: `173px x 147px`.
- AEon allocation cards: about `111px` wide.

### CTA

| Token | Value |
| --- | --- |
| `--cta-bg` | `#869D94` |
| `--cta-fg` | `#1E1E1E` |
| `--cta-radius` | `8px` |
| `--cta-pad` | `8px 12px` |
| `--cta-gap` | `12px` |
| `--cta-font` | Albert Sans Medium, `14px` |
| `--cta-icon` | `24px` |

### Pills and Status

| Token | Value |
| --- | --- |
| `--pill-radius` | `999px` |
| `--pill-pad-period` | `8px` |
| `--pill-active-bg` | `#6A7873` |
| `--pill-active-fg` | `#1E1E1E` |
| `--status-border` | `0.5px solid #247E5C` |
| `--status-fg` | `#247E5C` |
| `--status-pad` | `2px 8px` |
| `--status-font` | Albert Sans Regular, `8px` |

### Entry Expanded Modal

| Token | Value |
| --- | --- |
| `--entry-modal-w` | `354px` |
| `--entry-modal-h` | `625px` |
| `--entry-modal-pad` | `12px 8px` |
| `--entry-modal-bg` | `rgba(12,15,14,0.88)` |
| `--entry-modal-border` | `1px solid #2F3734` |
| `--entry-modal-radius` | `8px` |
| `--entry-modal-overlay` | `rgba(0,0,0,0.60)` |

Category grid:
- Width `328px`
- Height `175px`
- Columns `4`
- Rows `3`
- Gap `9px 8px`
- Tile padding `12px 8px`
- Tile border `1px solid #2F3734`
- Tile selected background `#869D94`
- Tile icon `18px`
- Tile label `8px`

Installments:
- Button width `48px`
- Button selected height `40px`
- Gap `8px`
- Radius `8px`
- Border `1px solid #2F3734`
- Selected bg `#869D94`

### Movements Overlay

| Token | Value |
| --- | --- |
| `--movement-panel-w` | `354px` |
| `--movement-panel-h` | `644px` |
| `--movement-panel-left` | `18px` in 390px frame |
| `--movement-panel-top` | `77px` |
| `--movement-panel-bg` | `#0C0F0E` |
| `--movement-panel-radius` | `12px` observed |
| `--movement-content-w` | `347px` |
| `--movement-list-pad` | `8px 18px` |
| `--movement-row-icon` | `18px` |
| `--movement-row-title` | `18px`, Instrument Serif |
| `--movement-row-subtitle` | `12px`, Albert Sans ExtraLight |
| `--movement-row-amount` | `14px`, Albert Sans Light |
| `--movement-divider` | `0.5px solid #2F3734` |
| `--movement-bottom-fade` | `rgba(0,0,0,0.93)` |

### AEon Analytics

Metric carousel:
- Card `173px x 147px`
- Card gap `8px`
- Card padding `12px 8px`
- Title `16px` or `24px` depending hierarchy
- Main value `40px`
- Helper `12px`

Monthly spend heatmap:
- Grid `7 x 5`
- Gap `4px`
- Cell radius `4px`
- Cell base `#2F3734`
- Positive overlays: `rgba(134,157,148,0.21)`, `0.25`, `0.48`, and full `#869D94`
- Negative overlay: `rgba(163,6,6,0.30)`

Yearly rhythm:
- Bar group width `20px`
- Income bar width `10px`
- Expense bar width `10px` to `13px`
- Max bar height `146px`
- Bar radius `4px`
- Income color `#6A7873`
- Expense color `rgba(163,6,6,0.30)`
- Month label `12px`, Instrument Serif, `#2F3734`

## Motion and Interaction

Use shadcn-like state rules:
- Default
- Hover/focus for pointer devices
- Pressed/active
- Selected
- Disabled
- Expanded

Recommended timing tokens:

| Token | Value | Usage |
| --- | ---: | --- |
| `--motion-fast` | `120ms` | Pressed/hover feedback. |
| `--motion-base` | `220ms` | Toggle, tab, small panel transitions. |
| `--motion-panel` | `320ms` | Card expansion and modal entry. |
| `--motion-slow` | `420ms` | Background wave and content settle. |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | General UI. |
| `--ease-emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` | Expansions. |

Touch:
- Minimum interactive target: `44px`.
- Icons may be visually smaller inside the target (`18px`, `24px`, `32px`).

## Dither Field

Product direction: dither field can follow the A3Lab starship treatment.

Reference values from A3Lab:
- Shader package: `@paper-design/shaders`
- Shape: `simplex` for ambient field
- Shape: `ripple` for wave/ring moments
- Dither type: `4x4`
- Pixel size: `2`
- Speed: `0.18` for ambient, `0.16` for ripple
- Render scale: `1` for full field, `0.5` for cheap pixelated ripple
- Fallback: static radial halftone dot pattern
- Respect `prefers-reduced-motion`
- Pause or slow when offscreen

Vela adaptation:
- Ambient field color should use `#247E5C`/`#869D94`, not A3Lab copper.
- Expense waves should use `rgba(163,6,6,0.30)` as a tint.
- Contribution/income waves should use sage/green.
- Under overlays, reduce intensity or freeze the field so forms remain legible.

## CSS Variable Draft

```css
:root {
  --font-sans: "Albert Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-accent: "Instrument Serif", Georgia, "Times New Roman", serif;
  --font-fav: "Jacquard 12", "Instrument Serif", serif;

  --color-bg: #0c0f0e;
  --color-bg-raised: #0c0f0e;
  --color-bg-modal: rgba(12, 15, 14, 0.88);
  --color-overlay: rgba(0, 0, 0, 0.6);
  --color-text: #6a7873;
  --color-text-strong: #869d94;
  --color-text-muted: rgba(106, 120, 115, 0.75);
  --color-text-inverse: #1e1e1e;
  --color-text-inverse-deep: #0c0f0e;
  --color-text-subtle: #2f3734;
  --color-stroke: #2f3734;
  --color-green: #247e5c;
  --color-red: #a30606;
  --color-red-soft: rgba(163, 6, 6, 0.3);
  --color-cta: #869d94;
  --color-input-fill: rgba(106, 120, 115, 0.11);

  --bg-card: linear-gradient(155deg, rgba(217, 217, 217, 0.08) 16%, rgba(115, 115, 115, 0.08) 100%);
  --bg-fav: linear-gradient(143deg, #0d1311 5%, #1a211e 95%);

  --fs-micro: 8px;
  --fs-tiny: 10px;
  --fs-caption: 12px;
  --fs-action: 14px;
  --fs-card-title: 16px;
  --fs-list-title: 18px;
  --fs-subsection: 20px;
  --fs-section: 24px;
  --fs-brand: 32px;
  --fs-value: 40px;
  --fs-entry-value: 48px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-page-x: 18px;
  --space-nav-gap: 22px;
  --space-list-gap: 10px;

  --radius-card: 8px;
  --radius-graph: 4px;
  --radius-panel: 12px;
  --radius-pill: 999px;

  --stroke-thin: 0.5px;
  --stroke-default: 1px;
  --blur-overlay: 4px;

  --motion-fast: 120ms;
  --motion-base: 220ms;
  --motion-panel: 320ms;
  --motion-slow: 420ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);
}
```

