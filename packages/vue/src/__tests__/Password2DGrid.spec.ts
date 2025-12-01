import { mount } from '@vue/test-utils'
import { Password2DEngine } from '@password2d/core'
import PasswordGrid from '../Password2DGrid.vue'
import { nextTick } from 'vue'

describe('Password2DGrid (Vue)', () => {
  it('accumulates typed chars up to maxCharsPerCell', async () => {
    const engine = new Password2DEngine({ rows: 2, cols: 3, maxCharsPerCell: 3 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: {
        engine,
        masked: false,
        onChange: () => {}
      }
    })

    const firstCell = wrapper.find('[role="textbox"]')
    await firstCell.trigger('focus')
    
  // Simulate typing 'abc' by setting element text and triggering events
  await firstCell.trigger('keydown', { key: 'a' })
  ;(firstCell.element as HTMLElement).innerText = 'a'
  await firstCell.trigger('input')
  await firstCell.trigger('keydown', { key: 'b' })
  ;(firstCell.element as HTMLElement).innerText = 'ab'
  await firstCell.trigger('input')
  await firstCell.trigger('keydown', { key: 'c' })
  ;(firstCell.element as HTMLElement).innerText = 'abc'
  await firstCell.trigger('input')
    
  await nextTick()
  expect(engine.getFlattened()).toContain('(0,0)abc')
  })

  it('handles masked input correctly', async () => {
    const engine = new Password2DEngine({ rows: 2, cols: 3, maxCharsPerCell: 3 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: {
        engine,
        masked: true,
        onChange: () => {}
      }
    })

    const firstCell = wrapper.find('[role="textbox"]')
    await firstCell.trigger('focus')
  await firstCell.trigger('keydown', { key: 'a' })
  ;(firstCell.element as HTMLElement).innerText = '•'
  await firstCell.trigger('input')
    
  await nextTick()
  expect(engine.getFlattened()).toContain('(0,0)a')
    expect(firstCell.text()).toBe('•')
  })

  it('handles multi-row wrapping when maxCharsPerCell > 1', async () => {
    const engine = new Password2DEngine({ rows: 2, cols: 2, maxCharsPerCell: 2 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: {
        engine,
        masked: false,
        onChange: () => {}
      }
    })

  const lastCellFirstRow = wrapper.find('[aria-label="Password cell at row 1, column 2"]')
  ;(lastCellFirstRow.element as HTMLElement).focus()
    
  // Fill last cell of first row and overflow. Send keydowns to the
  // currently-active element (document.activeElement) so we follow focus
  // movement done by the component.
  const keys = ['x', 'y', 'z']
  for (const k of keys) {
    const target = (document.activeElement as HTMLElement) || (lastCellFirstRow.element as HTMLElement)
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
    // rely on the component keydown handler to update engine and focus
    await nextTick()
  }
    
  await nextTick()
  // The last cell in first row is column=1,row=0 => (1,0)
  expect(engine.getFlattened()).toContain('(1,0)xy')
  // Overflowed character should appear in column=0,row=1 => (0,1)
  expect(engine.getFlattened()).toContain('(0,1)z')
  })

  it('clamps at final cell', async () => {
    const engine = new Password2DEngine({ rows: 2, cols: 2, maxCharsPerCell: 2 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: {
        engine,
        masked: false,
        onChange: () => {}
      }
    })

  const lastCell = wrapper.find('[aria-label="Password cell at row 2, column 2"]')
  ;(lastCell.element as HTMLElement).focus()
    
  // Try to overflow beyond grid capacity
  await lastCell.trigger('keydown', { key: 'a' })
  ;(lastCell.element as HTMLElement).innerText = 'a'
  await lastCell.trigger('input')
  await lastCell.trigger('keydown', { key: 'b' })
  ;(lastCell.element as HTMLElement).innerText = 'ab'
  await lastCell.trigger('input')
  await lastCell.trigger('keydown', { key: 'c' })
    
  await nextTick()
  expect(engine.getFlattened()).toContain('(1,1)ab')
  expect(engine.getFlattened()).not.toContain('c')
  })

  it('handles arrow navigation', async () => {
    const engine = new Password2DEngine({ rows: 2, cols: 2 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: {
        engine,
        masked: false,
        onChange: () => {}
      }
    })

  const firstCell = wrapper.find('[role="textbox"]')
  ;(firstCell.element as HTMLElement).focus()
    await firstCell.trigger('keydown', { key: 'ArrowRight' })
    
  await nextTick()
  const secondCell = wrapper.find('[aria-label="Password cell at row 1, column 2"]')
  expect(document.activeElement).toBe(secondCell.element)
  })

  it('customizes button text and classes', () => {
    const engine = new Password2DEngine({
      showText: 'Afficher',
      hideText: 'Masquer',
      resetText: 'Réinitialiser',
      showHideButtonClassName: 'custom-toggle',
      resetButtonClassName: 'custom-reset'
    })
    
    const wrapper = mount(PasswordGrid, {
      props: {
        engine,
        masked: true,
        onChange: () => {}
      }
    })

    const toggleButton = wrapper.find('button:first-child')
    const resetButton = wrapper.find('button:last-child')
    
  expect(toggleButton.text()).toBe('Afficher')
  expect(toggleButton.classes()).toContain('custom-toggle')
  expect(resetButton.text()).toBe('Réinitialiser')
  expect(resetButton.classes()).toContain('custom-reset')
  })

  it('deletion (Backspace) removes last character', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 1, maxCharsPerCell: 3 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: { engine, masked: false, onChange: () => {} }
    })

    const first = wrapper.find('[role="textbox"]')
    ;(first.element as HTMLElement).focus()

    // Type 'a' then 'b'
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await nextTick()
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
    await nextTick()

    expect(engine.getFlattened()).toContain('(0,0)ab')

    // Backspace should remove 'b'
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
    await nextTick()
    expect(engine.getFlattened()).toContain('(0,0)a')
  })

  it('paste inserts multiple characters into engine', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 2, maxCharsPerCell: 3 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: { engine, masked: false, onChange: () => {} }
    })

    const first = wrapper.find('[role="textbox"]')
    ;(first.element as HTMLElement).focus()

    // Create paste event with clipboardData polyfill
    const pasteEvt = new Event('paste', { bubbles: true }) as unknown as ClipboardEvent
    Object.defineProperty(pasteEvt, 'clipboardData', {
      value: { getData: (t: string) => (t === 'text' ? 'xyz' : '') }
    })
    ;(document.activeElement as HTMLElement).dispatchEvent(pasteEvt)
    await nextTick()

    expect(engine.getFlattened()).toContain('(0,0)xyz')
  })

  it('IME composition does not process intermediate keystrokes', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 1, maxCharsPerCell: 3 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: { engine, masked: false, onChange: () => {} }
    })

    const first = wrapper.find('[role="textbox"]')
    ;(first.element as HTMLElement).focus()

    // Start composition
    await first.trigger('compositionstart')
    // While composing, printable key should be ignored
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await nextTick()
    expect(engine.getFlattened()).not.toContain('(0,0)a')

    // End composition and send final character
    await first.trigger('compositionend')
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ä', bubbles: true }))
    await nextTick()
    expect(engine.getFlattened()).toContain('(0,0)ä')
  })

  it('typing more than maxCharsPerCell stops at limit and moves to next cell', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 2, maxCharsPerCell: 3 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: { engine, masked: false, onChange: () => {} }
    })

    const first = wrapper.find('[role="textbox"]')
    ;(first.element as HTMLElement).focus()

    const keys = ['1', '2', '3', '4']
    for (const k of keys) {
      ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
      await nextTick()
    }

    const flat = engine.getFlattened()
    expect(flat).toContain('(0,0)123')
    expect(flat).toContain('(1,0)4')
  })

  it('encoding respects coordinateMode yx', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 2, coordinateMode: 'yx' })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: { engine, masked: false, onChange: () => {} }
    })

    const cells = wrapper.findAll('[role="textbox"]')
    ;(cells[0].element as HTMLElement).focus()
    // move to second cell
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await nextTick()
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
    await nextTick()

    const encoded = engine.getFlattened()
    // In yx mode, for row=0 col=1 we expect (0,1)
    expect(encoded).toContain('(0,1)q')
  })

  it('multi-row wrapping advances to next row after last column', async () => {
    // 2 rows x 3 cols, maxCharsPerCell=1 makes each key advance the cursor
    const engine = new Password2DEngine({ rows: 2, cols: 3, maxCharsPerCell: 1 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: { engine, masked: false, onChange: () => {} }
    })

    const cells = wrapper.findAll('[role="textbox"]')
    // last column in first row: row 0, col 2 -> index 2
    const lastInFirstRow = cells[2]
    ;(lastInFirstRow.element as HTMLElement).focus()

    // Type a character into the last cell of row 0; with maxCharsPerCell=1
    // the next cell should be row 1, col 0 (index 3)
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }))
    await nextTick()

    const encoded = engine.getFlattened()
    // With coordinateMode default "xy" the encoded token for column=2,row=0 is (2,0)
    expect(encoded).toContain('(2,0)z')
    // Ensure focus moved to the first cell of next row
    const active = document.activeElement as HTMLElement
    expect(active).toBe(cells[3].element)
  })

  it('Shift+Tab moves focus backward to previous cell', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 3 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: { engine, masked: false, onChange: () => {} }
    })
  const cells = wrapper.findAll('[role="textbox"]')
  const [first, second, third] = cells;

  // Focus second, Shift+Tab should move back to first
  ;(second.element as HTMLElement).focus()
  await second.trigger('keydown', { key: 'Tab', shiftKey: true })
  await nextTick()
  expect(document.activeElement).toBe(first.element)
  
  // Focus third, Shift+Tab should move back to second
  ;(third.element as HTMLElement).focus()
  await third.trigger('keydown', { key: 'Tab', shiftKey: true })
  await nextTick()
  expect(document.activeElement).toBe(second.element)  
});
})