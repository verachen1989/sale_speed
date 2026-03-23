<template>
  <div class="relative mt-6">
    <div class="flex gap-[10px]">
      <button
        v-for="item in categories"
        :key="item.key"
        :ref="(el) => setButtonRef(item.key, el as Element | null)"
        @click="handleCategoryClick(item.key)"
        :class="[
          'bg-white h-[30px] px-[14px] rounded-[10px] flex items-center justify-center transition-all',
          selectedCategory === item.key ? 'border border-[#007440]' : 'border-0'
        ]"
      >
        <p :class="['font-medium text-[12px] leading-[16px] whitespace-nowrap', selectedCategory === item.key ? 'text-[#007440]' : 'text-[#4a5565]']">
          {{ item.label }}
        </p>
      </button>
    </div>

    <div class="relative overflow-x-hidden pt-[40px]">
      <template v-for="(option, index) in currentOptions" :key="`line-${option.label}`">
        <div
          v-if="getCardConnectionLine(index).visible"
          class="absolute pointer-events-none z-0"
          :style="{ left: `${buttonX}px`, top: '0px' }"
        >
          <svg class="block" fill="none" preserveAspectRatio="none" viewBox="0 0 1 24" style="width:1px;height:24px;">
            <path d="M0.5 0V24" stroke="#616366" stroke-opacity="0.21" />
          </svg>
          <svg
            class="block absolute"
            fill="none"
            preserveAspectRatio="none"
            :viewBox="`0 0 ${Math.abs(getCardConnectionLine(index).distance)} 16.5`"
            :style="{
              width: `${Math.abs(getCardConnectionLine(index).distance)}px`,
              height: '16.5px',
              left: getCardConnectionLine(index).distance >= 0 ? '0px' : `${getCardConnectionLine(index).distance}px`,
              top: '23px'
            }"
          >
            <path
              :d="
                getCardConnectionLine(index).distance >= 0
                  ? `M${Math.abs(getCardConnectionLine(index).distance)} 16.5C${Math.abs(getCardConnectionLine(index).distance)} 0.5 0 0.5 0 0.5`
                  : `M0 16.5C0 0.5 ${Math.abs(getCardConnectionLine(index).distance)} 0.5 ${Math.abs(getCardConnectionLine(index).distance)} 0.5`
              "
              stroke="#616366"
              stroke-opacity="0.21"
            />
          </svg>
        </div>
      </template>

      <div ref="cardsViewportRef" @scroll="updateSelectedFilterByScroll" class="flex gap-[7px] overflow-x-auto pb-2 relative z-10 scrollbar-hide">
        <button
          v-for="option in currentOptions"
          :key="option.label"
          :ref="(el) => setCardRef(option.label, el as Element | null)"
          @click="handleFilterSelect(option.label)"
          :class="[
            'bg-white h-[80px] w-[102px] rounded-[10px] cursor-pointer transition-all shrink-0 relative',
            selectedFilter === option.label ? 'border border-[#007440]' : 'border-2 border-transparent'
          ]"
        >
          <div class="absolute left-0 top-0 bg-[rgba(0,201,80,0.1)] h-[22px] rounded-tl-[10px] rounded-br-[10px] px-[5px] flex items-center max-w-[90%]">
            <p class="text-[#4a5565] text-[12px] font-medium leading-[16px] truncate">{{ option.label }}</p>
          </div>
          <div class="absolute left-[8px] right-[8px] bottom-[10px] text-left">
            <p class="text-[#0a0a0a] text-[0px] leading-[0] font-semibold tracking-[0.0703px]">
              <span class="text-[16px] leading-[32px]">{{ option.count }}</span>
              <span class="text-[12px] leading-[32px] font-normal">套</span>
            </p>
            <p class="text-[#6a7282] text-[10px] leading-[14px] mt-[-2px]">({{ option.amount }}亿)</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getFilterCategorySummaries } from '@/mock/dashboardData'
import type { FilterCategory, IndicatorType, Period, PropertyType } from '@/types'

const props = withDefaults(
  defineProps<{
    initialFilterType?: FilterCategory
    selectedFilterLabel?: string
    period: Period
    indicatorType: IndicatorType
    propertyType: PropertyType
  }>(),
  {
    initialFilterType: 'status',
    selectedFilterLabel: '',
  }
)

const emit = defineEmits<{
  'filter-change': [category: FilterCategory, label: string]
}>()

