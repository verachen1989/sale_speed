<template>
  <div class="bg-white rounded-[12px] p-3 mb-3">
    <h3 class="text-[#1a1a1a] text-[15px] font-semibold mb-2">{{ chartTitle }}</h3>

    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          @click="$emit('update:metricType', '套数')"
          :class="[
            'px-3 py-1 text-[12px] rounded transition-colors',
            metricType === '套数'
              ? 'bg-[#007440] text-white'
              : 'bg-gray-100 text-[#8c8c8c] hover:bg-gray-200'
          ]"
        >
          套数
        </button>
        <button
          @click="$emit('update:metricType', '金额')"
          :class="[
            'px-3 py-1 text-[12px] rounded transition-colors',
            metricType === '金额'
              ? 'bg-[#007440] text-white'
              : 'bg-gray-100 text-[#8c8c8c] hover:bg-gray-200'
          ]"
        >
          金额
        </button>
      </div>

      <div v-if="period === '当年'" class="flex items-center gap-2 text-[12px] shrink-0">
        <span class="text-[#8c8c8c]">对比</span>
        <div class="relative inline-flex items-center">
          <select
            :value="selectedVersion"
            class="h-auto w-auto border-0 bg-transparent text-[12px] text-[#007440] pl-0 pr-3 focus:outline-none appearance-none"
            @change="$emit('update:selectedVersion', ($event.target as HTMLSelectElement).value as VersionType)"
          >
            <option value="年度经营计划版">年度经营计划版</option>
            <option value="首开定价会版">首开定价会版</option>
            <option value="全景会版">全景会版</option>
            <option value="经营策划会版">经营策划会版</option>
            <option value="交底会版">交底会版</option>
          </select>
          <ChevronDown
            class="pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-[#007440]"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3 mb-3">
      <div v-if="period === '当年'" class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-orange-500"></div>
          <span class="text-[#8c8c8c] text-[12px]">目标</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-700"></div>
          <span class="text-[#8c8c8c] text-[12px]">实际</span>
        </div>
        <div v-if="isAllLayoutSelected && metricType === '套数'" class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-blue-500"></div>
          <span class="text-[#8c8c8c] text-[12px]">来访组数</span>
        </div>
      </div>
      <div v-else class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-green-700"></div>
          <span class="text-[#8c8c8c] text-[12px]">实际</span>
        </div>
        <div v-if="isAllLayoutSelected && metricType === '套数'" class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-blue-500"></div>
          <span class="text-[#8c8c8c] text-[12px]">来访组数</span>
        </div>
      </div>
      <span class="text-[#8c8c8c] text-[11px] shrink-0">单位：{{ unitLabel }}</span>
    </div>

    <v-chart :option="chartOption" :style="{ height: '180px' }" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ChevronDown } from 'lucide-vue-next'
import type { Period, VersionType, ChartData } from '@/types'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent])

interface Props {
  period: Period
  metricType: '套数' | '金额'
  selectedVersion: VersionType
  selectedLayout: string
  chartData: ChartData[]
  chartTitle: string
}

const props = defineProps<Props>()

defineEmits<{
  'update:metricType': [value: '套数' | '金额']
  'update:selectedVersion': [value: VersionType]
}>()

const isAllLayoutSelected = computed(() => props.selectedLayout === '全部已售')

function getDisplayScale(metric: '套数' | '金额', values: number[]) {
  const maxValue = Math.max(...values, 0)

  if (metric === '金额') {
    if (maxValue >= 10000) {
      return { divisor: 10000, unit: '亿', digits: 1 }
    }
    return { divisor: 1, unit: '万', digits: 0 }
  }

  if (maxValue >= 10000) {
    return { divisor: 10000, unit: '万套', digits: 1 }
  }

  return { divisor: 1, unit: '套', digits: 0 }
}

function formatScaledValue(value: number, divisor: number, digits: number) {
  const scaled = value / divisor
  const fixed = digits > 0 ? scaled.toFixed(digits) : Math.round(scaled).toString()
  return digits > 0 ? fixed.replace(/\.0$/, '') : fixed
}

function getLabelDigits(value: number, divisor: number) {
  const scaled = value / divisor
  if (scaled >= 100) return 0
  if (scaled >= 10) return 1
  return 2
}

function getNiceStep(roughStep: number) {
  if (roughStep <= 0) return 1
  const exponent = Math.floor(Math.log10(roughStep))
  const fraction = roughStep / 10 ** exponent

  if (fraction <= 1) return 1 * 10 ** exponent
  if (fraction <= 2) return 2 * 10 ** exponent
  if (fraction <= 5) return 5 * 10 ** exponent
  return 10 * 10 ** exponent
}

function buildYAxisTicks(values: number[]) {
  const maxValue = Math.max(...values, 0)
  const roughStep = maxValue / 4
  const step = getNiceStep(roughStep)
  const topValue = Math.max(step * 4, step)

  return Array.from({ length: 5 }, (_, index) => index * step).filter((tick) => tick <= topValue)
}

