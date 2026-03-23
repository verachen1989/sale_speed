<template>
  <div class="fixed inset-0 bg-black/50 z-40" @click="$emit('close')" />

  <div class="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[16px] shadow-lg max-h-[80vh] overflow-y-auto">
    <div class="relative px-4 pt-4 pb-3 border-b border-gray-100">
      <h3 class="text-[#0a0a0a] text-[20px] font-semibold tracking-[-0.45px]">字段筛选</h3>
      <button class="absolute right-4 top-4 text-[#0a0a0a] opacity-70 hover:opacity-100" @click="$emit('close')">
        <X class="size-4" />
      </button>
    </div>

    <div class="px-4 pt-4 pb-6 flex flex-col gap-3">
      <button
        v-for="field in allFields"
        :key="field"
        class="bg-[#f9fafb] rounded-[10px] px-3 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
        @click="toggleField(field)"
      >
        <span class="text-[#0a0a0a] text-[14px] font-medium tracking-[-0.15px]">{{ field }}</span>
        <div
          :class="[
            'size-4 rounded-[4px] flex items-center justify-center transition-colors',
            selectedFields.includes(field)
              ? 'bg-[#030213] border border-[#030213]'
              : 'bg-[#f3f3f5] border border-[rgba(0,0,0,0.1)]'
          ]"
        >
          <Check v-if="selectedFields.includes(field)" class="size-3 text-white" :stroke-width="2" />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    selectedFields?: string[]
  }>(),
  {
    selectedFields: () => [],
  }
)

const emit = defineEmits<{
  close: []
  'fields-change': [fields: string[]]
}>()

const selectedFields = ref<string[]>([...props.selectedFields])
const allFields = ['套数', '金额', '回款现金', '回款贷款', '回款合计']

watch(
  () => props.selectedFields,
  (next) => {
    selectedFields.value = [...(next ?? [])]
  }
)

function toggleField(field: string) {
  const next = selectedFields.value.includes(field)
    ? selectedFields.value.filter((item) => item !== field)
    : [...selectedFields.value, field]

  selectedFields.value = next
  emit('fields-change', next)
}
</script>
