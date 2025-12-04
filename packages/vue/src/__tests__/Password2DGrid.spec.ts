import { mount } from '@vue/test-utils'
import { Password2DEngine } from '@password2d/core'
import PasswordGrid from '../Password2DGrid.vue'
import { nextTick } from 'vue'

describe('Password2DGrid (Vue)', () => {
  it('typing printable keys accumulates up to maxCharsPerCell', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 3, maxCharsPerCell: 3 })
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


  it('masked mode shows dots but engine still accumulates characters', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 2, maxCharsPerCell: 2 })
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
    await firstCell.trigger('keydown', { key: 'x' })
    ;(firstCell.element as HTMLElement).innerText = '•'
    await firstCell.trigger('input')
      
    await nextTick()
    expect(engine.getFlattened()).toContain('(0,0)x')
    expect(firstCell.text()).toBe('•')
  })


  it('custom button text and classes are rendered', () => {
    const engine = new Password2DEngine({
      rows: 2,
      cols: 2,
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


  it('arrow and Tab navigation moves focus between cells', async () => {
    const engine = new Password2DEngine({ rows: 2, cols: 3 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: {
        engine,
        masked: false,
        onChange: () => {}
      }
    })

    // ArrowRight should focus second
    const firstCell = wrapper.find('[role="textbox"]')
    ;(firstCell.element as HTMLElement).focus()
    await firstCell.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    const secondCell = wrapper.find('[aria-label="Password cell at row 1, column 2"]')
    expect(document.activeElement).toBe(secondCell.element)

    // ArrowRight again -> third
    await secondCell.trigger('keydown', { key: 'ArrowRight' })
    await nextTick()
    const thirdCell = wrapper.find('[aria-label="Password cell at row 1, column 3"]')
    expect(document.activeElement).toBe(thirdCell.element)

    // ArrowLeft -> back to second
    await thirdCell.trigger('keydown', { key: 'ArrowLeft' })
    await nextTick()
    expect(document.activeElement).toBe(secondCell.element)

    // Tab moves to next (wraps same as ArrowRight handler)
    await secondCell.trigger('keydown', { key: 'Tab' })
    await nextTick()
    expect(document.activeElement).toBe(thirdCell.element)

    // ArrowDown -> sixth
    await thirdCell.trigger('keydown', { key: 'ArrowDown' })
    await nextTick()
    const sixthCell = wrapper.find('[aria-label="Password cell at row 2, column 3"]')
    expect(document.activeElement).toBe(sixthCell.element)

    // ArrowUp -> third
    await sixthCell.trigger('keydown', { key: 'ArrowUp' })
    await nextTick()
    expect(document.activeElement).toBe(thirdCell.element)

    // Tab moves to next line cell: fourth
    await thirdCell.trigger('keydown', { key: 'Tab' })
    await nextTick()
    const fourthCell = wrapper.find('[aria-label="Password cell at row 2, column 1"]')
    expect(document.activeElement).toBe(fourthCell.element)

    // Tab moves to next fifth cell
    await fourthCell.trigger('keydown', { key: 'Tab' })
    await nextTick()
    const fifthCell = wrapper.find('[aria-label="Password cell at row 2, column 2"]')
    expect(document.activeElement).toBe(fifthCell.element)
  })


  it('Shift+Tab moves focus backward to previous cell', async () => {
    const engine = new Password2DEngine({ rows: 2, cols: 3 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: { engine, masked: false, onChange: () => {} }
    })
    const cells = wrapper.findAll('[role="textbox"]')
    const [first, second, third, fourth, fifth, sixth] = cells;

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

    // Focus fouth on line 2, Shift+Tab should move back to third on line 1
    ;(fourth.element as HTMLElement).focus()
    await fourth.trigger('keydown', { key: 'Tab', shiftKey: true })
    await nextTick()
    expect(document.activeElement).toBe(third.element)  
  });


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
      value: { getData: (t: string) => (t === 'text' ? 'xyzA' : '') }
    })
    ;(document.activeElement as HTMLElement).dispatchEvent(pasteEvt)
    await nextTick()

    expect(engine.getFlattened()).toContain('(0,0)xyz(1,0)A')
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

    // test for chinese character
    // Start composition
    await first.trigger('compositionstart')
    // While composing, printable key should be ignored
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
    await nextTick()
    expect(engine.getFlattened()).not.toContain('(0,0)b')

    // End composition and send final character
    await first.trigger('compositionend')
    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: '汉', bubbles: true }))
    await nextTick()
    expect(engine.getFlattened()).toContain('(0,0)ä汉')
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
    // first cell contains only first 3 chars
    expect(flat).toContain('(0,0)123')
    // overflowed char goes to second cell
    expect(flat).toContain('(1,0)4')
    // Full expected string
    expect(flat).toBe('(0,0)123(1,0)4')
  })


  it('encoding respects coordinateMode xy', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 2, coordinateMode: 'xy' })
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
    // In yx mode, for row=0 col=1 we expect (1,0)
    expect(encoded).toContain('(1,0)q')
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


  it('multi-row wrapping with maxCharsPerCell > 1 overflows into next row', async () => {
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
    // Last cell of first row should contain 'xy'
    expect(engine.getFlattened()).toContain('(1,0)xy')
    // Overflowed character should appear in row1 col0 => (0,1)
    expect(engine.getFlattened()).toContain('(0,1)z')
    // Full expected string
    expect(engine.getFlattened()).toBe('(1,0)xy(0,1)z')
    // Focus should have moved to that cell (index 2)
    const cells = wrapper.findAll('[role="textbox"]')
    expect(document.activeElement).toBe(cells[2].element)
  })


  it('typing beyond final cell clamps to last cell and discards extra input', async () => {
    const engine = new Password2DEngine({ rows: 1, cols: 2, maxCharsPerCell: 2 })
    const wrapper = mount(PasswordGrid, {
      attachTo: document.body,
      props: {
        engine,
        masked: false,
        onChange: () => {}
      }
    })

    const lastCell = wrapper.find('[aria-label="Password cell at row 1, column 2"]')
    ;(lastCell.element as HTMLElement).focus()
      
    // Try to overflow beyond grid capacity
    await lastCell.trigger('keydown', { key: '1' })
    ;(lastCell.element as HTMLElement).innerText = '1'
    await lastCell.trigger('input')
    await lastCell.trigger('keydown', { key: '2' })
    ;(lastCell.element as HTMLElement).innerText = '12'
    await lastCell.trigger('input')
    await lastCell.trigger('keydown', { key: '3' })
      
    await nextTick()
    expect(engine.getFlattened()).toContain('(1,0)12')
    expect(engine.getFlattened()).not.toContain('3')
  })

})