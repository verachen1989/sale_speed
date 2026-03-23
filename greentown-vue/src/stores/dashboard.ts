import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Period, IndicatorType, PropertyType } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const period = ref<Period>('当月')
  const propertyType = ref<PropertyType>('住宅')
  const indicatorType = ref<IndicatorType>('合同')
  const filterLabel = ref<string>('')

  function setPeriod(value: Period) {
    period.value = value
  }

  function setPropertyType(value: PropertyType) {
    propertyType.value = value
  }

  function setIndicatorType(value: IndicatorType) {
    indicatorType.value = value
  }

  function setFilterLabel(value: string) {
    filterLabel.value = value
  }

  return {
    period,
    propertyType,
    indicatorType,
    filterLabel,
    setPeriod,
    setPropertyType,
    setIndicatorType,
    setFilterLabel,
  }
})
