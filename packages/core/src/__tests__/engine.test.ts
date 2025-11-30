import { Password2DEngine } from '../engine'

describe('Password2DEngine', () => {
  test('constructor sets defaults and shapes grid', () => {
    const e = new Password2DEngine()
    expect(e.rows).toBe(2)
    expect(e.cols).toBe(8)
    expect(e.maxCharsPerCell).toBe(3)
    expect(e.masked).toBe(true)
    expect(e.grid.length).toBe(2)
    expect(e.grid[0].length).toBe(8)
    expect(e.cursor).toEqual({ row: 0, col: 0 })
  })

  test('addChar appends and updates cursor when not full', () => {
    const e = new Password2DEngine({ rows: 1, cols: 2, maxCharsPerCell: 3 })
    const pos = e.addChar(0, 0, 'a')
    expect(pos).toEqual({ row: 0, col: 0 })
    expect(e.grid[0][0]).toBe('a')
    expect(e.cursor).toEqual({ row: 0, col: 0 })
  })

  test('ignores mask bullet and whitespace inputs', () => {
    const e = new Password2DEngine({ rows: 1, cols: 1, maxCharsPerCell: 3 })
    e.cursor = { row: 0, col: 0 }
    e.grid[0][0] = ''
    const beforeCursor = { ...e.cursor }
    const posBullet = e.addChar(0, 0, '•')
    expect(posBullet).toEqual({ row: 0, col: 0 })
    // nothing added
    expect(e.grid[0][0]).toBe('')
    // cursor not advanced by the ignored input
    expect(e.cursor).toEqual(beforeCursor)

    const posSpace = e.addChar(0, 0, ' ')
    expect(posSpace).toEqual({ row: 0, col: 0 })
    expect(e.grid[0][0]).toBe('')
  })

  test('overflow moves to next cell and does not write past max', () => {
    const e = new Password2DEngine({ rows: 1, cols: 3, maxCharsPerCell: 2 })
    // type 'a','b','c' into first cell sequentially
    let pos = e.addChar(0, 0, 'a')
    expect(e.grid[0][0]).toBe('a')
    pos = e.addChar(0, 0, 'b')
    // after filling, engine should have written 'ab' in cell 0
    expect(e.grid[0][0]).toBe('ab')
    // addChar returns the next position when a cell reaches max — callers
    // should write into that returned position. Simulate that behaviour:
    expect(pos).toEqual({ row: 0, col: 1 })
    const pos2 = e.addChar(pos!.row, pos!.col, 'c')
    expect(e.grid[0][1]).toBe('c')
    expect(e.getFlattened()).toContain('(0,0)ab')
    expect(e.getFlattened()).toContain('(1,0)c')
  })

  test('deleteChar removes last character and is no-op on invalid', () => {
    const e = new Password2DEngine({ rows: 1, cols: 1, maxCharsPerCell: 3 })
    e.addChar(0, 0, 'x')
    e.addChar(0, 0, 'y')
    expect(e.grid[0][0]).toBe('xy')
    e.deleteChar(0, 0)
    expect(e.grid[0][0]).toBe('x')
    // invalid coords do nothing
    e.deleteChar(-1, 0)
    expect(e.grid[0][0]).toBe('x')
  })

  test('reset clears grid and cursor', () => {
    const e = new Password2DEngine({ rows: 2, cols: 2 })
    e.addChar(0, 0, 'a')
    e.addChar(1, 1, 'b')
    e.reset()
    expect(e.grid.every((r) => r.every((c) => c === ''))).toBe(true)
    expect(e.cursor).toEqual({ row: 0, col: 0 })
  })

  test('toggleMask flips masked flag and getMaskedGrid respects it', () => {
    const e = new Password2DEngine({ rows: 1, cols: 2 })
    e.addChar(0, 0, 'p')
    e.addChar(0, 1, 'q')
    // default masked is true for default constructor
    const maskedGrid = e.getMaskedGrid()
    expect(maskedGrid[0][0]).toBe('•')
    expect(maskedGrid[0][1]).toBe('•')
    e.toggleMask()
    expect(e.masked).toBe(false)
    const rawGrid = e.getMaskedGrid()
    expect(rawGrid[0][0]).toBe('p')
    expect(rawGrid[0][1]).toBe('q')
  })

  test('getFlattened uses coordinateMode xy by default and yx when set', () => {
    const e = new Password2DEngine({ rows: 2, cols: 2, maxCharsPerCell: 2 })
    e.addChar(0, 0, 'a')
    e.addChar(0, 0, 'b')
    // put something at row1 col0
    e.addChar(1, 0, 'z')
    const flatXY = e.getFlattened()
    // xy mode: (col,row)value
    expect(flatXY).toContain('(0,0)ab')
    expect(flatXY).toContain('(0,1)z') // col 0, row 1 -> (0,1)

    const e2 = new Password2DEngine({ rows: 2, cols: 2, coordinateMode: 'yx' })
    e2.addChar(0, 1, 'x')
    const flatYX = e2.getFlattened()
    // yx mode: (row,col)value
    expect(flatYX).toContain('(0,1)x')
  })

  test('clone returns an independent copy', () => {
    const e = new Password2DEngine({ rows: 2, cols: 2 })
    e.addChar(0, 0, 'm')
    e.cursor = { row: 1, col: 1 }
    const c = e.clone()
    // identical content
    expect(c.getFlattened()).toBe(e.getFlattened())
    // but different object references for grid rows
    expect(c.grid).not.toBe(e.grid)
    // mutating clone does not affect original
    c.addChar(0, 1, 'x')
    expect(e.grid[0][1]).toBe('')
    // cursor copy is independent
    c.cursor = { row: 0, col: 0 }
    expect(e.cursor).toEqual({ row: 1, col: 1 })
  })

  test('moveToNextCell and moveToPrevCell wrap and clamp correctly', () => {
    const e = new Password2DEngine({ rows: 2, cols: 2 })
    // from (0,0) next -> (1,0)
    let next = e.moveToNextCell(0, 0)
    expect(next).toEqual({ row: 0, col: 1 })
    // next from last col should go to next row first col
    next = e.moveToNextCell(0, 1)
    expect(next).toEqual({ row: 1, col: 0 })
    // advancing beyond last cell clamps to last cell
    const clamped = e.moveToNextCell(1, 1)
    expect(clamped).toEqual({ row: 1, col: 1 })

    // prev from (0,0) clamps to (0,0)
    const prevClamp = e.moveToPrevCell(0, 0)
    expect(prevClamp).toEqual({ row: 0, col: 0 })
    // prev from (1,0) -> (0,1)
    const prev = e.moveToPrevCell(1, 0)
    expect(prev).toEqual({ row: 0, col: 1 })
  })

  test('addChar returns null on invalid coordinates', () => {
    const e = new Password2DEngine({ rows: 1, cols: 1 })
    const res = e.addChar(5, 5, 'a')
    expect(res).toBeNull()
  })
})
