# 房地产销售看板交互设计文档

## 1. 文档目标
基于当前实现，明确关键用户路径、组件联动关系与页面状态流转，作为后续迭代与测试参考。

## 2. 关键状态模型

### 2.1 Dashboard 状态
- `period`: `当日 | 当月 | 当年`
- `propertyType`: `住宅 | 商办 | 车储`
- `indicatorType`: `协议 | 合同`
- `filterLabel`: 分类筛选选中的子项标签，空字符串表示未筛选
- `isSearchOpen`: 项目搜索抽屉开关

### 2.2 Overview/Classification 状态
- `showFilter`: 是否展开分类筛选面板
- `filterType`: `status | landYear | city`
- `selectedFilterLabel`: 当前选中的分类子项
- `selectedFilter`: 卡片滚动联动计算出的当前选中项

### 2.3 Project Detail 状态
- `period`, `propertyType`, `indicatorType`
- `selectedSecondaryType`: 业态二级分类
- `selectedLayout`: `全部已售` 或具体户型
- `metricType`: `套数 | 金额`
- `selectedVersion`: 年度版本对比项

## 3. 交互流程图

### 3.1 主流程（看板到详情）
```mermaid
flowchart TD
    A[进入 Dashboard] --> B[选择周期/业态/口径]
    B --> C[刷新概览卡 + 趋势图 + 项目明细]
    C --> D{是否打开项目类型筛选}
    D -- 否 --> E[查看趋势与明细]
    D -- 是 --> F[展开分类筛选面板]
    F --> G[切换分类: 销售状态/拿地年份/重点城市]
    G --> H[点击或滑动选择子项卡片]
    H --> I[更新 filterLabel]
    I --> J[趋势图与项目明细联动刷新]
    E --> K{点击搜索?}
    J --> K
    K -- 是 --> L[打开项目搜索抽屉]
    K -- 否 --> M{点击项目行?}
    L --> N[输入关键字过滤项目]
    N --> O[点击项目]
    O --> P[进入 Project Detail]
    M -- 是 --> P
    M -- 否 --> E
```

### 3.2 分类筛选卡片交互流程
```mermaid
flowchart TD
    A[分类面板展开] --> B[渲染当前分类卡片列表]
    B --> C{交互方式}
    C -- 点击卡片 --> D[selectedFilter = 卡片label]
    C -- 横向滑动 --> E[按中心点计算最接近卡片]
    E --> F{边界判断}
    F -- scrollLeft <= 阈值 --> G[选中第一张]
    F -- scrollRight >= 阈值 --> H[选中最后一张]
    F -- 其余 --> I[选中中心最近卡片]
    D --> J[onFilterChange]
    G --> J
    H --> J
    I --> J
    J --> K[更新 filterLabel]
    K --> L[联动趋势图与项目明细]
```

### 3.3 项目详情户型联动流程
```mermaid
flowchart TD
    A[进入 Project Detail] --> B[初始化为 全部已售]
    B --> C{户型卡交互}
    C -- 点击 --> D[setSelectedLayout]
    C -- 横向滑动 --> E[滚动中心点选中]
    E --> F{左边界?}
    F -- 是 --> G[强制回 全部已售]
    F -- 否 --> H[选中最近户型卡]
    D --> I[更新趋势标题与数据]
    G --> I
    H --> I
    I --> J[更新明细标题与指标值]
```

## 4. 状态流转图

### 4.1 页面级状态流转
```mermaid
stateDiagram-v2
    [*] --> Dashboard

    state Dashboard {
        [*] --> Browsing
        Browsing --> FilterPanelOpen: 点击项目类型筛选
        FilterPanelOpen --> Browsing: 清空筛选/关闭面板
        Browsing --> SearchDrawerOpen: 点击搜索
        FilterPanelOpen --> SearchDrawerOpen: 点击搜索
        SearchDrawerOpen --> Browsing: 关闭抽屉
        SearchDrawerOpen --> NavigatingToDetail: 点击项目
        Browsing --> NavigatingToDetail: 点击项目行
        FilterPanelOpen --> NavigatingToDetail: 点击项目行
    }

    Dashboard --> ProjectDetail: 携带 projectId + projectName + period + propertyType
    ProjectDetail --> Dashboard: 返回
```

### 4.2 Dashboard 数据状态流转
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> BaseFilterChanged: 变更 period/propertyType/indicatorType
    BaseFilterChanged --> ResetClassification: 清空 selectedFilterLabel + 收起分类面板
    ResetClassification --> DataRecomputed: 重算概览/趋势/明细数据
    Idle --> ClassificationChanged: 点击或滑动选择分类卡片
    ClassificationChanged --> DataRecomputed: 写入 filterLabel
    DataRecomputed --> Idle
```

### 4.3 Project Detail 数据状态流转
```mermaid
stateDiagram-v2
    [*] --> DetailIdle
    DetailIdle --> HeaderFilterChanged: 变更 period/propertyType/indicatorType/secondaryType
    HeaderFilterChanged --> ResetLayout: selectedLayout = 全部已售
    ResetLayout --> DetailDataRecomputed
    DetailIdle --> LayoutChanged: 点击或滑动户型卡
    LayoutChanged --> DetailDataRecomputed
    DetailIdle --> MetricChanged: 套数/金额切换
    MetricChanged --> DetailDataRecomputed
    DetailIdle --> VersionChanged: 年度版本切换
    VersionChanged --> DetailDataRecomputed
    DetailDataRecomputed --> DetailIdle
```

## 5. 联动规则汇总
- 看板页：`period/propertyType/indicatorType/filterLabel` 是趋势图和项目明细共同输入。
- 分类卡片：点击与滑动都可以触发 `filterLabel` 更新。
- 项目详情：`selectedLayout` 同时驱动趋势图和明细表。
- 日期明细：统一按时间倒序（左新右旧）渲染，保证趋势与明细时间理解一致。

## 6. 实现约束与注意事项
- 粘性表头必须与表体处于同一横向滚动容器，防止列宽错位和右侧溢出。
- 移动端搜索输入字号保持 `>=16px`，避免 iOS 聚焦自动缩放。
- 卡片滚动选中需包含左右边界兜底，避免首尾项不可达。
