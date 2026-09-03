# Design QA — UI-20260903-B

- Reference map: `/var/folders/zf/f275pyb93ys3vy3qtwt8yq2h0000gn/T/codex-clipboard-9d847223-58e9-4978-b065-f801905828f4.png`
- Reference Green+ cards: `/var/folders/zf/f275pyb93ys3vy3qtwt8yq2h0000gn/T/codex-clipboard-659ed640-ecb2-4113-9d4b-e17423293064.png`
- Reference left rail: `/var/folders/zf/f275pyb93ys3vy3qtwt8yq2h0000gn/T/codex-clipboard-94721e9a-c807-4b22-990c-fca10b7bc33a.png`
- Implementation evidence: in-app browser at `1280 × 720` and `1679 × 960`, national ready state; screenshots stayed temporary and were not added to the repository per user instruction.

## Fidelity and layout

- Map: brighter cyan-blue land surface, luminous provincial contours, visible lower extrusion edge and restrained bloom match the supplied spatial direction while keeping labels crisp.
- Green+ cards: 商管、小镇、生活科技、康养 use one featured KPI each, a supporting KPI alongside it, and a compact narrative line; accents distinguish businesses without changing data.
- Left rail: four panels fill the available height with consistent gaps. At `1280 × 720`, page, rails, panels and every panel body report zero scroll overflow.
- Typography: KPI values retain the agreed sales-value ceiling on desktop, and short-screen cleanup removes only low-priority captions or decorative timeline dots.

## Interaction and data QA

- Rendered copy contains only spaced `Top N` rankings; no `TopN`, “第 N” or “第一” legacy ranking remains.
- Switching from 全国 to 浙江 updates the scope to 浙江区域; switching back restores 全国. The map retains all 55 label nodes.
- Existing business values, map point/label behavior and project drilldown implementation remain intact.

## Comparison history

1. First browser comparison showed the map too flat/dim; increased bounded extrusion depth, tilt, side emissive light and boundary glow.
2. Right-side cards read as four repetitive text stacks; introduced per-business accents, featured KPI hierarchy and a compact narrative row.
3. Short-screen review found internal overflow in investment and resource panels; redistributed row heights and removed only redundant captions/decorations. Final measurements are overflow-free.

Final result: passed

## Design QA — UI-20260903-C

- Source screenshot: `/var/folders/zf/f275pyb93ys3vy3qtwt8yq2h0000gn/T/codex-clipboard-d961f01f-f92e-4726-9d7e-441f62858a46.png`
- Implementation screenshots: `/private/tmp/经营驾驶舱_UI013_1280x720.png` and `/private/tmp/经营驾驶舱_UI013_1679x960.png`
- Combined focused comparison: `/private/tmp/经营驾驶舱_UI013_对比.png`
- States checked: national dashboard, live local page, dark theme; `1280 × 720` compact desktop and `1679 × 960` standard desktop.

### Required fidelity surfaces

- Right-rail panel frame, header and two KPI cards remain aligned with the existing cockpit system.
- Business description and case/honor content are two independent full-width information layers.
- 商管、小镇、生活科技、康养 keep their existing mint, amber, blue and coral accents.
- Case/honor copy may wrap to two lines and no longer uses the prior hard single-line ellipsis treatment.

### Findings history

1. Initial implementation removed the one-line ribbon and introduced labelled “业务进展” plus a separate “案例/荣誉” surface.
2. First `1280 × 720` measurement found the 34px KPI cards intruding into the narrative rows because the panel body only supplied about 59px.
3. Compact-layout correction puts the two KPI cards on a 22px horizontal row and reserves a measured 34px narrative row. Final geometry reports a 4px KPI-to-description gap, a 1px description-to-highlight gap, and all four highlight cards ending inside their parent groups.
4. At `1679 × 960`, all four profiles preserve full-size vertical KPI cards and two stacked narrative surfaces. Page and right rail both report `scrollHeight === clientHeight`; console has zero warnings and zero errors.

### Final assessment

- P0: none.
- P1: none.
- P2: none.
- P3: compact `1280 × 720` intentionally presents the two KPIs inline to preserve all information without overlap; standard desktop retains the richer vertical KPI treatment.

final result: passed

## Design QA — UI-20260903-F

- Browser-rendered implementation: current local preview at `http://127.0.0.1:3100/`
- Figma file: `https://www.figma.com/design/9MXlhXqMrxHxgds3xBlqQU?node-id=1-2`
- SVG export: `greentown-cockpit-figma-export-20260903.svg`
- State checked: 全国、深色主题、desktop cockpit view.

### Focused title and Figma handoff check

- All visible module-title sequence numbers are hidden, including left-rail panels and right-rail specialty panels.
- `项目交付` and `集团客户评价` are promoted into independent title rows with the same shared title size and weight as `投资与土储`.
- The prior `经营指挥交付` title is removed.
- The temporary Figma capture script was removed after export, so the runtime app no longer loads `html-to-design/capture.js`.
- The current local page was captured to the approved Figma file and exported as SVG for design review.

### Verification

