import { mount } from '@vue/test-utils'
import { Password2DEngine } from '@password2d/core'
import PasswordGrid from '../Password2DGrid.vue'
import { nextTick } from 'vue'

describe('Password2DGrid (Vue) - ui / navigation', () => {

    it('should create grid', async() => {
        const engine = new Password2DEngine()

        const wrapper = mount(PasswordGrid, {
          props: {
            engine,
            masked: true,
            onChange: () => {}
          }
        })
    
        expect(wrapper.exists()).toBe(true)
    })


    it('should render the correct number of cells', async() => {
        const engine = new Password2DEngine({rows: 3, cols: 6})
        
        const wrapper = mount(PasswordGrid, {
            props: {
                engine,
                masked: true,
                onChange: () => {}
            }
        })
    
        const cells = wrapper.findAll('[role="textbox"]')
        expect(cells.length).toBe(18) // default 2 rows * 8 cols
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

});