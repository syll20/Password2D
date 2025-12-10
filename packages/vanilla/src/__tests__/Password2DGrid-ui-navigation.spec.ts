import { Password2D } from '../Password2D'

function wait(ms = 20) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('Password2D (Vanilla) - ui / navigation', () => {

  it('should create grid', () => {
    const container = document.createElement('div')
    const pwd = new Password2D(container, { rows: 2, cols: 3 })
    expect(pwd).toBeTruthy()
    expect(container.innerHTML).not.toBe('')
  })


  it('should render the correct number of cells', () => {
    const container = document.createElement('div')
    new Password2D(container, { rows: 3, cols: 6 })
    const cells = container.querySelectorAll('[role="textbox"]')
    expect(cells.length).toBe(18)
  })


  it('custom button text and classes are rendered', () => {
    const container = document.createElement('div')
    const pwd = new Password2D(container, {
      rows: 2,
      cols: 2,
      showText: 'Afficher',
      hideText: 'Masquer',
      resetText: 'Réinitialiser',
      showHideButtonClassName: 'custom-toggle',
      resetButtonClassName: 'custom-reset'
    })

    // Buttons are appended after grid
    const buttons = container.querySelectorAll('button')
    const toggle = Array.from(buttons).find(b => b.textContent === 'Afficher' || b.textContent === 'Masquer')
    const reset = Array.from(buttons).find(b => b.textContent === 'Réinitialiser')

    expect(toggle).toBeDefined()
    expect(reset).toBeDefined()
    expect(toggle?.classList.contains('custom-toggle')).toBe(true)
    expect(reset?.classList.contains('custom-reset')).toBe(true)
  })


  it('arrow and Tab navigation moves focus between cells', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 2, cols: 3, masked: false })
    const cells = container.querySelectorAll('[role="textbox"]')
    const [first, second, third, fourth, fifth, sixth] = Array.from(cells) as HTMLElement[]

    first.focus()
    expect(document.activeElement).toBe(first)

    // ArrowRight -> second
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(second)

    // ArrowRight -> third
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(third)

    // ArrowLeft -> second
    third.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(second)

    // Tab -> third
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(third)

    // ArrowDown -> sixth
    third.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(sixth)

    // ArrowUp -> third
    sixth.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(third)

    // Tab -> fourth
    third.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(fourth)

    // Tab -> fifth
    fourth.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(fifth)

    pwd.destroy()
    container.remove()
  })


  it('Shift+Tab moves focus backward to previous cell', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    new Password2D(container, { rows: 2, cols: 3, masked: false })
    const cells = Array.from(container.querySelectorAll('[role="textbox"]')) as HTMLElement[]
    const [first, second, third, fourth] = cells

    ;(second as HTMLElement).focus()
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(first)

    ;(third as HTMLElement).focus()
    third.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(second)

    ;(fourth as HTMLElement).focus()
    fourth.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    await wait()
    expect(document.activeElement).toBe(third)

    container.remove()
  })


  it('multi-row wrapping advances to next row after last column', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 2, cols: 3, maxCharsPerCell: 1, masked: false })
    const cells = Array.from(container.querySelectorAll('[role="textbox"]')) as HTMLElement[]
    const lastInFirstRow = cells[2]
    lastInFirstRow.focus()

    // Type 'z'
    lastInFirstRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }))
    await wait(30)

    const encoded = pwd.value
    expect(encoded).toContain('(2,0)z')

    const active = document.activeElement as HTMLElement
    expect(active).toBe(cells[3])

    pwd.destroy()
    container.remove()
  })


  it('masked mode shows dots but engine still accumulates characters', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 2, maxCharsPerCell: 2, masked: true })
    const firstCell = container.querySelector('[role="textbox"]') as HTMLElement
    firstCell.focus()

    firstCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }))
    firstCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', bubbles: true }))
    await wait(30)

    const encoded = pwd.value
    expect(encoded).toContain('(0,0)xy')

    // masked visuals should show bullets
    const cellText = firstCell.textContent || ''
    expect(cellText).toBe('••')

    pwd.destroy()
    container.remove()
  })

})
