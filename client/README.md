# CardCompanion — Client

React 19 + Vite frontend. See the [root README](../README.md) for what the app does and how to run both halves together.

```bash
npm install
npm run dev      # dev server on :5173, proxies /api to :3001
npm run build
npm run lint
```

Set `VITE_API_URL` to point at a deployed server; it defaults to `http://localhost:3001`.

## Structure

| Path | Role |
|---|---|
| `src/App.jsx` | State owner — fires both fetches, renders the 2×2 results grid |
| `src/SearchForm.jsx` | The card-description form that builds the query string |
| `src/Results.jsx` | One panel: headline average, stat rows, chart toggle |
| `src/ListingsTable.jsx` | The underlying listings, opened from a panel |
| `src/Chart.jsx` | Sold-price-over-time line chart (Chart.js) |
| `src/utils/utils.js` | API calls, grade/condition filtering, stats |
| `src/ui/` | Presentational primitives — Button, Field, Modal, Panel, Icons |

## Styling

Tailwind CSS v4, configured through the Vite plugin — there is no `tailwind.config.js`. The palette, fonts, and the `.tnum` tabular-figures utility are declared in the `@theme` block at the top of `src/index.css`.

Chart.js can't read CSS custom properties, so `src/Chart.jsx` repeats a few token values as constants. Change a color in `index.css` and check that file too.
