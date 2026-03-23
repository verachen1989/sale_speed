# 图表变化逻辑梳理

本文档梳理当前项目中所有会影响图表变化的逻辑点，覆盖：

- 看板页趋势图：`src/app/components/TrendChart.tsx`
- 项目详情页趋势图：`src/app/pages/ProjectDetail.tsx`
- 图表基础数据：`src/app/mock/dashboardData.ts`
- 看板页筛选入口：`src/app/pages/Dashboard.tsx`、`src/app/components/OverviewCards.tsx`、`src/app/components/ClassificationFilter.tsx`

## 1. 总体结论

当前图表变化不是只由“顶部筛选”驱动，而是由两层输入共同决定：

1. 页面级筛选状态
2. 图表组件内部状态

其中：

- 看板页趋势图主要受 `周期 / 业态 / 口径 / 分类筛选 / 图表内部维度切换 / 会议版本切换` 影响
- 项目详情页趋势图主要受 `周期 / 分期 / 业态-子业态 / 业务分类 / 户型卡片 / 图表内部维度切换 / 会议版本切换 / 来访特殊规则` 影响

## 2. 看板页趋势图

### 2.1 图表入口

页面入口在 `src/app/pages/Dashboard.tsx`。

看板页传给趋势图的核心入参：

- `period`
- `indicatorType`
- `propertyType`
- `filterLabel`

调用方式：

```tsx
<TrendChart
  period={period}
  indicatorType={indicatorType}
  propertyType={propertyType}
  filterLabel={filterLabel}
/>
```

### 2.2 会影响图表变化的状态

#### A. 顶部筛选

来自 `Dashboard.tsx`：

- `period`：`当日 / 当月 / 当年`
- `propertyType`：`住宅 / 商办 / 车储`
- `indicatorType`：`协议 / 合同`

这 3 个状态由顶部 `Header` 组件维护回传。

#### B. 分类筛选

来自 `OverviewCards.tsx` 与 `ClassificationFilter.tsx`：

- `filterLabel`

`filterLabel` 的来源类别有三类：

- 销售状态：`当年首开 / 续销 / 尾盘`
- 拿地年份：`2021年及以前拿地 / 2022年拿地 / ...`
- 城市：`北京 / 上海 / 深圳 / ...`

一旦 `filterLabel` 变化，看板页趋势图重新计算。

#### C. 图表内部状态

来自 `TrendChart.tsx`：

- `metricType`：`套数 / 金额`
- `selectedVersion`：`年度经营计划版 / 首开定价会版 / 全景会版 / 经营策划会版 / 交底会版`

这两个不是顶部筛选，但会直接改图表。

### 2.3 顶部筛选与分类筛选如何联动

在 `OverviewCards.tsx` 中，以下任一变化都会清空当前分类筛选：

- `period`
- `indicatorType`
- `propertyType`

对应逻辑：

```tsx
useEffect(() => {
  setSelectedFilterLabel('');
  setShowFilter(false);
  onFilterChange?.('');
}, [period, indicatorType, propertyType]);
```

含义：

- 顶部筛选切换后，图表不再沿用旧的分类子项
- 图表回到“未按分类筛选”的状态

### 2.4 图表数据生成逻辑

图表数据主入口在 `src/app/mock/dashboardData.ts` 的 `getTrendData(...)`。

入参：

- `period`
- `indicatorType`
- `metricType`
- `filterLabel`
- `propertyType`

逻辑顺序：

1. 先按 `propertyType` 取项目池
2. 再按 `filterLabel` 过滤项目
3. 再按 `indicatorType` 取协议或合同字段
4. 再按 `metricType` 取套数或金额
5. 最后映射成对应周期的趋势模板

源码里已有注释：

```ts
Filters cascade: propertyType → indicatorType → metricType → filterLabel
```

### 2.5 看板页趋势图的特殊分支

#### A. 当年 + 住宅 + 合同 + 未选分类

命中条件：

