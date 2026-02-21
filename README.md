# Interactive Chart Viewer

> A reusable Angular chart component that renders **Line**, **Column**, and **Pie** charts from a single configuration object — with **no external chart libraries**.

---

## ✦ Screenshots

<img width="1919" height="880" alt="image" src="https://github.com/user-attachments/assets/5567c30d-dba3-4969-b58c-66e5731b9564" />
<img width="1909" height="853" alt="image" src="https://github.com/user-attachments/assets/0e399678-297a-419d-8ed5-d0b46478a39f" />
<img width="1907" height="872" alt="image" src="https://github.com/user-attachments/assets/3cb8e20b-2067-4f3d-aafa-163c948d16a4" />
<img width="1899" height="875" alt="image" src="https://github.com/user-attachments/assets/1260b4fd-5b56-4f8b-a26e-435401dfc0cf" />

---

## ✦ Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Open in browser
http://localhost:4200
```

---

## ✦ Usage

```html
<io-chart [chartOptions]="options"></io-chart>
```

```typescript
import { ChartOptions } from './chart/chart.component';

options: ChartOptions = {
  type:  'line',           // 'line' | 'column' | 'pie'
  title: 'Monthly Revenue',
  series: [
    { name: 'Jan', value: 42, color: '#6366f1' },
    { name: 'Feb', value: 58, color: '#6366f1' },
    { name: 'Mar', value: 73, color: '#6366f1' },
  ]
};
```

---

## ✦ ChartOptions Interface

```typescript
interface ChartOptions {
  type:   'line' | 'column' | 'pie';
  title:  string;
  series: ChartSeries[];
}

interface ChartSeries {
  name:  string;   // Label shown in axes and legend
  value: number;   // Numeric data value
  color: string;   // Hex color, e.g. '#6366f1'
}
```

The `chartOptions` input is the **only** input the component needs. The parent passes a plain TypeScript object via property binding — there is no user-facing form. The developer controls the data from their component class.

---

## ✦ Features

| Feature | Details |
|---------|---------|
| **3 chart types** | Line (smooth curve + area fill), Column (rounded bars), Pie (donut with center total) |
| **All view** | See all three charts side-by-side in a responsive grid |
| **Info panel** | Each single chart view shows a description, key stats, use-cases, and a pro tip |
| **Canvas rendering** | Native HTML5 Canvas — zero chart library dependencies |
| **Sharp on HiDPI** | Canvas is sized with `devicePixelRatio` so charts are crisp on Retina screens |
| **Smooth animation** | Ease-out cubic entrance animation (900ms) on every chart render |
| **Hover interactions** | Tooltip, glow effects, highlighted legend items |
| **Responsive** | Redraws cleanly on window resize |
| **Auto legend** | Generated from `series` data, syncs with hover state |
| **Value labels** | Column bars show numeric labels after animation completes |
| **% labels** | Pie slices display percentage within each slice |
| **Donut center** | Total value shown in the hollow center of pie charts |

---

## ✦ Project Structure

```
io-chart/
├── angular.json              ← Angular workspace config
├── package.json              ← Dependencies (Angular 17, zone.js, TypeScript 5)
├── tsconfig.json             ← TypeScript compiler base config
├── tsconfig.app.json         ← App-specific TypeScript config
├── README.md                 ← This file
│
└── src/
    ├── main.ts               ← Bootstrap entry point
    ├── index.html            ← Root HTML shell
    ├── styles.scss           ← Global reset and base styles
    │
    └── app/
        ├── app.module.ts              ← NgModule: declares App + Chart components
        ├── app.component.ts           ← Demo shell: data, tab state, info panel content
        ├── app.component.html         ← Demo layout: switcher, all-grid, single-view
        ├── app.component.scss         ← White theme, switcher, split layout, info panel
        │
        └── chart/
            ├── chart.component.ts     ← Core: Canvas rendering, animation, hover logic
            ├── chart.component.html   ← Template: canvas, tooltip, legend
            └── chart.component.scss   ← Card styles, tooltip, legend
```

**The `chart/` folder is the deliverable.** Everything else is the demo wrapper.

---

## ✦ Design Decisions

### Input is code, not a form
The component receives data via Angular's `@Input()` decorator and property binding `[chartOptions]="myData"`. The developer defines the data object in TypeScript. There is no end-user form — this is intentional per the assignment spec.

### Why Canvas over SVG?
Canvas gives fine-grained control over gradients, animations, and hit detection without DOM overhead. It's better suited for smooth imperative animations and real-time hover effects than declarative SVG.

### Sharp rendering on HiDPI screens
Canvas elements must be sized in JavaScript, not CSS. If you set `width: 100%; height: 100%` in CSS, the browser stretches the bitmap and everything blurs. The fix is:
1. Set `canvas.width` / `canvas.height` = logical size × `devicePixelRatio`
2. Set `canvas.style.width` / `canvas.style.height` = logical CSS size
3. Call `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` so all drawing coordinates stay in logical pixels

### Animation architecture
Each chart re-triggers a `requestAnimationFrame` loop on input change. Progress `0 → 1` is run through `easeOutCubic`, then used to scale elements — bars grow up, lines draw left-to-right, pie slices expand clockwise from 12 o'clock.

### Hover system
Mouse coordinates are compared in logical CSS pixel space (not scaled canvas pixels). Pie uses polar coordinates (`Math.atan2`) to find the hovered slice. Bars use bounding-box checks. Line uses proximity radius checks on each point.

---

## ✦ Tech Stack

- **Angular 17** — component architecture, lifecycle hooks, property binding
- **TypeScript 5** — strict mode, typed interfaces
- **SCSS** — nested rules, variables, responsive breakpoints
- **HTML5 Canvas API** — all chart rendering
- **Google Fonts** — Sora (UI), DM Mono (labels/code)

> No external chart libraries (Chart.js, D3, Recharts, etc.) were used.