const displayScale = computed(() => {
  const values = props.chartData.flatMap((item) => {
    const base = [item.target, item.actual]
    if (isAllLayoutSelected.value && props.metricType === '套数') {
      base.push(item.visits || 0)
    }
    return base
  })
  return getDisplayScale(props.metricType, values)
})

const yAxisTicks = computed(() => {
  const values = props.chartData.flatMap((item) => {
    const base = [item.target, item.actual]
    if (isAllLayoutSelected.value && props.metricType === '套数') {
      base.push(item.visits || 0)
    }
    return base
  })
  return buildYAxisTicks(values)
})

const yAxisMax = computed(() => yAxisTicks.value[yAxisTicks.value.length - 1] ?? 0)
const yAxisInterval = computed(() => {
  const first = yAxisTicks.value[0]
  const second = yAxisTicks.value[1]
  if (typeof first !== 'number' || typeof second !== 'number') {
    return undefined
  }
  return second - first
})

const unitLabel = computed(() => {
  if (isAllLayoutSelected.value && props.metricType === '套数') {
    return `${displayScale.value.unit}/组`
  }
  return displayScale.value.unit
})

const chartOption = computed(() => {
  const series: any[] = []
  
  // 目标柱（只在当年显示）
  if (props.period === '当年') {
    series.push({
      name: '目标',
      type: 'bar',
      data: props.chartData.map(d => d.target),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245, 158, 11, 0.8)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.3)' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: 14,
      barGap: '10%',
      label: {
        show: true,
        position: 'top',
        color: '#8c8c8c',
        fontSize: 10,
        fontWeight: 500,
        formatter: ({ value }: { value: number }) =>
          formatScaledValue(value, displayScale.value.divisor, getLabelDigits(value, displayScale.value.divisor)),
      },
    })
  }
  
  // 来访组数柱（只在全部已售且套数时显示，且在实际柱之前）
  if (isAllLayoutSelected.value && props.metricType === '套数') {
    series.push({
      name: '来访组数',
      type: 'bar',
      data: props.chartData.map(d => d.visits || 0),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59, 130, 246, 0.8)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.3)' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: 14,
      barGap: '10%',
      label: {
        show: true,
        position: 'top',
        color: '#8c8c8c',
        fontSize: 10,
        fontWeight: 500,
        formatter: ({ value }: { value: number }) => value?.toLocaleString() ?? '',
      },
    })
  }
  
  // 实际柱
  series.push({
    name: '实际',
    type: 'bar',
    data: props.chartData.map(d => d.actual),
    itemStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(0, 116, 64, 0.8)' },
          { offset: 1, color: 'rgba(0, 116, 64, 0.3)' },
        ],
      },
      borderRadius: [4, 4, 0, 0],
    },
    barWidth: 14,
    barGap: '10%',
    label: {
      show: true,
      position: 'top',
      color: '#8c8c8c',
      fontSize: 10,
      fontWeight: 500,
      formatter: ({ value }: { value: number }) =>
        formatScaledValue(value, displayScale.value.divisor, getLabelDigits(value, displayScale.value.divisor)),
    },
  })

  return {
    grid: {
      left: 45,
      right: 10,
      top: 20,
      bottom: 20,
    },
    xAxis: {
      type: 'category',
      data: props.chartData.map(d => d.month),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#8c8c8c',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yAxisMax.value || undefined,
      interval: yAxisInterval.value,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed',
        },
      },
      axisLabel: {
        color: '#8c8c8c',
        fontSize: 11,
        formatter: (value: number) => formatScaledValue(value, displayScale.value.divisor, displayScale.value.digits),
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#1a1a1a',
      },
      formatter: (params: any) => {
        const metricUnit = props.metricType === '金额' ? '万' : '套'
        let html = `<div style="padding: 4px;"><div style="font-weight: 600; margin-bottom: 4px;">${params[0].name}</div>`
        
        params.forEach((item: any) => {
          const color = item.seriesName === '目标' ? '#f59e0b' : item.seriesName === '来访组数' ? '#3b82f6' : '#007440'
          const unit = item.seriesName === '来访组数' ? '组' : metricUnit
          html += `<div style="color: ${color};">${item.seriesName}: ${item.value.toLocaleString()}${unit}</div>`
        })
        
        if (props.period === '当年') {
          const target = params.find((p: any) => p.seriesName === '目标')
          const actual = params.find((p: any) => p.seriesName === '实际')
          if (target && actual) {
            const diff = actual.value - target.value
            const diffColor = diff >= 0 ? '#00c950' : '#ff3b30'
            const rate = Math.round((actual.value / target.value) * 100)
            html += `<div style="color: ${diffColor};">偏差: ${diff >= 0 ? '+' : ''}${diff.toLocaleString()}${metricUnit}</div>`
            html += `<div style="color: ${rate >= 100 ? '#00c950' : '#ff3b30'};">达成率: ${rate}%</div>`
          }
        }
        
        html += '</div>'
        return html
      },
    },
    series,
  }
})
</script>