- `propertyType === '住宅'`
- `period === '当年'`
- `indicatorType === '合同'`
- `!filterLabel`

此时不走通用模板，而直接返回真实年度趋势数据：

- `realAnnualContractUnitTrend`
- `realAnnualContractAmountTrend`

影响：

- 只有这个组合下，图表是特殊真实数据
- 一旦切换了分类筛选，立即退回模板数据逻辑

#### B. 会议版本只影响目标值，不影响实际值

`TrendChart.tsx` 中：

- `selectedVersion` 通过 multiplier 只调整 `target`
- `actual` 保持原值

版本倍率：

- 年度经营计划版：`1.1`
- 首开定价会版：`1.05`
- 全景会版：`1.0`
- 经营策划会版：`0.95`
- 交底会版：`0.9`

#### C. 只有当年显示“对比版本”

`period === '当年'` 时：

- 显示右上角“对比 + 版本选择”
- 显示目标与实际双图例
- tooltip 展示差值
- 显示底部摘要指标

#### D. 周期切换会影响标题

标题映射：

- `当日` → `近7日流速趋势`
- `当月` → `近6周流速趋势`
- `当年` → `近6个月流速趋势`

若有 `filterLabel`，标题会追加：

- `近6周流速趋势-续销`
- `近6个月流速趋势-北京`

#### E. 周期切换会影响横向滚动行为

`TrendChart.tsx` 中：

- `当年` 默认滚动到最右侧
- `当日 / 当月` 默认回到最左侧

依赖项：

- `period`
- `metricType`
- `indicatorType`
- `propertyType`
- `filterLabel`
- `selectedVersion`

### 2.6 看板页图表变化点清单

以下变化都会导致看板页图表更新：

- 切换周期
- 切换业态
- 切换口径（协议/合同）
- 选择分类筛选卡片
- 清空分类筛选
- 切换图表维度（套数/金额）
- 当年模式切换会议版本

## 3. 项目详情页趋势图

### 3.1 图表入口

详情页图表在 `src/app/pages/ProjectDetail.tsx` 中内联实现。

页面初始化入参来自上一级页面：

- `projectId`
- `projectName`
- `initialPeriod`
- `initialPropertyType`

### 3.2 会影响详情图表变化的状态

#### A. 顶部筛选

详情页顶部当前存在 4 类筛选：

- `period`：`当日 / 当月 / 当年`
- `phase`：`全盘 / 一期 / 二期 / ...`
- `propertyType + selectedSecondaryType`：例如 `住宅-全部`、`住宅-中高层`
- `businessCategory`：`协议 / 合同 / 来访`

#### B. 分类卡片区

详情页第二层筛选为横向卡片：

- `selectedLayout`

默认值：

- `全部已售`

其他值来自户型/子项卡片，如：

- `中高层128A-3`
- `中高层106b-4`

#### C. 图表内部状态

- `metricType`：`套数 / 金额`
- `selectedVersion`：会议版本

#### D. 特殊控制状态

- `isFullScopeOnlyCategory`

当前规则：

- `businessCategory === '来访'` 时为 `true`

一旦为 `true`，会触发一整套“全盘来访模式”。

### 3.3 详情页顶部筛选如何影响图表

#### A. 周期 `period`

影响点：

- 趋势标题
- X 轴标签粒度
- 取数接口中的 `layoutStaticsType`
- 基础趋势模板
- 明细列排序
- 当年是否显示版本对比与目标

周期标题映射：

- `当日` → `近7日流速趋势`
- `当月` → `近6周流速趋势`
- `当年` → `近6个月流速趋势`

来访模式下改为：

- `近7日来访组数`
- `近6周来访组数`
- `近6个月来访组数`

#### B. 分期 `phase`

影响点：

- `selectedPhaseCode`
- 布局分析接口 `/api/project-layout-analysis`
- 销售趋势接口 `/api/project-sales-trend`