- `node --test --test-name-pattern='UI-015 promotes delivery|town module uses the six supplied|desktop resolution scaling|dense desktop mode|mid-height desktop|dashboard density adapts' tests/rendered-html.test.mjs` passed 6/6.
- `npm run build` passed.
- `git diff --check` passed.
- `rg -n "html-to-design/capture|figmacapture|figmaendpoint" app` returned no matches.

final result: passed

## Design QA — UI-20260903-E

- Source visual truth: `/var/folders/zf/f275pyb93ys3vy3qtwt8yq2h0000gn/T/codex-clipboard-033e86c6-d4b2-4f5a-a97c-e81a22035baa.png`
- Browser-rendered implementation: current local preview at `http://127.0.0.1:3100/`
- States checked: 全国、深色主题、default desktop and `1366 × 768` compact desktop.

### Focused alignment check

- The reported issue was a visible left-column baseline drift across 投资与土储, 销售去化, 项目交付, 集团客户评价, 结转资源 and 开发效率.
- Before correction, nested rows in the sales panel began around `x=28.9`, while investment KPI rows began around `x=34.9–35.9`.
- The sales panel now applies a shared left inset to the sales overview, inventory, project-delivery and customer-evaluation blocks. After correction, project-delivery, customer-evaluation and inventory blocks align at `x=34.9`; the top investment KPI is `x=35.9`, within the expected 1px border rounding difference.
- At `1366 × 768`, the same surfaces stay inside the aligned `x=30.3–32.3` band with no child overflow.

### Verification

- `npm run build` passed.
- `node --test --test-name-pattern='town module uses the six supplied|desktop resolution scaling|dense desktop mode|mid-height desktop|dashboard density adapts' tests/rendered-html.test.mjs` passed 5/5.
- `git diff --check` passed.

final result: passed

## Design QA — UI-20260903-D

- Source visual truth: `/var/folders/zf/f275pyb93ys3vy3qtwt8yq2h0000gn/T/codex-clipboard-a3737197-c0b3-4a52-b73c-3aaa475ffcfe.png`
- Browser-rendered implementation: `/private/tmp/dashboard-responsive-final-default.png`
- Full comparison: `/private/tmp/dashboard-responsive-comparison.png`
- Responsive captures: `/private/tmp/dashboard-responsive-final-1920x1080.png`, `/private/tmp/dashboard-responsive-final-1680x960.png`, `/private/tmp/dashboard-responsive-final-1440x900.png`, `/private/tmp/dashboard-responsive-final-1366x768.png`, `/private/tmp/dashboard-responsive-final-1280x720.png`
- Source pixels: `2878 × 1624`; primary implementation pixels/CSS viewport: `1679 × 960`; comparison normalized to `960px` height at device scale 1.
- State: 全国、深色主题、投资和销售数据 ready；项目地图与右侧特色业务均可见。

### Full-view and focused comparison

- The source showed three responsive failures: cramped investment rows, a sales chart with unused internal height, and specialty panels whose content occupied only thin strips.
- The implementation now uses a dedicated `876–1080px` presentation mode. Investment, sales, delivery, customer evaluation, and specialty panels all report zero content clipping at `1920 × 1080`; all outer panels and page rails report zero overflow at every tested viewport.
- The focused comparison confirms that the sales plot now uses its allocated card height, while the right rail is divided into a KPI band and two structured narrative bands rather than an undifferentiated empty card.

### Required fidelity surfaces

- Fonts and typography: panel titles remain on the shared title token; KPI numerals keep the existing DIN-style treatment. Secondary plan notes are removed only in constrained presentation/dense modes before primary values shrink.
- Spacing and layout rhythm: presentation mode rebalances the left rail to `1.85 / 3 / .92 / .88` and gives specialty profiles explicit `42px+ / 48px+` bands. All highlighted cards retain consistent borders, padding, and gaps.
- Colors and visual tokens: the existing cyan, mint, amber, blue, and coral business accents are unchanged; no new palette drift was introduced.
- Image quality and assets: the existing Greentown logo, city background, and 3D map rendering are preserved at their original asset quality and crop behavior.
- Copy and content: all KPI labels, values, units, rankings, project-delivery data, and Green+ narratives remain unchanged.
- Responsiveness: `1920 × 1080`, `1680 × 960`, `1440 × 900`, `1366 × 768`, and `1280 × 720` were checked. Page, panel, delivery, customer-evaluation, and specialty-body overflow deltas are zero.
- Interaction and console: national ready state remained active; browser console returned zero warnings and zero errors.

### Comparison history

1. Initial measurement found investment content needing `169px` inside `162px`, and four sales rows needing `374px` inside `343px`.
2. First correction created a presentation breakpoint, expanded the sales plot, and split specialty profiles into two intentional bands.
3. Standard `1920 × 1080` then exposed large-screen typography increasing delivery-card height; compact delivery padding and line heights removed the remaining overflow.
4. Final viewport sweep found no page or panel overflow. The only remaining 2px fractional grid rounding at intermediate investment-body measurements did not affect any child or outer panel; every child and outer panel remained fully visible.

### Follow-up polish

- P3: `1280 × 720` intentionally removes secondary captions and uses the dense card form to preserve all primary KPIs without scrolling.

final result: passed
