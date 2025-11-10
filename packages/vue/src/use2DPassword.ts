import { ref, defineComponent, h } from 'vue'
import { Password2DEngine, Password2DOptions } from '@password2d/core'
import PasswordGrid from './Password2DGrid.vue'

export function use2DPassword(options: Password2DOptions = {}) {
  const engine = new Password2DEngine(options)

  // encoded reflects the engine's flattened value
  const encoded = ref(engine.getFlattened())
  const masked = ref(engine.masked)

  const updateState = () => {
    encoded.value = engine.getFlattened()
    masked.value = engine.masked
  }

  // Create a small wrapper component that injects the engine and wires onChange
  const PasswordGridComponent = defineComponent({
    name: 'Password2DGridWrapper',
    setup() {
      return () => h(PasswordGrid as any, { 
        engine, 
        masked: masked.value, 
        onChange: updateState 
      })
    }
  })

  return [encoded, PasswordGridComponent] as const
}