即：分期会影响卡片区数据、库存/月均等衍生值，进而影响图表缩放逻辑。

但注意：

- `来访` 模式下分期被强制锁定为 `全盘`
- 同时分期筛选被禁用

#### C. 业态与子业态 `propertyType + selectedSecondaryType`

影响点：

- `getProjectDetail(projectId, period, propertyType)` 取详情页基础项目数据
- `secondaryTypeSummaries`
- `layoutSummaries`
- `layoutMultiplier`
- 最终 `trendData`

当切换业态或子业态时：

- 项目基础值变
- 卡片区内容变
- 当前选中的户型卡会回到 `全部已售`
- 图表按比例缩放

#### D. 业务分类 `businessCategory`

当前值：

- `协议`
- `合同`
- `来访`

映射规则：

- `协议` → `indicatorType = 协议`
- `合同` → `indicatorType = 合同`
- `来访` → 走独立来访模式

影响点：

- 取协议还是合同字段
- 标题文案
- 图表单位
- 图例文案
- tooltip 文案
- 是否显示维度切换
- 是否显示会议版本
- 是否显示目标柱
- 是否显示底部 3 个摘要指标
- 明细表字段内容

### 3.4 来访模式的特殊规则

`businessCategory === '来访'` 时，当前逻辑会强制进入“全盘口径”。

具体规则：

1. 自动重置为 `phase = 全盘`
2. 自动重置为 `selectedSecondaryType = 全部`
3. 自动重置为 `selectedLayout = 全部已售`
4. 若当前 `metricType = 金额`，强制改回 `套数`
5. 禁用分期筛选
6. 禁用业态/子业态筛选
7. 户型卡片区退化为单张全盘卡
8. 标题改为 `近X来访组数`
9. 隐藏 `套数 / 金额` 切换
10. 隐藏当年“会议版本对比”
11. 隐藏目标柱和目标图例
12. 隐藏底部 3 个摘要指标
13. 明细表只保留 `来访组数`

### 3.5 户型卡片 `selectedLayout` 如何影响图表

详情页不是简单切换数据源，而是通过比例缩放图表。

核心变量：

- `activeTrendRatio`
- `layoutMultiplier`

逻辑：

1. 如果选中的是 `全部已售` 且子业态也是 `全部`，倍率为 `1`
2. 否则根据当前卡片的成交套数占比，计算倍率
3. 再对基础趋势数据进行缩放

缩放规则：

- `target`、`actual` 会随倍率变化
- `visits` 在普通协议/合同模式下并不随户型缩放
- `来访` 模式直接使用 `actual = visits`

### 3.6 户型/子项卡片本身如何随筛选联动

除了“卡片点击后会影响图表”，卡片区本身的内容也会随顶部筛选变化。

当前卡片区的数据来源链路如下：

1. 先由 `period / phase / propertyType / businessCategory` 决定基础数据口径
2. 再生成 `secondaryTypeSummaries`
3. 再生成 `layoutSummaries`
4. 最后按 `selectedSecondaryType` 过滤成 `filteredLayoutSummaries`
5. 若是 `来访` 模式，则直接退化为单张 `全盘` 卡

#### A. 周期 `period` 对卡片的影响

影响点：

- `layoutStaticsType`
- 布局分析接口 `/api/project-layout-analysis`
- 项目基础值 `projectUnits / projectAmount`

当前规则：

- `当月` 时 `layoutStaticsType = 2`
- `当日 / 当年` 时 `layoutStaticsType = 1`

这会导致卡片区的：

- 子项数量
- 每张卡片的套数
- 每张卡片的金额
- 每张卡片的库存

都可能变化。

#### B. 分期 `phase` 对卡片的影响

分期先转换成 `selectedPhaseCode`，再参与布局分析接口请求。

因此切换 `全盘 / 一期 / 二期 ...` 时，卡片区会变化：

- 可展示的户型/子项集合
- 每张卡的数值
- 第一张“全部已售”卡的聚合值

