<template>
  <div class="space-y-2">
    <div role="group" aria-label="2D password grid">
      <div v-for="(row, r) in engine.grid" :key="r" class="flex space-x-1">
        <div
          v-for="(cell, c) in row"
          :key="`${r}-${c}`"
          :ref="el => setCellRef(el, r, c)"
          role="textbox"
          :aria-label="`Password cell at row ${r + 1}, column ${c + 1}`"
          contenteditable="true"
          tabindex="0"
          @focus="handleFocus(r, c)"
          @input="handleInput($event, r, c)"
          @keydown="handleKeyDown($event, r, c)"
          @paste="handlePaste($event, r, c)"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
          :class="[
            baseClass,
            focused?.row === r && focused?.col === c ? activeClass : ''
          ]"
          v-text="masked ? '•'.repeat(cell.length) : cell"
        />
      </div>
    </div>

    <div class="flex space-x-4 text-sm mt-1">
      <button
        type="button"
        @click="toggleMask"
        :aria-label="
          masked
            ? engine.showAriaLabel ?? engine.showText ?? 'Show password grid'
            : engine.hideAriaLabel ?? engine.hideText ?? 'Hide password grid'
        "
        :class="
          engine.showHideButtonClassName?.toString().trim() ||
          'text-cyan-600 hover:underline'
        "
      >
        {{ masked ? engine.showText ?? 'Show' : engine.hideText ?? 'Hide' }}
      </button>

      <button
        type="button"
        @click="resetGrid"
        :class="
          engine.resetButtonClassName?.toString().trim() ||
          'text-gray-600 hover:underline'
        "
      >
        {{ engine.resetText ?? 'Reset' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Password2DEngine } from '@password2d/core'

const props = defineProps<{
  engine: Password2DEngine
  masked: boolean
  onChange?: () => void
}>()

const focused = ref<{ row: number; col: number } | null>(null)
const isComposing = ref(false)
const suppressInput = ref(false)
const cellRefs = ref<(HTMLElement | null)[][]>([])

const defaultBaseWithoutSize = 'border border-gray-400 rounded flex items-center justify-center text-lg cursor-text focus:outline-none focus:ring-2 focus:ring-cyan-500 select-none bg-white overflow-hidden text-center'

const baseClass = computed(() => {
  const providedBase = props.engine.className?.toString().trim() || defaultBaseWithoutSize
  const sizeClass = props.engine.cellSize?.toString().trim() || 'w-12 h-12'
  return `${providedBase} ${sizeClass}`
})

const activeClass = computed(() => 
  props.engine.activeCellClassName?.toString().trim() || 
  'ring-cyan-500 border-cyan-500'
)

function focusCell(r: number, c: number) {
  if (r < 0 || c < 0 || r >= props.engine.rows || c >= props.engine.cols) return
  const el = cellRefs.value[r]?.[c]
  if (el) {
    el.focus()
    focused.value = { row: r, col: c }
  }
}

function handleFocus(r: number, c: number) {
  focused.value = { row: r, col: c }
}

function syncVisuals() {
  suppressInput.value = true
  props.engine.grid.forEach((row, r) => {
    row.forEach((cell, c) => {
      const el = cellRefs.value[r]?.[c]
      if (el) {
        el.textContent = props.masked ? '•'.repeat(cell.length) : cell
      }
    })
  })
  suppressInput.value = false
}

function handleInput(e: Event, r: number, c: number) {
  if (suppressInput.value || isComposing.value) return
  
  const el = e.target as HTMLDivElement
  const rawTyped = el.innerText || ''
  const typed = rawTyped.replace(/•/g, '')
  
  if (rawTyped.includes('•')) {
    setTimeout(syncVisuals, 30)
  }
  
  const current = props.engine.grid[r][c] || ''
  let appended = ''
  
  if (typed.length > current.length) {
    appended = typed.slice(current.length)
  }
  
  if (appended) {
    let pos = { row: r, col: c }
    for (const ch of appended) {
      const next = props.engine.addChar(pos.row, pos.col, ch)
      if (!next) break
      pos = next
    }
    props.onChange?.()
    requestAnimationFrame(syncVisuals)
    focusCell(pos.row, pos.col)
  }else if (typed.length < current.length) {
    // Possibly user deleted all — delegate to keyDown handling next frame
    requestAnimationFrame(syncVisuals);
  }
}

function handleKeyDown(e: KeyboardEvent, r: number, c: number) {
  if (e.key === 'Backspace') {
    e.preventDefault()
    props.engine.deleteChar(r, c)
    props.onChange?.()
    requestAnimationFrame(syncVisuals)
    focusCell(r, c)
    return
  }

  if (isComposing.value) return

  const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey
  if (isPrintable) {
    e.preventDefault()
    let pos = { row: r, col: c }
    const next = props.engine.addChar(pos.row, pos.col, e.key)
    if (next) {
      pos = next
      props.onChange?.()
      requestAnimationFrame(syncVisuals)
      focusCell(pos.row, pos.col)
    }
    return
  }

  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault()
      focusCell(r - 1, c)
      break
    case 'ArrowDown':
      e.preventDefault()
      focusCell(r + 1, c)
      break
    case 'ArrowLeft':
      e.preventDefault()
      focusCell(r, c - 1)
      break
    case 'ArrowRight':
      e.preventDefault()
      focusCell(r, c + 1)
      break
    case 'Tab':
      e.preventDefault();
      if (e.shiftKey) {
        const prev = props.engine.moveToPrevCell(r, c);
        if (prev) focusCell(prev.row, prev.col);
      } else {
        const next = props.engine.moveToNextCell(r, c)
        if (next) focusCell(next.row, next.col)
      }
      break
  }
}

function handlePaste(e: ClipboardEvent, r: number, c: number) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') || ''
  if (!text) return
  
  let pos = { row: r, col: c }
  for (const ch of text) {
    const next = props.engine.addChar(pos.row, pos.col, ch)
    if (!next) break
    pos = next
  }
  props.onChange?.()
  requestAnimationFrame(syncVisuals)
  focusCell(pos.row, pos.col)
}

function toggleMask() {
  props.engine.toggleMask()
  props.onChange?.()
  requestAnimationFrame(syncVisuals)
}

function resetGrid() {
  props.engine.reset()
  props.onChange?.()
  requestAnimationFrame(syncVisuals)
  focusCell(0, 0)
}

onMounted(() => {
  // no-op: refs are populated via setCellRef during render
})

function setCellRef(el: any, r: number, c: number) {
  if (!cellRefs.value[r]) cellRefs.value[r] = []
  cellRefs.value[r][c] = el?.$el instanceof HTMLElement ? el.$el : (el instanceof HTMLElement ? el : null)
}
</script>