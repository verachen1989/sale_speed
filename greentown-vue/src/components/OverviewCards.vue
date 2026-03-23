<template>
  <div>
    <div v-if="showFilter" class="relative overflow-hidden rounded-tl-[10px] rounded-tr-[20px] bg-[#e8f5f0] px-4 py-4 sm:px-6">
      <div class="absolute left-0 top-0 bg-[rgba(0,201,80,0.1)] h-[24px] rounded-tl-[10px] rounded-br-[10px] px-2 flex items-center">
        <span class="text-[#4a5565] text-[12px] font-medium leading-[16px]">已售</span>
      </div>
      <div class="grid grid-cols-[auto_auto] items-start justify-between gap-2.5 pt-3">
        <div class="flex min-w-0 items-start gap-4 sm:gap-5">
          <div class="flex min-w-0 flex-col">
            <div class="flex items-baseline gap-[2px] mb-1 whitespace-nowrap">
              <span class="min-w-0 truncate text-[#1a1a1a] text-[17px] font-semibold leading-[24px] tracking-[-0.45px]">{{ currentData.value1.toLocaleString() }}</span>
              <span class="text-[#1a1a1a] text-[12px] font-medium leading-[16px]">套</span>
            </div>
            <div class="flex items-center gap-[4px] whitespace-nowrap">
              <TrendingUp class="size-3 text-[#00c950]" :stroke-width="1" />
              <span class="text-[#99a1af] text-[11px] leading-[14px]">环比 {{ currentData.percentage }}</span>
            </div>
          </div>
          <div class="flex min-w-0 flex-col">
            <div class="flex items-baseline gap-[2px] mb-1 whitespace-nowrap">
              <span class="min-w-0 truncate text-[#1a1a1a] text-[17px] font-semibold leading-[24px] tracking-[-0.45px]">{{ currentData.value2.toLocaleString() }}</span>
              <span class="text-[#1a1a1a] text-[12px] font-medium leading-[16px]">万</span>
            </div>
            <div class="flex items-center gap-[4px] whitespace-nowrap">
              <TrendingUp class="size-3 text-[#00c950]" :stroke-width="1" />
              <span class="text-[#99a1af] text-[11px] leading-[14px]">环比 {{ currentData.percentage }}</span>
            </div>
          </div>
        </div>
        <button
          @click="handleClearFilter"
          class="shrink-0 self-start bg-white text-[#007440] text-[11px] font-medium hover:opacity-80 whitespace-nowrap px-2.5 py-1.5 rounded-lg border border-[#007440] transition-all"
        >
          清空筛选
        </button>
      </div>

      <ClassificationFilter
        :initial-filter-type="filterType"
        :selected-filter-label="selectedFilterLabel"
        :period="period"
        :indicator-type="indicatorType"
        :property-type="propertyType"
        @filter-change="handleFilterChange"
      />
    </div>

    <div v-else class="relative overflow-hidden bg-[#e8f5f0] rounded-tl-[10px] rounded-tr-[20px] px-4 py-4 sm:px-6">
      <div class="absolute left-0 top-0 bg-[rgba(0,201,80,0.1)] h-[24px] rounded-tl-[10px] rounded-br-[10px] px-2 flex items-center">
        <span class="text-[#4a5565] text-[12px] font-medium leading-[16px]">已售</span>
      </div>
      <div class="grid grid-cols-[auto_auto] items-start justify-between gap-2.5 pt-3">
        <div class="flex min-w-0 items-start gap-4 sm:gap-5">
          <div class="flex min-w-0 flex-col">
            <div class="flex items-baseline gap-[2px] mb-1 whitespace-nowrap">
              <span class="min-w-0 truncate text-[#1a1a1a] text-[17px] font-semibold leading-[24px] tracking-[-0.45px]">{{ currentData.value1.toLocaleString() }}</span>
              <span class="text-[#1a1a1a] text-[12px] font-medium leading-[16px]">套</span>
            </div>
            <div class="flex items-center gap-[4px] whitespace-nowrap">
              <TrendingUp class="size-3 text-[#00c950]" :stroke-width="1" />
              <span class="text-[#99a1af] text-[11px] leading-[14px]">环比 {{ currentData.percentage }}</span>
            </div>
          </div>
          <div class="flex min-w-0 flex-col">
            <div class="flex items-baseline gap-[2px] mb-1 whitespace-nowrap">
              <span class="min-w-0 truncate text-[#1a1a1a] text-[17px] font-semibold leading-[24px] tracking-[-0.45px]">{{ currentData.value2.toLocaleString() }}</span>
              <span class="text-[#1a1a1a] text-[12px] font-medium leading-[16px]">万</span>
            </div>
            <div class="flex items-center gap-[4px] whitespace-nowrap">
              <TrendingUp class="size-3 text-[#00c950]" :stroke-width="1" />
              <span class="text-[#99a1af] text-[11px] leading-[14px]">环比 {{ currentData.percentage }}</span>
            </div>
          </div>
        </div>
        <button
          @click="showFilter = true"
          class="shrink-0 self-start bg-white text-[#007440] text-[11px] font-medium hover:opacity-80 whitespace-nowrap px-2.5 py-1.5 rounded-lg border border-[#007440] transition-all"
        >
          项目类型筛选
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import ClassificationFilter from '@/components/ClassificationFilter.vue'
import { getOverviewMetrics } from '@/mock/dashboardData'
import type { FilterCategory, IndicatorType, Period, PropertyType } from '@/types'

const props = defineProps<{
  period: Period
  indicatorType: IndicatorType
  propertyType: PropertyType
}>()

const emit = defineEmits<{
  'filter-change': [label: string]
}>()

const showFilter = ref(false)
const filterType = ref<FilterCategory>('status')
const selectedFilterLabel = ref('')

watch(
  () => [props.period, props.indicatorType, props.propertyType],
  () => {
    selectedFilterLabel.value = ''
    showFilter.value = false
    emit('filter-change', '')
  }
)

const currentData = computed(() => getOverviewMetrics(props.period, props.indicatorType, props.propertyType))

function handleFilterChange(category: FilterCategory, label: string) {
  filterType.value = category
  selectedFilterLabel.value = label
  emit('filter-change', label)
}

function handleClearFilter() {
  selectedFilterLabel.value = ''
  showFilter.value = false
  emit('filter-change', '')
}

</script>