但在 `来访` 模式下：

- 分期被强制锁定为 `全盘`
- 卡片区不再展示分期下的户型集合

#### C. 业态与子业态 `propertyType + selectedSecondaryType` 对卡片的影响

这是卡片区变化最明显的一组条件。

影响过程：

1. `propertyType` 先决定项目详情基础数据来自哪个业态
2. `secondaryTypeSummaries` 生成“全部 / 中高层 / 地下车位”等二级汇总
3. `selectedSecondaryType` 决定是否过滤卡片列表

具体表现：

- 切换 `住宅 / 商办 / 车储` 时，整组卡片会重算
- 切换 `全部 / 中高层 / 地下车位` 时，卡片列表会被裁剪
- 第一张卡始终保留为 `全部已售`
- 非 `全部` 的情况下，只展示当前子业态下的卡片

同时，切换 `propertyType + selectedSecondaryType` 时，代码会自动：

- 重置 `selectedLayout = 全部已售`

也就是：

- 卡片区重新生成
- 当前选中卡片回到第一张

#### D. 业务分类 `businessCategory` 对卡片的影响

`businessCategory` 不只是影响图表，也会直接改卡片里的指标含义。

##### 1. 协议 / 合同

卡片数值字段分别取：

- `协议`：`saleOrderQty / wssetOrder`
- `合同`：`saleContractQty / wssetContract`

卡片展示内容包括：

- 标签名
- 成交套数
- 剩余库存
- 金额

也就是同一张卡在 `协议` 与 `合同` 下，套数/库存/金额都可能不同。

##### 2. 来访

来访模式下卡片区改成全盘说明卡，不再展示真实户型集合。

当前规则：

- 卡片列表固定只剩 1 张
- 卡片标题固定为 `全盘`
- 卡片主值显示来访总组数
- 不显示金额
- 说明文案显示“当前仅支持全盘”

#### E. 数据源优先级对卡片的影响

卡片区并不总是来自真实接口，当前有“真实数据优先，fallback 补位”的逻辑。

优先级如下：

1. 如果 `project-layout-analysis` 返回了有效数据，则使用真实卡片数据
2. 如果真实数据为空或无意义，则退回本地 fallback 卡片定义

对应变量：

- `hasMeaningfulRealLayoutData`
- `realLayoutSummaries`
- `layoutSummaries`

所以卡片区变化不仅受筛选影响，也受接口返回情况影响。

#### F. 卡片选中态如何跟随滚动变化

卡片区不是只靠点击切换，横向滚动也会改当前选中卡片。

当前规则：

1. 滑动到最左侧时，优先选中第一张卡 `全部已售`
2. 滑动到最右侧时，优先选中最后一张卡
3. 中间区域按“最接近容器中心”的卡片自动选中

这意味着图表变化的触发源不只来自点击，也来自横向滚动。

但在 `来访` 模式下：

- 滚动自动选中逻辑失效
- 因为卡片区只保留单张全盘卡

#### G. 卡片与图表联动的完整顺序

当前完整顺序可以概括为：

1. 顶部筛选变化
2. 卡片区数据重算
3. 当前选中卡片可能被重置为 `全部已售`
4. 用户点击或滚动改变 `selectedLayout`
5. `selectedLayout` 参与倍率计算
6. 图表与明细同步变化

因此“户型/子项卡片”本身也是一个被动联动结果，不只是图表的主动控制器。

### 3.7 详情页图表数据来源与分支

#### A. 基础项目数据

来自：

- `getProjectDetail(projectId, period, propertyType)`

决定：

- 基础套数
- 基础金额
- 卡片汇总基线

#### B. 布局分析数据

接口：

- `/api/project-layout-analysis`

影响：

- `secondaryTypeSummaries`
- `layoutSummaries`
- 当前卡片区数据

如果接口无有效数据，则退回 mock/fallback 数据。

#### C. 来访数据

接口：

- `/api/project-visit-order-trend`