const selectedCategory = ref<FilterCategory>(props.initialFilterType)
const selectedFilter = ref(props.selectedFilterLabel)
const cardsViewportRef = ref<HTMLDivElement | null>(null)
const cardRefs = ref<Record<string, HTMLButtonElement | null>>({})
const buttonRefs = ref<Record<string, HTMLButtonElement | null>>({})
const buttonX = ref(0)
const cardCenters = ref<number[]>([])

watch(
  () => props.selectedFilterLabel,
  (value) => {
    selectedFilter.value = value ?? ''
  }
)

const categories = [
  { key: 'status' as FilterCategory, label: '按销售状态' },
  { key: 'landYear' as FilterCategory, label: '按拿地年份' },
  { key: 'city' as FilterCategory, label: '按重点城市' },
]

const filterCategories = computed(() => getFilterCategorySummaries(props.period, props.indicatorType, props.propertyType))
const currentOptions = computed(() => filterCategories.value[selectedCategory.value] ?? [])

function handleCategoryClick(type: FilterCategory) {
  selectedCategory.value = type
  selectedFilter.value = ''
  emit('filter-change', type, '')
}

function handleFilterSelect(label: string) {
  if (selectedFilter.value === label) return
  selectedFilter.value = label
  emit('filter-change', selectedCategory.value, label)
}

function updateSelectedFilterByScroll() {
  measureConnections()

  const viewport = cardsViewportRef.value
  const options = currentOptions.value
  if (!viewport || options.length === 0) return

  const firstLabel = options[0]?.label ?? ''
  const lastLabel = options[options.length - 1]?.label ?? ''
  if (!firstLabel) return

  if (viewport.scrollLeft <= 8) {
    if (selectedFilter.value !== firstLabel) {
      selectedFilter.value = firstLabel
      emit('filter-change', selectedCategory.value, firstLabel)
    }
    return
  }

  const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
  if (lastLabel && viewport.scrollLeft >= maxScrollLeft - 8) {
    if (selectedFilter.value !== lastLabel) {
      selectedFilter.value = lastLabel
      emit('filter-change', selectedCategory.value, lastLabel)
    }
    return
  }

  const centerX = viewport.scrollLeft + viewport.clientWidth / 2
  let closestLabel = firstLabel
  let minDistance = Number.POSITIVE_INFINITY

  options.forEach((option: { label: string }) => {
    const card = cardRefs.value[option.label]
    if (!card) return
    const cardCenterX = card.offsetLeft + card.offsetWidth / 2
    const distance = Math.abs(cardCenterX - centerX)
    if (distance < minDistance) {
      minDistance = distance
      closestLabel = option.label
    }
  })

  if (selectedFilter.value !== closestLabel) {
    selectedFilter.value = closestLabel
    emit('filter-change', selectedCategory.value, closestLabel)
  }
}

function setCardRef(label: string, el: Element | null) {
  cardRefs.value[label] = el as HTMLButtonElement | null
}

function setButtonRef(label: string, el: Element | null) {
  buttonRefs.value[label] = el as HTMLButtonElement | null
}

function measureConnections() {
  const viewport = cardsViewportRef.value
  const button = buttonRefs.value[selectedCategory.value]
  if (!viewport || !button) return

  const viewportRect = viewport.getBoundingClientRect()
  const buttonRect = button.getBoundingClientRect()
  buttonX.value = buttonRect.left + buttonRect.width / 2 - viewportRect.left
  cardCenters.value = currentOptions.value.map((option: { label: string }) => {
    const card = cardRefs.value[option.label]
    if (!card) return 0
    const cardRect = card.getBoundingClientRect()
    return cardRect.left + cardRect.width / 2 - viewportRect.left
  })
}

function getCardConnectionLine(index: number) {
  const cardX = cardCenters.value[index] ?? 0
  const distance = cardX - buttonX.value
  return { cardX, distance, visible: cardX > 0 }
}

onMounted(async () => {
  await nextTick()
  measureConnections()
  const viewport = cardsViewportRef.value
  viewport?.addEventListener('scroll', measureConnections, { passive: true })
  window.addEventListener('resize', measureConnections)
})

onBeforeUnmount(() => {
  cardsViewportRef.value?.removeEventListener('scroll', measureConnections)
  window.removeEventListener('resize', measureConnections)
})

watch([selectedCategory, currentOptions], async () => {
  await nextTick()
  measureConnections()
})
</script>
