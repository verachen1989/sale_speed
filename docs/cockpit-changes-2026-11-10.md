# 经营驾驶舱改版记录 · 2026-11-10

## 地图边缘流光

深色全国地图沿外轮廓循环走光，省际分界线保持原有样式。外轮廓由 `app/map-exterior.mjs` 提取，`app/tech-map.tsx` 将路径转成 Three.js 管线。细管线呈现亮边，粗管线用较低透明度形成光晕。

每帧用经过时间更新共享参数。着色器沿路径长度方向移动亮段，系统开启「减少动态效果」时，亮段停用并保留静态描边。

```ts
borderFlowTime.value = reducedMotion ? 0 : elapsed;
```

```glsl
float phase = fract(vUv.x * 3.0 - flowTime * .12);
float trail = pow(1.0 - phase, 9.0) * (1.0 - still);
float brightness = .16 + trail * .84;
vec3 color = mix(vec3(.05, .55, 1.0), vec3(.7, 1.0, 1.0), trail);
gl_FragColor = vec4(color * (1.0 + trail), brightness * mix(.95, .24, halo));
```

## 项目照片墙与画册

- 从城市入口打开项目墙。首屏按三列两行排布，向下滚动查看后续项目。项目封面统一裁切，压缩卡片信息区，把更多空间留给图片。
- 卡片保留项目名、可用的现场与全景入口、拿地时间、总建面及状态。拿地时间排在总建面之前，建设与销售状态合并显示，例如「在建 · 未售」。
- 点击封面进入单项目画册，照片按原比例缩放，完整显示。多图项目支持切换和缩略图选择。「查看原图」在新标签页打开当前照片，返回项目墙恢复原滚动位置。
- 城市有现场或全景入口时默认勾选「现场/全景项目」。两类入口都没有时默认展示全部项目。
- 标题显示「共 X 个项目 · 工程现场接入 Y 个」。两个数按城市统计。工程现场按项目去重，只有全景的项目不计入现场接入数。

相关实现位于 `app/half-year-2026-dashboard.tsx`、`app/half-year-2026-dashboard.module.css` 和 `app/project-live-site.tsx`。

## 模块放大

点击驾驶舱模块标题，模块在原位置附近等比例放大，内部布局保持一致。背景维持原有亮度和清晰度。靠近屏幕边缘时会调整位置。相关实现位于 `app/panel-magnifier.ts` 和驾驶舱页面。

本文记录本地版本的实现和交互。本次 GitHub 提交为改版说明。