用途：

- 生成 `realDailyVisitsByDate`
- 当 `period === 当日` 时，用真实来访值覆盖图表中的 `visits`

#### D. 年度版本数据

接口：

- `/api/project-version-trend`

用途：

- 当 `period === 当年 && indicatorType === 合同` 时，生成年度真实趋势
- 同时可推导真实金额趋势

#### E. 销售趋势数据

接口：

- `/api/project-sales-trend`

用途：

- 主要提供 `kcQty`、`monthAvgQty`
- 影响底部摘要指标中的库存/月均

### 3.8 详情页图表标题变化规则

普通协议/合同模式：

- `近7日流速趋势`
- `近6周流速趋势`
- `近6个月流速趋势`

若选中具体户型卡片，则追加卡片标签：

- `近6周流速趋势-中高层128A-3`

来访模式：

- 不追加户型标签
- 固定为 `近X来访组数`

### 3.9 详情页明细表与图表联动

明细表数据直接从 `chartData` 派生，因此图表变化一定带动明细变化。

变化点包括：

- 周期切换
- 业务分类切换
- 业态/子业态切换
- 户型卡片切换
- 指标维度切换

明细列还会按时间倒序重排。

### 3.10 详情页“重置”按钮影响

点击重置后，会把图表相关状态恢复为：

- `period = initialPeriod`
- `phase = 全盘`
- `propertyType = initialPropertyType`
- `businessCategory = 合同`
- `metricType = 套数`
- `selectedSecondaryType = 全部`
- `selectedVersion = 年度经营计划版`
- `selectedLayout = 全部已售`

这会使图表整体回到默认详情态。

## 4. 图表变化逻辑总表

### 4.1 看板页

| 逻辑点 | 状态/来源 | 影响内容 |
| --- | --- | --- |
| 周期切换 | `period` | 标题、数据模板、当年版本区、滚动位置 |
| 业态切换 | `propertyType` | 项目池、图表数据、分类筛选重置 |
| 口径切换 | `indicatorType` | 协议/合同字段切换、分类筛选重置 |
| 分类筛选 | `filterLabel` | 图表按状态/年份/城市过滤 |
| 图表维度切换 | `metricType` | 套数/金额切换、单位变化 |
| 会议版本切换 | `selectedVersion` | 仅影响目标值 |

### 4.2 项目详情页

| 逻辑点 | 状态/来源 | 影响内容 |
| --- | --- | --- |
| 周期切换 | `period` | 标题、模板、接口参数、明细排序 |
| 分期切换 | `phase` | 分期代码、布局分析/销售趋势取数 |
| 业态切换 | `propertyType` | 项目基础数据、卡片区、图表基线 |
| 子业态切换 | `selectedSecondaryType` | 卡片区过滤、倍率缩放 |
| 业务分类切换 | `businessCategory` | 协议/合同/来访模式切换 |
| 卡片切换 | `selectedLayout` | 图表倍率缩放、标题/明细联动 |
| 图表维度切换 | `metricType` | 套数/金额图表切换 |
| 会议版本切换 | `selectedVersion` | 当年合同目标值变化 |
| 重置 | `handleResetFilters` | 整体恢复默认图表状态 |

## 5. 当前最关键的业务特例

当前最需要被产品、设计、研发共同注意的特例有 3 个：

1. 看板页 `住宅 + 当年 + 合同 + 未筛选` 时，趋势图使用真实年度数据，不走通用模板。
2. 项目详情页的户型卡片不是切换独立数据集，而是按成交占比对趋势做缩放。
3. `来访` 是独立的全盘模式，不允许分期、业态、户型下钻，也不显示会议版本、目标值和底部摘要指标。

## 6. 后续建议

如果这份文档后续还要继续用于需求评审，建议再补两类内容：

1. “期望逻辑 vs 当前实现”的差异表
2. 每个图表场景对应的接口口径表

这样就能直接支持产品验收、联调和后续改版。
