<template>
  <div class="flex items-center justify-between">
    <div class="flex overflow-clip rounded-[4px] border border-[#c0d9d1]">
      <button
        v-for="p in periods"
        :key="p"
        @click="$emit('period-change', p)"
        :class="[
          'px-[13px] py-[8px] text-[14px] font-normal transition-colors',
          period === p ? 'bg-[#007440] text-white' : 'bg-white text-[#007440] hover:bg-[#f0f7f4]'
        ]"
      >
        {{ p }}
      </button>
    </div>

    <div class="flex gap-4">
      <div class="relative">
        <button @click="propertyOpen = !propertyOpen" class="flex items-center gap-2 text-[#007440] text-[16px] font-normal hover:opacity-80">
          {{ propertyType }}
          <ChevronDown class="size-[14px]" />
        </button>
        <template v-if="propertyOpen">
          <div class="fixed inset-0 z-10" @click="propertyOpen = false"></div>
          <div class="absolute right-0 top-full z-20 mt-2 min-w-[120px] rounded-md bg-white shadow-lg border border-gray-200">
            <button
              v-for="option in propertyOptions"
              :key="option"
              @click="selectProperty(option)"
              :class="[
                'w-full px-4 py-2 text-left text-[14px] hover:bg-gray-50 first:rounded-t-md last:rounded-b-md',
                propertyType === option ? 'bg-[#edf7f4] text-[#007440]' : 'text-[#606266]'
              ]"
            >
              {{ option }}
            </button>
          </div>
        </template>
      </div>

      <div class="relative">
        <button @click="indicatorOpen = !indicatorOpen" class="flex items-center gap-2 text-[#007440] text-[16px] font-normal hover:opacity-80">
          {{ indicatorType }}
          <ChevronDown class="size-[14px]" />
        </button>
        <template v-if="indicatorOpen">
          <div class="fixed inset-0 z-10" @click="indicatorOpen = false"></div>
          <div class="absolute right-0 top-full z-20 mt-2 min-w-[120px] rounded-md bg-white shadow-lg border border-gray-200">
            <button
              v-for="option in indicatorOptions"
              :key="option"
              @click="selectIndicator(option)"
              :class="[
                'w-full px-4 py-2 text-left text-[14px] hover:bg-gray-50 first:rounded-t-md last:rounded-b-md',
                indicatorType === option ? 'bg-[#edf7f4] text-[#007440]' : 'text-[#606266]'
              ]"
            >
              {{ option }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { ref } from 'vue'
import type { IndicatorType, Period, PropertyType } from '@/types'

defineProps<{
  period: Period
  propertyType: PropertyType
  indicatorType: IndicatorType
}>()

const emit = defineEmits<{
  'period-change': [value: Period]
  'property-type-change': [value: PropertyType]
  'indicator-type-change': [value: IndicatorType]
}>()

const periods: Period[] = ['当日', '当月', '当年']
const propertyOptions: PropertyType[] = ['住宅', '商办', '车储']
const indicatorOptions: IndicatorType[] = ['协议', '合同']
const propertyOpen = ref(false)
const indicatorOpen = ref(false)

function selectProperty(value: PropertyType) {
  propertyOpen.value = false
  emit('property-type-change', value)
}

function selectIndicator(value: IndicatorType) {
  indicatorOpen.value = false
  emit('indicator-type-change', value)
}
</script>
