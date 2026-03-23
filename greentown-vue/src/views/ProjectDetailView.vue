<template>
  <div class="min-h-screen bg-[#f5f5f5]">
    <!-- Top Navigation Bar -->
    <div class="bg-[#47957f] px-4 py-2.5">
      <div class="flex items-center justify-between mb-2">
        <span class="text-white text-sm font-semibold">9:41</span>
        <div class="flex items-center gap-1.5">
          <div class="text-white text-xs">📶 📡 🔋</div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <button @click="router.back()" class="flex items-center justify-center w-8 h-8 text-white hover:opacity-80">
          <ChevronLeft :size="24" />
        </button>
        <h1 class="text-white text-lg font-semibold">{{ projectName }}</h1>
        <div class="flex items-center gap-3">
          <button class="flex items-center justify-center w-8 h-8 text-white hover:opacity-80">
            <Calendar :size="18" />
          </button>
          <button class="flex items-center justify-center w-8 h-8 text-white hover:opacity-80">
            <MoreHorizontal :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="px-4 pt-0 pb-20">
      <div class="sticky top-0 z-30 -mx-4 mb-2 bg-[#f5f5f5] px-4 pt-0 pb-1">
        <!-- Filter Row -->
        <div class="flex items-center justify-between gap-2 px-1 py-2">
          <div class="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            <div class="relative flex-shrink-0">
              <select v-model="period" class="h-8 pl-2 pr-6 bg-transparent border-0 text-[14px] text-[#1a1a1a] font-medium hover:bg-gray-50 transition-all w-auto appearance-none focus:outline-none">
                <option value="当日">当日</option>
                <option value="当月">当月</option>
                <option value="当年">当年</option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-[#99a1af]" />
            </div>

            <div class="relative flex-shrink-0">
              <select v-model="phase" class="h-8 pl-2 pr-6 bg-transparent border-0 text-[14px] text-[#1a1a1a] font-medium hover:bg-gray-50 transition-all w-auto appearance-none focus:outline-none">
                <option value="全盘">全盘</option>
                <option value="一期">一期</option>
                <option value="二期">二期</option>
                <option value="三期">三期</option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-[#99a1af]" />
            </div>

            <div class="relative flex-shrink-0">
              <select v-model="propertySecondaryValue" class="h-8 pl-2 pr-6 bg-transparent border-0 text-[14px] text-[#1a1a1a] font-medium hover:bg-gray-50 transition-all w-auto appearance-none focus:outline-none">
                <option value="住宅|全部">住宅-全部</option>
                <option value="商办|全部">商办-全部</option>
                <option value="车储|全部">车储-全部</option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-[#99a1af]" />
            </div>

            <div class="relative flex-shrink-0">
              <select v-model="indicatorType" class="h-8 pl-2 pr-6 bg-transparent border-0 text-[14px] text-[#1a1a1a] font-medium hover:bg-gray-50 transition-all w-auto appearance-none focus:outline-none">
                <option value="协议">协议</option>
                <option value="合同">合同</option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 size-3.5 text-[#99a1af]" />
            </div>
          </div>

          <button
            class="flex-shrink-0 h-7 px-2.5 rounded-md border border-[#c0d9d1] text-[#007440] text-[12px] font-medium hover:bg-[#edf7f4] transition-colors"
            @click="handleResetFilters"
          >
            重置
          </button>
        </div>

        <div class="rounded-tl-[10px] rounded-tr-[20px] bg-[#e8f5f0] px-4 py-2.5">
          <div ref="layoutScrollRef" class="flex gap-2 overflow-x-auto pb-2" @scroll="updateSelectedLayoutByScroll">
            <div class="w-1 shrink-0" aria-hidden="true" />
            <div
              v-for="layout in layoutOptions"
              :key="layout.label"
              :ref="(el) => setLayoutCardRef(layout.label, el as Element | null)"
              :class="[
                'bg-white min-h-[76px] w-28 rounded-lg cursor-pointer transition-all shrink-0 relative text-left px-2 py-2 flex flex-col justify-end',
                selectedLayout === layout.label ? 'border-2 border-green-700' : 'border-2 border-transparent'
              ]"
              @click="handleLayoutFilterClick(layout.label)"
            >
              <div class="absolute left-0 top-0 bg-green-100 h-6 rounded-tl-lg rounded-br-lg px-1.5 flex items-center max-w-[94%]">
                <p class="text-gray-700 text-xs font-medium truncate">{{ layout.label }}</p>
              </div>
              <div class="mt-6">
                <div class="flex items-baseline gap-1 text-gray-900">
                  <span class="text-base font-semibold">{{ layout.count.toLocaleString() }}</span>
                  <span class="text-xs">套</span>
                  <span class="text-[10px] leading-[14px] text-[#6a7282] truncate">（剩{{ layout.inventory.toLocaleString() }}套）</span>
                </div>
                <p class="mt-0.5 text-gray-500 text-xs truncate">
                  {{ layout.amount.toLocaleString() }}万
                </p>
              </div>
            </div>
            <div class="w-4 shrink-0" aria-hidden="true" />
          </div>
        </div>
      </div>

      <!-- Trend Chart -->
      <ProjectTrendChart
        :period="period"
        v-model:metric-type="metricType"
        v-model:selected-version="selectedVersion"
        :selected-layout="selectedLayout"
        :chart-data="chartData"
        :chart-title="chartTitle"
      />

      <!-- Detail Table -->
      <div class="bg-white rounded-[12px] p-4">
        <h3 class="text-[#1a1a1a] text-[15px] font-semibold mb-4">{{ detailTitle }}</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="sticky left-0 z-10 bg-white text-left py-3 px-2 text-[#007440] text-[13px] font-semibold min-w-[80px] whitespace-nowrap">指标</th>
                <th v-for="month in sortedMonths" :key="month" class="text-right py-3 px-2 text-[#8c8c8c] text-[13px] font-normal min-w-[60px] whitespace-pre-line leading-tight">
                  {{ month.replace('-', '\n') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in sortedDetailData" :key="index" class="border-b border-gray-100">
                <td class="sticky left-0 z-10 bg-white py-3 px-2 text-[#007440] text-[13px] font-medium whitespace-nowrap">{{ row.indicator }}</td>
                <td v-for="(value, idx) in row.values" :key="idx" class="py-3 px-2 text-[#1a1a1a] text-[13px] font-medium text-right whitespace-nowrap">
                  {{ value }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, Calendar, MoreHorizontal, ChevronDown } from 'lucide-vue-next'
import ProjectTrendChart from '@/components/ProjectTrendChart.vue'
import { getProjectDetail } from '@/mock/dashboardData'
import type { Period, IndicatorType, PropertyType, VersionType, ChartData } from '@/types'

const route = useRoute()
const router = useRouter()

const projectId = route.params.id as string
const projectName = (route.query.name as string) || '项目详情'

const initialPeriod = ((route.query.period as Period) || '当年')
const initialPropertyType = ((route.query.propertyType as PropertyType) || '住宅')
const initialIndicatorType = ((route.query.indicatorType as IndicatorType) || '合同')

const period = ref<Period>(initialPeriod)
const phase = ref('全盘')
const propertyType = ref<PropertyType>(initialPropertyType)
const indicatorType = ref<IndicatorType>(initialIndicatorType)
const selectedSecondaryType = ref('全部')
const metricType = ref<'套数' | '金额'>('套数')
const selectedLayout = ref('全部已售')
const selectedVersion = ref<VersionType>('年度经营计划版')
const layoutScrollRef = ref<HTMLDivElement | null>(null)
const layoutCardRefs = ref<Record<string, HTMLDivElement | null>>({})
const scrollTicking = ref(false)
const layoutDefinitions = [
  { label: '中高层128A-3', secondaryType: '中高层', ratio: 0.052 },
  { label: '中高层106b-4', secondaryType: '中高层', ratio: 0.049 },
  { label: '中高层109B-5', secondaryType: '中高层', ratio: 0.061 },
  { label: '中高层139A-10', secondaryType: '中高层', ratio: 0.073 },
  { label: '中高层139a-11', secondaryType: '中高层', ratio: 0.067 },
  { label: '中高层164A-6', secondaryType: '中高层', ratio: 0.081 },
  { label: '中高层162A-7', secondaryType: '中高层', ratio: 0.075 },
  { label: '中高层139B-12', secondaryType: '中高层', ratio: 0.069 },
  { label: '中高层106a-2', secondaryType: '中高层', ratio: 0.047 },
  { label: '中高层109A-1', secondaryType: '中高层', ratio: 0.057 },
  { label: '中高层165A-9', secondaryType: '中高层', ratio: 0.084 },
  { label: '地库标准车位', secondaryType: '地下车位', ratio: 0.138 },
  { label: '地库子母车位', secondaryType: '地下车位', ratio: 0.112 },
] as const
const propertySecondaryValue = computed({
  get: () => `${propertyType.value}|${selectedSecondaryType.value}`,
  set: (value: string) => {
    const [nextPropertyType, nextSecondaryType] = value.split('|') as [PropertyType, string]
    propertyType.value = nextPropertyType
    selectedSecondaryType.value = nextSecondaryType
    selectedLayout.value = '全部已售'
  },
})

const project = computed(() => getProjectDetail(projectId, period.value, propertyType.value))

const layoutOptions = computed(() => {
  const baseUnits = project.value?.contractUnits || 1000
  const baseAmount = project.value?.contractAmount || 200000
  return [
    {
      label: '全部已售',
      secondaryType: selectedSecondaryType.value,
      count: baseUnits,
      amount: baseAmount,
    },
    ...layoutDefinitions.map((item) => ({
      label: item.label,
      secondaryType: item.secondaryType,
      count: Math.max(1, Math.round(baseUnits * item.ratio)),
      amount: Math.max(1, Math.round(baseAmount * (item.ratio + 0.004))),
    })),
  ]
    .map((item) => ({
      ...item,
      inventory: Math.max(0, Math.round(item.count * 0.23)),
    }))
    .filter(
      (item) =>
        item.label === '全部已售' ||
        selectedSecondaryType.value === '全部' ||
        item.secondaryType === selectedSecondaryType.value
    )
})

// 生成月份标签（从2026年3月往前推6个月）
const rollingMonthLabels = computed(() => {
  return Array.from({ length: 6 }, (_, index) => {
    const startYear = 2026
    const startMonth = 3
    const offset = 5 - index
    let month = startMonth - offset
    let year = startYear
    
    while (month <= 0) {
      month += 12
      year -= 1
    }
    
    return `${month}月`
  })
})

// 生成趋势数据
const baseTrendData = computed(() => {
  if (period.value === '当年') {
    return [
      { month: rollingMonthLabels.value[0], target: 60, actual: 62, visits: 280 },
      { month: rollingMonthLabels.value[1], target: 68, actual: 65, visits: 310 },
      { month: rollingMonthLabels.value[2], target: 72, actual: 78, visits: 350 },
      { month: rollingMonthLabels.value[3], target: 75, actual: 82, visits: 380 },
      { month: rollingMonthLabels.value[4], target: 78, actual: 72, visits: 340 },
      { month: rollingMonthLabels.value[5], target: 80, actual: 75, visits: 360 },
    ]
  } else if (period.value === '当月') {
    return [
      { month: '2/03-2/09', target: 140, actual: 135, visits: 45 },
      { month: '2/10-2/16', target: 150, actual: 155, visits: 52 },
      { month: '2/17-2/23', target: 160, actual: 165, visits: 55 },
      { month: '2/24-3/02', target: 170, actual: 175, visits: 58 },
      { month: '3/03-3/09', target: 165, actual: 160, visits: 53 },
      { month: '3/10-3/16', target: 175, actual: 180, visits: 60 },
    ]
  } else {
    return [
      { month: '3/10', target: 25, actual: 27, visits: 12 },
      { month: '3/11', target: 23, actual: 24, visits: 10 },
      { month: '3/12', target: 28, actual: 30, visits: 13 },
      { month: '3/13', target: 30, actual: 32, visits: 14 },
      { month: '3/14', target: 29, actual: 28, visits: 12 },
      { month: '3/15', target: 32, actual: 35, visits: 15 },
      { month: '3/16', target: 31, actual: 30, visits: 13 },
    ]
  }
})

// 根据会议版本调整目标值
const versionMultipliers: Record<VersionType, number> = {
  '年度经营计划版': 1.1,
  '首开定价会版': 1.05,
  '全景会版': 1.0,
  '经营策划会版': 0.95,
  '交底会版': 0.9,
}

const chartData = computed<ChartData[]>(() => {
  const multiplier = versionMultipliers[selectedVersion.value]
  const isAllLayout = selectedLayout.value === '全部已售'
  const layoutRatio = isAllLayout ? 1 : 0.15
  
  return baseTrendData.value.map((item, index) => {
    const adjustedTarget = Math.round(item.target * multiplier * layoutRatio)
    const adjustedActual = Math.round(item.actual * layoutRatio)
    const monthLabel = item.month || ''
    
    if (metricType.value === '金额') {
      const avgPrice = 315 + (index % 4) * 6
      return {
        month: monthLabel,
        date: monthLabel,
        target: Math.round(adjustedTarget * avgPrice),
        actual: Math.round(adjustedActual * avgPrice),
        visits: item.visits || 0,
      }
    }
    
    return {
      month: monthLabel,
      date: monthLabel,
      target: adjustedTarget,
      actual: adjustedActual,
      visits: item.visits || 0,
    }
  })
})

const chartTitle = computed(() => {
  const periodTitle = {
    当日: '近7日流速趋势',
    当月: '近6周流速趋势',
    当年: '近6个月流速趋势',
  }
  const suffix = selectedLayout.value !== '全部已售' ? `-${selectedLayout.value}` : ''
  return periodTitle[period.value] + suffix
})

const detailTitle = computed(() => {
  const periodTitle = {
    当日: '近7日流速趋势',
    当月: '近6周流速趋势',
    当年: '近6个月流速趋势',
  }
  const suffix = selectedLayout.value !== '全部已售' ? `-${selectedLayout.value}` : ''
  return periodTitle[period.value] + '-明细' + suffix
})

// 明细表格数据
const estimatedPrices = computed(() => chartData.value.map((_, index) => 315 + (index % 4) * 6))

const detailData = computed(() => {
  const data = chartData.value
  const prices = estimatedPrices.value
  
  if (period.value === '当年') {
    return [
      {
        indicator: metricType.value === '金额' ? '目标金额' : '目标',
        values: data.map(d => d.target.toLocaleString()),
      },
      {
        indicator: metricType.value === '金额' ? `${indicatorType.value}金额` : `${indicatorType.value}实际`,
        values: data.map(d => d.actual.toLocaleString()),
      },
      {
        indicator: '达成率',
        values: data.map(d => `${Math.round((d.actual / Math.max(d.target, 1)) * 100)}%`),
      },
      {
        indicator: metricType.value === '金额' ? '合同套数' : `${indicatorType.value}金额`,
        values: data.map((d, i) => Math.round(d.actual * (prices[i] || 315)).toLocaleString()),
      },
      {
        indicator: '回款合计',
        values: data.map((d, i) => Math.round(d.actual * (prices[i] || 315) * 0.92).toLocaleString()),
      },
    ]
  } else {
    return [
      {
        indicator: metricType.value === '金额' ? `${indicatorType.value}金额` : `${indicatorType.value}实际`,
        values: data.map(d => d.actual.toLocaleString()),
      },
      {
        indicator: metricType.value === '金额' ? '合同套数' : `${indicatorType.value}金额`,
        values: data.map((d, i) => Math.round(d.actual * (prices[i] || 315)).toLocaleString()),
      },
      {
        indicator: '回款合计',
        values: data.map((d, i) => Math.round(d.actual * (prices[i] || 315) * 0.92).toLocaleString()),
      },
    ]
  }
})

const sortedMonths = computed(() => chartData.value.map(d => d.month).reverse())

const sortedDetailData = computed(() => {
  return detailData.value.map(row => ({
    ...row,
    values: [...row.values].reverse(),
  }))
})

function resetPageScrollToTop() {
  nextTick(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  })
}

function setLayoutCardRef(label: string, el: Element | null) {
  layoutCardRefs.value[label] = el as HTMLDivElement | null
}

function updateSelectedLayoutByScroll() {
  if (scrollTicking.value) return
  scrollTicking.value = true

  requestAnimationFrame(() => {
  const container = layoutScrollRef.value
  const options = layoutOptions.value
  if (!container || options.length === 0) {
    scrollTicking.value = false
    return
  }

  const firstLabel = options[0]?.label ?? '全部已售'
  const lastLabel = options[options.length - 1]?.label ?? firstLabel
  if (container.scrollLeft <= 8) {
    if (selectedLayout.value !== firstLabel) selectedLayout.value = firstLabel
    scrollTicking.value = false
    return
  }
  const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth)
  if (container.scrollLeft >= maxScrollLeft - 8) {
    if (selectedLayout.value !== lastLabel) selectedLayout.value = lastLabel
    scrollTicking.value = false
    return
  }

  const centerX = container.scrollLeft + container.clientWidth / 2
  let closestLabel = firstLabel
  let minDistance = Number.POSITIVE_INFINITY

  options.forEach((option) => {
    const card = layoutCardRefs.value[option.label]
    if (!card) return
    const cardCenterX = card.offsetLeft + card.offsetWidth / 2
    const distance = Math.abs(cardCenterX - centerX)
    if (distance < minDistance) {
      minDistance = distance
      closestLabel = option.label
    }
  })

  // 滞回阈值：避免相邻卡片边界来回抖动
  const currentCard = layoutCardRefs.value[selectedLayout.value]
  const currentDistance = currentCard
    ? Math.abs(currentCard.offsetLeft + currentCard.offsetWidth / 2 - centerX)
    : Number.POSITIVE_INFINITY
  const shouldSwitch = minDistance + 10 < currentDistance

  if (selectedLayout.value !== closestLabel && shouldSwitch) {
    selectedLayout.value = closestLabel
  }
  scrollTicking.value = false
  })
}

function handleLayoutFilterClick(label: string) {
  selectedLayout.value = label
  scrollLayoutCardIntoView(label)
}

function scrollLayoutCardIntoView(label: string, behavior: ScrollBehavior = 'smooth') {
  const container = layoutScrollRef.value
  const card = layoutCardRefs.value[label]
  if (!container || !card) return

  const targetLeft = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2
  container.scrollTo({
    left: Math.max(0, targetLeft),
    behavior,
  })
}

function handleResetFilters() {
  period.value = '当日'
  phase.value = '全盘'
  propertyType.value = '住宅'
  selectedSecondaryType.value = '全部'
  indicatorType.value = '协议'
  selectedLayout.value = '全部已售'
}

onMounted(() => {
  resetPageScrollToTop()
})

watch(
  () => route.fullPath,
  () => {
    resetPageScrollToTop()
  }
)
</script>
