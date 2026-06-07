# ACE — New Page Prompt (build a page with the UI Kit)

How to create a NEW page that follows the ACE design system every time.
For NEW pages we use PlatformShell (unified sidebar + topbar) + components from `src/ui/index.jsx`.
(This is different from existing pages, where we only normalize colors and keep their own menu.)

---

## Steps (manual)

1. Copy `frontend/src/_TemplatePage.jsx` -> `frontend/src/<Name>Page.jsx`, rename the component.
2. Add a route in `frontend/src/platformRoutes.js`:
   ```js
   '/my-feature': { title: 'My Feature', group: 'Clock', roles: ROLES.ALL_STAFF, component: 'MyFeaturePage' },
   ```
3. In `frontend/src/main.jsx`: `import MyFeaturePage from './MyFeaturePage.jsx'` and add `MyFeaturePage` to the `COMPONENTS` map.
4. Set `active="/my-feature"` in the PlatformShell (highlights the sidebar item).
5. Replace TODO sections with real data (`apiFetch` from `./apiFetch.js`).
6. Verify: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/src/<Name>Page.jsx` = 200.

---

## Available components (import from `./ui/index.jsx`)

- Layout: `PlatformShell` (from `./PlatformShell.jsx`), `Card`, `Sidebar`, `SidebarBrand`, `SidebarSection`, `NavItem`
- Actions: `Button` (variant: primary|ghost|soft|success|danger; props: icon, loading)
- Inputs: `Field`, `Input`, `Select`, `Switch`, `Checkbox`, `Radio`, `Tabs`
- Data: `Table`, `StatCard`, `Badge`, `StatusBadge`, `Avatar`, `Progress`
- Charts: `LineChart`, `BarChart`, `Donut`, `Gauge`, `Sparkline`, `Timeline`, `MapView`
- Feedback: `Alert`, `Spinner`, `Skeleton`, `EmptyState`, `Tooltip`, `toast(msg, 'ok'|'err'|'info')`
- Overlays: `Modal`, `Drawer`, `CommandPalette`
- Theme: `useDarkMode()`

Tokens/colors come from `ds.css` (brand #2447d8, accent #c73b32, success #16a34a, etc.). Dark mode + tooltips are built in.

Browse everything live at route `/ui-kit`.

---

## Rules

- ALWAYS use kit components; do NOT hand-roll buttons/cards/badges with raw colors.
- Use `StatusBadge` for statuses (auto color), `toast()` for feedback, `EmptyState` for no-data.
- Brand color = `#2447d8` only. Never introduce new blues/greens — use the kit defaults.
- Charts are SVG (no chart lib). `MapView` loads Leaflet from CDN with a fallback.
- Keep text in English.

---

## PROMPT (copy this)

```
Create a new page <Name>Page.jsx for route /<path> using the ACE UI Kit:
- Wrap in PlatformShell (user, onLogout, active="/<path>", breadcrumb, title)
- Import components from ./ui/index.jsx — use Button, Card, StatCard, Tabs, Table,
  StatusBadge, Field/Input/Select, Modal, Drawer, EmptyState, charts (LineChart/Donut/
  Timeline/etc), toast — do NOT hand-roll styled elements.
- Brand color #2447d8 only; statuses via <StatusBadge>; feedback via toast().
- Register the route in platformRoutes.js and add to COMPONENTS in main.jsx.
- Wire data with apiFetch from ./apiFetch.js (or mock first).
- Verify curl http://localhost:5173/src/<Name>Page.jsx = 200, report what was built.

Page spec:
<describe the page: what it shows, sections, data source, actions>
```

Reference: copy `frontend/src/_TemplatePage.jsx` as the starting boilerplate.
