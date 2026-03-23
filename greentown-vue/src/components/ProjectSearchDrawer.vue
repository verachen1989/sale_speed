<template>
  <template v-if="isOpen">
    <div class="fixed inset-0 bg-black/50 z-40 transition-opacity" @click="$emit('close')" />

    <div class="fixed inset-0 z-50 bg-white flex flex-col animate-slide-up pt-[max(env(safe-area-inset-top),0px)] pb-[max(env(safe-area-inset-bottom),12px)]">
      <div class="shrink-0 flex items-center justify-between px-4 py-4 border-b border-[#f0f0f0]">
        <h2 class="text-[#1a1a1a] text-[18px] font-semibold">项目搜索</h2>
        <button
          class="flex items-center justify-center size-8 text-[#8c8c8c] hover:bg-gray-100 rounded-full transition-colors"
          @click="$emit('close')"
        >
          <X class="size-5" />
        </button>
      </div>

      <div class="shrink-0 px-4 py-3 border-b border-[#f0f0f0] bg-white">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8c8c8c]" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索项目"
            inputmode="search"
            enterkeyhint="search"
            autocapitalize="off"
            autocorrect="off"
            class="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f5] rounded-lg text-base text-[#1a1a1a] placeholder:text-[#8c8c8c] focus:outline-none focus:ring-2 focus:ring-[#007440]/20"
          />
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <table class="w-full">
          <thead class="sticky top-0 bg-[#fafafa] z-10">
            <tr>
              <th class="px-4 py-3 text-left text-[#007440] text-[13px] font-semibold min-w-[140px] whitespace-nowrap">项目名称</th>
              <th class="px-4 py-3 text-center text-[#8c8c8c] text-[13px] font-normal min-w-[72px] whitespace-nowrap">套数</th>
              <th class="px-4 py-3 text-center text-[#8c8c8c] text-[13px] font-normal min-w-[110px] whitespace-nowrap">金额（万元）</th>
            </tr>
          </thead>
          <tbody>
            <tr class="bg-[#e8f5f0] border-b border-[#f0f0f0]">
              <td class="px-4 py-3 text-[#1a1a1a] text-[14px] font-semibold">合计</td>
              <td class="px-4 py-3 text-center text-[#1a1a1a] text-[14px] font-semibold">
                {{ indicatorType === '协议' ? totals.agreementUnits : totals.contractUnits }}
              </td>
              <td class="px-4 py-3 text-center text-[#1a1a1a] text-[14px] font-semibold">
                {{ (indicatorType === '协议' ? totals.agreementAmount : totals.contractAmount).toLocaleString() }}
              </td>
            </tr>

            <template v-if="filteredProjects.length">
              <tr
                v-for="project in filteredProjects"
                :key="project.id"
                class="border-b border-[#f0f0f0] hover:bg-[#fafafa] cursor-pointer transition-colors"
                @click="handleProjectClick(project.id, project.name)"
              >
                <td class="px-4 py-2.5">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[#007440] text-[14px] font-medium">{{ project.name }}</span>
                    <span class="text-[#99a1af] text-[11px] leading-[14px] whitespace-nowrap overflow-hidden text-ellipsis">拿地：{{ project.landDate }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center text-[#1a1a1a] text-[14px] font-medium">
                  {{ indicatorType === '协议' ? project.agreementUnits : project.contractUnits }}
                </td>
                <td class="px-4 py-3 text-center text-[#1a1a1a] text-[14px] font-medium">
                  {{ (indicatorType === '协议' ? project.agreementAmount : project.contractAmount).toLocaleString() }}
                </td>
              </tr>
            </template>

            <tr v-else>
              <td colspan="3" class="px-4 py-8 text-center text-[#8c8c8c] text-[14px]">未找到匹配的项目</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { getTotals, getVisibleProjects } from '@/mock/dashboardData'
import type { IndicatorType, Period, ProjectRecord, PropertyType } from '@/types'

const props = defineProps<{
  isOpen: boolean
  period: Period
  indicatorType: IndicatorType
  propertyType: PropertyType
}>()

const emit = defineEmits<{
  close: []
  'navigate-project': [projectId: string, projectName: string]
}>()

const searchQuery = ref('')

const allProjects = computed(() => getVisibleProjects(props.period, props.indicatorType, undefined, props.propertyType))
const filteredProjects = computed(() => {
  if (!searchQuery.value.trim()) return allProjects.value
  const query = searchQuery.value.toLowerCase()
  return allProjects.value.filter((project: ProjectRecord) => project.name.toLowerCase().includes(query))
})
const totals = computed(() => getTotals(filteredProjects.value))

function handleProjectClick(projectId: string, projectName: string) {
  emit('navigate-project', projectId, projectName)
  emit('close')
}
</script>
