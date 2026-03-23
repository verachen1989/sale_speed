<template>
  <div class="bg-white rounded-lg">
    <div class="flex items-center justify-between px-4 py-4 border-b border-[#f0f0f0] sticky top-[138px] z-30 bg-white">
      <h3 class="text-[#0a0a0a] text-[14px] font-medium text-left">
        项目明细{{ filterLabel ? `-${filterLabel}` : '' }}
      </h3>
      <div class="flex items-center gap-4">
        <button class="flex items-center gap-1 text-[#007440] text-[12px] font-medium hover:opacity-80" @click="showFieldFilter = !showFieldFilter">
          <Filter class="size-[13px]" />
          字段
        </button>
        <button class="flex items-center gap-1 text-[#007440] text-[12px] font-medium hover:opacity-80" @click="$emit('search-click')">
          <Search class="size-4" />
          搜索
        </button>
      </div>
    </div>

    <FieldFilter
      v-if="showFieldFilter"
      :selected-fields="visibleFields"
      @close="showFieldFilter = false"
      @fields-change="visibleFields = $event"
    />

    <div class="sticky top-[195px] z-20 border-b border-[#f0f0f0] bg-[#fafafa]">
      <div ref="headerScrollRef" class="overflow-x-auto scrollbar-hide" @scroll="syncHeaderToBody">
        <div class="min-w-max">
          <div class="flex">
            <div class="sticky left-0 z-10 bg-[#fafafa] px-4 py-3 text-left text-[#6a7282] text-[12px] font-medium w-[128px] shrink-0">项目名称</div>
            <div v-if="visibleFields.includes('套数')" class="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium w-[80px] shrink-0 whitespace-nowrap">套数</div>
            <div v-if="visibleFields.includes('金额')" class="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium w-[110px] shrink-0 whitespace-nowrap">金额（万元）</div>
            <div v-if="visibleFields.includes('回款现金')" class="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium w-[96px] shrink-0 whitespace-nowrap">回款现金</div>
            <div v-if="visibleFields.includes('回款贷款')" class="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium w-[96px] shrink-0 whitespace-nowrap">回款贷款</div>
            <div v-if="visibleFields.includes('回款合计')" class="bg-[#fafafa] px-4 py-3 text-center text-[#6a7282] text-[12px] font-medium w-[96px] shrink-0 whitespace-nowrap">回款合计</div>
            <div class="bg-[#fafafa] px-4 py-3 w-[40px] shrink-0" />
          </div>
        </div>
      </div>
    </div>

    <div ref="bodyScrollRef" class="overflow-x-auto scrollbar-hide" @scroll="syncBodyToHeader">
      <table class="w-full min-w-max">
        <colgroup>
          <col style="width: 128px" />
          <col v-if="visibleFields.includes('套数')" style="width: 80px" />
          <col v-if="visibleFields.includes('金额')" style="width: 110px" />
          <col v-if="visibleFields.includes('回款现金')" style="width: 96px" />
          <col v-if="visibleFields.includes('回款贷款')" style="width: 96px" />
          <col v-if="visibleFields.includes('回款合计')" style="width: 96px" />
          <col style="width: 40px" />
        </colgroup>
        <tbody>
          <tr class="bg-[#e8f5f0] border-b border-[#f0f0f0]">
            <td class="sticky left-0 z-10 bg-[#e8f5f0] px-4 py-3 text-[#0a0a0a] text-[14px] font-medium">合计</td>
            <td v-if="visibleFields.includes('套数')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">{{ totals.units.toLocaleString() }}</td>
            <td v-if="visibleFields.includes('金额')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">{{ totals.amount.toLocaleString() }}</td>
            <td v-if="visibleFields.includes('回款现金')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">{{ totals.cash.toLocaleString() }}</td>
            <td v-if="visibleFields.includes('回款贷款')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">{{ totals.loan.toLocaleString() }}</td>
            <td v-if="visibleFields.includes('回款合计')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-bold">{{ totals.total.toLocaleString() }}</td>
            <td class="px-4 py-3" />
          </tr>
          <tr
            v-for="project in sortedProjects"
            :key="project.id"
            class="border-b border-[#f0f0f0] hover:bg-[#fafafa] cursor-pointer transition-colors"
            @click="$emit('navigate', project.id, project.name)"
          >
            <td class="sticky left-0 z-10 px-4 py-3 bg-white">
              <div class="flex flex-col gap-0.5">
                <span class="text-[#007440] text-[14px] font-medium">{{ project.name }}</span>
                <span class="text-[#99a1af] text-[11px] leading-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                  拿地：{{ project.landDate }}
                </span>
              </div>
            </td>
            <td v-if="visibleFields.includes('套数')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">{{ units(project).toLocaleString() }}</td>
            <td v-if="visibleFields.includes('金额')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">{{ amount(project).toLocaleString() }}</td>
            <td v-if="visibleFields.includes('回款现金')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">{{ project.cashPayment.toLocaleString() }}</td>
            <td v-if="visibleFields.includes('回款贷款')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-semibold">{{ project.loanPayment.toLocaleString() }}</td>
            <td v-if="visibleFields.includes('回款合计')" class="px-4 py-3 text-center text-[#0a0a0a] text-[14px] font-bold">{{ project.totalPayment.toLocaleString() }}</td>
            <td class="px-4 py-3 text-center"><ChevronRight class="size-4 text-[#99a1af] mx-auto" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronRight, Filter, Search } from 'lucide-vue-next'
