<template>
  <div class="min-h-screen bg-[#f5f5f5]">
    <!-- Top Navigation Bar -->
    <div class="bg-[#47957f] px-4 py-3 sticky top-0 z-50">
      <!-- Status Bar -->
      <div class="flex items-center justify-between mb-3">
        <span class="text-white text-[14px] font-semibold">9:41</span>
        <div class="flex items-center gap-1">
          <div class="text-white text-[12px]">📶</div>
          <div class="text-white text-[12px]">📡</div>
          <div class="text-white text-[12px]">🔋</div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex items-center justify-between">
        <button class="flex items-center justify-center w-7 h-7 text-white hover:opacity-80">
          <ChevronLeft :size="24" />
        </button>
        <h1 class="text-white text-[20px] font-semibold">绿城中国</h1>
        <div class="flex items-center gap-3">
          <button class="flex items-center justify-center w-7 h-7 text-white hover:opacity-80">
            <Calendar :size="20" class="size-5" />
          </button>
          <button class="flex items-center justify-center w-7 h-7 text-white hover:opacity-80">
            <MoreHorizontal :size="20" class="size-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <div class="sticky top-[88px] z-40 -mx-4 mb-2 bg-[#f5f5f5] px-4 pb-2">
        <HeaderFilter
          :period="period"
          :property-type="propertyType"
          :indicator-type="indicatorType"
          @period-change="period = $event"
          @property-type-change="propertyType = $event"
          @indicator-type-change="indicatorType = $event"
        />
      </div>

      <div class="mt-2">
        <OverviewCards :period="period" :indicator-type="indicatorType" :property-type="propertyType" @filter-change="filterLabel = $event" />
      </div>
      
      <div class="mt-2.5">
        <TrendChart :period="period" :indicator-type="indicatorType" :property-type="propertyType" :filter-label="filterLabel" />
      </div>
      
      <div class="mt-2.5">
        <ProjectTable
          :filter-label="filterLabel"
          :indicator-type="indicatorType"
          :period="period"
          :property-type="propertyType"
          @navigate="handleNavigate"
          @search-click="isSearchOpen = true"
        />
      </div>
    </div>

    <ProjectSearchDrawer
      :is-open="isSearchOpen"
      :period="period"
      :indicator-type="indicatorType"
      :property-type="propertyType"
      @close="isSearchOpen = false"
      @navigate-project="handleNavigate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft, Calendar, MoreHorizontal } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import HeaderFilter from '@/components/HeaderFilter.vue'
import OverviewCards from '@/components/OverviewCards.vue'
import TrendChart from '@/components/TrendChart.vue'
import ProjectTable from '@/components/ProjectTable.vue'
import ProjectSearchDrawer from '@/components/ProjectSearchDrawer.vue'
import type { IndicatorType, Period, PropertyType } from '@/types'

const router = useRouter()
const period = ref<Period>('当月')
const propertyType = ref<PropertyType>('住宅')
const indicatorType = ref<IndicatorType>('合同')
const filterLabel = ref('')
const isSearchOpen = ref(false)

function handleNavigate(projectId: string, projectName: string) {
  router.push({
    name: 'project-detail',
    params: { id: projectId },
    query: {
      name: projectName,
      period: period.value,
      propertyType: propertyType.value,
      indicatorType: indicatorType.value,
    }
  })
}
</script>
