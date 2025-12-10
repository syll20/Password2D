import { Password2D } from '../Password2D'

function wait(ms = 20) {
  return new Promise((r) => setTimeout(r, ms))
}

describe('Password2D (Vanilla) - typing / behavior', () => {

  it('create a grid with maxCharsPerCell = 3 and accumulate input accordingly', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 2, maxCharsPerCell: 3, masked: false })

    const cells = container.querySelectorAll('[role="textbox"]')
    const first = cells[0] as HTMLElement
    first.focus()

    // Type 4 characters into first cell with max 3. Send each key to the
    // currently focused element because the component moves focus when a
    // cell reaches maxCharsPerCell.
    let current = first
    const keys = ['1', '2', '3', '4']
    for (const k of keys) {
      current.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
      await wait()
      current = document.activeElement as HTMLElement
    }

    const flat = pwd.value
    expect(flat).toContain('(0,0)123')
    expect(flat).toContain('(1,0)4')
    expect(flat).toBe('(0,0)123(1,0)4')

    pwd.destroy()
    container.remove()
  })


  it('typing printable keys accumulates up to maxCharsPerCell', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 3, maxCharsPerCell: 3, masked: false })

    const firstCell = container.querySelector('[role="textbox"]') as HTMLElement
    firstCell.focus()

    firstCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await wait();
    // emulate input changes as component would process
    (firstCell as HTMLElement).innerText = 'a'
    firstCell.dispatchEvent(new Event('input', { bubbles: true }))
    await wait();

    firstCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
    await wait();
    (firstCell as HTMLElement).innerText = 'ab'
    firstCell.dispatchEvent(new Event('input', { bubbles: true }))
    await wait();

    firstCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }))
    await wait();
    (firstCell as HTMLElement).innerText = 'abc'
    firstCell.dispatchEvent(new Event('input', { bubbles: true }))
    await wait();

    expect(pwd.value).toContain('(0,0)abc')

    pwd.destroy()
    container.remove()
  })


  it('paste inserts multiple characters into engine', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 2, maxCharsPerCell: 3, masked: false })

    const first = container.querySelector('[role="textbox"]') as HTMLElement
    first.focus()

    // Create paste event with clipboardData polyfill
    const pasteEvt = new Event('paste', { bubbles: true }) as unknown as ClipboardEvent
    Object.defineProperty(pasteEvt, 'clipboardData', {
      value: { getData: (t: string) => (t === 'text' ? 'xyzA' : '') }
    })
    ;(document.activeElement as HTMLElement).dispatchEvent(pasteEvt)
    await wait()

    expect(pwd.value).toContain('(0,0)xyz(1,0)A')

    pwd.destroy()
    container.remove()
  })


  it('should add a character on input', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { masked: false })

    const first = container.querySelector('[role="textbox"]') as HTMLElement
    first.focus()

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await wait()

    expect(pwd.value).toContain('(0,0)a')

    pwd.destroy()
    container.remove()
  })


  it('typing more than maxCharsPerCell stops at limit and moves to next cell', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 2, maxCharsPerCell: 2, masked: false })

    const cells = container.querySelectorAll('[role="textbox"]')
    const first = cells[0] as HTMLElement
    first.focus()

    const keys = ['x', 'y', 'z']
    let current = first
    for (const k of keys) {
      current.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
      await wait()
      current = document.activeElement as HTMLElement
    }

    const encoded = pwd.value
    expect(encoded).toContain('(0,0)xy')
    expect(encoded).toContain('(1,0)z')

    pwd.destroy()
    container.remove()
  })


  it('encoding respects coordinateMode xy', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 2, coordinateMode: 'xy', masked: false })

    const cells = container.querySelectorAll('[role="textbox"]')
    // Directly send key to second cell instead of moving focus via ArrowRight
    const secondCell = cells[1] as HTMLElement
    secondCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
    await wait()
    await wait()

    const encoded = pwd.value
    expect(encoded).toContain('(1,0)q')

    pwd.destroy()
    container.remove()
  })


  it('encoding respects coordinateMode yx', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 2, coordinateMode: 'yx', masked: false })

    const cells = container.querySelectorAll('[role="textbox"]')
    // Directly send key to second cell instead of moving focus via ArrowRight
    const secondCell = cells[1] as HTMLElement
    secondCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'q', bubbles: true }))
    await wait()
    await wait()

    const encoded = pwd.value
    expect(encoded).toContain('(0,1)q')

    pwd.destroy()
    container.remove()
  })


  it('deletion (Backspace) removes last character', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 1, maxCharsPerCell: 3, masked: false })

    const first = container.querySelector('[role="textbox"]') as HTMLElement
    first.focus()

    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await wait()
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
    await wait()

    expect(pwd.value).toContain('(0,0)ab')

    ;(document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }))
    await wait()
    expect(pwd.value).toContain('(0,0)a')

    pwd.destroy()
    container.remove()
  })


  it('multi-row wrapping with maxCharsPerCell > 1 overflows into next row', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 2, cols: 2, maxCharsPerCell: 2, masked: false })

    const cells = container.querySelectorAll('[role="textbox"]')
    const lastCellFirstRow = cells[1] as HTMLElement
    lastCellFirstRow.focus()

    const keys = ['x', 'y', 'z']
    for (const k of keys) {
      const target = (document.activeElement as HTMLElement) || lastCellFirstRow
      target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
      await wait()
    }

    await wait()
    expect(pwd.value).toContain('(1,0)xy')
    expect(pwd.value).toContain('(0,1)z')
    expect(pwd.value).toBe('(1,0)xy(0,1)z')

    const all = container.querySelectorAll('[role="textbox"]')
    expect(document.activeElement).toBe(all[2])

    pwd.destroy()
    container.remove()
  })


  it('typing beyond final cell clamps to last cell and discards extra input', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 2, maxCharsPerCell: 2, masked: false })

    const cells = container.querySelectorAll('[role="textbox"]')
    const first = cells[0] as HTMLElement
    first.focus()

    const keys = ['1', '2', '3', '4', '5']
    let current = first
    for (const k of keys) {
      current.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
      await wait()
      current = document.activeElement as HTMLElement
    }

    const encoded = pwd.value
    expect(encoded).toContain('(0,0)12')
    expect(encoded).toContain('(1,0)34')
    expect(encoded).not.toContain('5')

    pwd.destroy()
    container.remove()
  })


  it('IME composition does not process intermediate keystrokes', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const pwd = new Password2D(container, { rows: 1, cols: 1, maxCharsPerCell: 3, masked: false })

    const first = container.querySelector('[role="textbox"]') as HTMLElement
    first.focus()

    // Start composition
    first.dispatchEvent(new Event('compositionstart', { bubbles: true }))
    // While composing, printable key should be ignored
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    await wait()
    expect(pwd.value).not.toContain('(0,0)a')

    // End composition and send final character
    first.dispatchEvent(new Event('compositionend', { bubbles: true }))
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ä', bubbles: true }))
    await wait()
    expect(pwd.value).toContain('(0,0)ä')

    // test for chinese character
    first.dispatchEvent(new Event('compositionstart', { bubbles: true }))
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
    await wait()
    expect(pwd.value).not.toContain('(0,0)b')

    first.dispatchEvent(new Event('compositionend', { bubbles: true }))
    first.dispatchEvent(new KeyboardEvent('keydown', { key: '汉', bubbles: true }))
    await wait()
    expect(pwd.value).toContain('(0,0)ä汉')

    pwd.destroy()
    container.remove()
  })

})