import FieldFilter from '@/components/FieldFilter.vue'
import { getDefaultVisibleFields, getVisibleProjects } from '@/mock/dashboardData'
import type { IndicatorType, Period, ProjectRecord, PropertyType } from '@/types'

defineEmits<{
  navigate: [projectId: string, projectName: string]
  'search-click': []
}>()

const props = withDefaults(
  defineProps<{
    filterLabel?: string
    indicatorType?: IndicatorType
    period?: Period
    propertyType?: PropertyType
  }>(),
  {
    filterLabel: '',
    indicatorType: '合同',
    period: '当月',
    propertyType: '住宅',
  }
)

const filterLabel = computed(() => props.filterLabel ?? '')
const projects = computed(() => getVisibleProjects(props.period, props.indicatorType, props.filterLabel, props.propertyType))
const showFieldFilter = ref(false)
const visibleFields = ref<string[]>(getDefaultVisibleFields(props.indicatorType))
const headerScrollRef = ref<HTMLDivElement | null>(null)
const bodyScrollRef = ref<HTMLDivElement | null>(null)
const isSyncingScroll = ref(false)

watch(
  () => props.indicatorType,
  (next) => {
    visibleFields.value = getDefaultVisibleFields(next)
  }
)

function units(project: ProjectRecord) {
  return props.indicatorType === '协议' ? project.agreementUnits : project.contractUnits
}

function amount(project: ProjectRecord) {
  return props.indicatorType === '协议' ? project.agreementAmount : project.contractAmount
}

const sortedProjects = computed(() => {
  return [...projects.value].sort((a, b) => units(b) - units(a))
})

const totals = computed(() => {
  return projects.value.reduce(
    (acc: { units: number; amount: number; cash: number; loan: number; total: number }, p: ProjectRecord) => {
      acc.units += units(p)
      acc.amount += amount(p)
      acc.cash += p.cashPayment
      acc.loan += p.loanPayment
      acc.total += p.totalPayment
      return acc
    },
    { units: 0, amount: 0, cash: 0, loan: 0, total: 0 }
  )
})

function syncHeaderToBody() {
  if (isSyncingScroll.value) return
  const header = headerScrollRef.value
  const body = bodyScrollRef.value
  if (!header || !body) return
  isSyncingScroll.value = true
  body.scrollLeft = header.scrollLeft
  requestAnimationFrame(() => {
    isSyncingScroll.value = false
  })
}

function syncBodyToHeader() {
  if (isSyncingScroll.value) return
  const header = headerScrollRef.value
  const body = bodyScrollRef.value
  if (!header || !body) return
  isSyncingScroll.value = true
  header.scrollLeft = body.scrollLeft
  requestAnimationFrame(() => {
    isSyncingScroll.value = false
  })
}
</script>
