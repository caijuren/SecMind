# SecMind Desktop Typography Standard (Light Theme)

This guide defines desktop text contrast and hierarchy for marketing pages (`/`, `/solutions`, `/pricing`, `/docs`) in light theme.

## 1) Priority Rule

Readability is always first.  
If a style looks refined but reduces contrast, choose the higher-contrast option.

## 2) Text Color Tokens (Desktop)

- Primary title/content: `text-slate-900`
- Secondary heading/strong label: `text-slate-700`
- Body paragraph: `text-slate-500`
- Meta/help/caption/footer small text: `text-slate-500` (avoid `text-slate-400` on white backgrounds)
- Accent text on light surfaces: `text-cyan-700` (avoid `text-cyan-300/400` on white backgrounds)
- Inverse text on strong gradient buttons/backgrounds: `text-white`

## 3) Typography Levels

- H1 hero: `text-5xl~7xl`, `font-extrabold`
- H2 section title: `text-3xl~4xl`, `font-bold`
- H3 card title: `text-lg~2xl`, `font-semibold|bold`
- Body: `text-sm|text-base|text-lg` + `text-slate-500`
- Caption/meta: `text-xs` + `text-slate-500`

## 4) Contrast Safety Checklist

Before merging:

- No `text-slate-400` on white/light cards for key reading content
- No `text-cyan-300`/`text-cyan-400` as normal text on white/light cards
- Buttons on gradient background use `text-white`
- Outline buttons on white background use `text-cyan-700` or `text-slate-700`
- Footer and legal lines remain legible (`text-slate-500` preferred on desktop)

## 5) Buttons (Desktop Visual Baseline)

- Primary CTA:
  - `rounded-xl`
  - subtle border (`border-cyan-400/20`)
  - gradient fill (`from-cyan-500 to-teal-500`)
  - `text-white`
  - clear hover elevation
- Secondary CTA:
  - `rounded-xl`
  - `bg-white`
  - `text-cyan-700` (or `text-slate-700` for neutral actions)
  - gentle hover background (`hover:bg-cyan-50` / `hover:bg-slate-50`)

## 6) Do / Don't

Do:

- Keep long-form copy at `text-slate-500` for stable desktop readability
- Use `text-slate-900` for important numeric values and key labels
- Keep visual hierarchy consistent across all promo pages

Don't:

- Use light accent text on white cards for body content
- Mix multiple gray levels randomly in the same card type
- Trade contrast for style effects

