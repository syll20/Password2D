import { ref, markRaw } from 'vue'
import { Password2DEngine } from '@password2d/core'
import PasswordGrid from './Password2DGrid.vue'

export interface Use2DPasswordOptions {
  rows?: number
  cols?: number
  maxCharsPerCell?: number
  className?: string
  activeCellClassName?: string
  cellSize?: string
  showHideButtonClassName?: string
  resetButtonClassName?: string
  showText?: string
  hideText?: string
  showAriaLabel?: string
  hideAriaLabel?: string
  resetText?: string
}

export function use2DPassword(options: Use2DPasswordOptions = {}) {
  const engine = new Password2DEngine(options)
  const encoded = ref(engine.encode())

  const updateEncoded = () => {
    encoded.value = engine.encode()
  }

  // markRaw to prevent Vue from making the component reactive
  const PasswordGridComponent = markRaw(PasswordGrid)

  return [encoded, PasswordGridComponent] as const
}