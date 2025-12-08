import { mount } from '@vue/test-utils'
import { Password2DEngine } from '@password2d/core'
import PasswordGrid from '../Password2DGrid.vue'
import { nextTick } from 'vue'

describe('Password2DGrid (Vue) - typing / behavior', () => {

    it('create a grid with maxCharsPerCell = 3 and accumulate input accordingly', async() => {

        const engine = new Password2DEngine({rows: 1, cols: 2, maxCharsPerCell: 3})
        const wrapper = mount(PasswordGrid, {
            attachTo: document.body,
            props: {
                engine,
                masked: false,
                onChange: () => {}
            }
        })
    
        const cells = wrapper.findAll('[role="textbox"]')
        const first = cells[0]
        ;(first.element as HTMLElement).focus()

        // Type 4 characters into first cell with max 3. Send each key to the
        // currently focused element because the component moves focus when a
        // cell reaches maxCharsPerCell.
        let current = first.element as HTMLElement
        const keys = ['1', '2', '3', '4']
        for (const k of keys) {
            current.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
            // rely on the component keydown handler to update engine and focus
            await nextTick()
            current = document.activeElement as HTMLElement
        }
    
        const flat = engine.getFlattened()
        // first cell contains only first 3 chars
        expect(flat).toContain('(0,0)123')
        // overflowed char goes to second cell
        expect(flat).toContain('(1,0)4')
        // Full expected string
        expect(flat).toBe('(0,0)123(1,0)4')

    })


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


    it('should add a character on input', async() => {
        const engine = new Password2DEngine({ rows: 1, cols: 1, maxCharsPerCell: 3 })
        const wrapper = mount(PasswordGrid, {
            attachTo: document.body,
            props: { engine, masked: false, onChange: () => {} }
        })
    
        const first = wrapper.find('[role="textbox"]')
        ;(first.element as HTMLElement).focus()
    
        await first.trigger('keydown', { key: 'a' })
        ;(first.element as HTMLElement).innerText = 'a'
        await first.trigger('input')
          
        await nextTick()
        expect(engine.getFlattened()).toContain('(0,0)a')
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
      

    
});