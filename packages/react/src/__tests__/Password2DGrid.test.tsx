import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePassword2D } from '../usePassword2D';

function Harness(props: any) {
  const [encoded, PasswordGrid] = usePassword2D(props);
  return (
    <div>
      <PasswordGrid />
      <div data-testid="encoded">{encoded}</div>
    </div>
  );
}

test('typing printable keys accumulates up to maxCharsPerCell', () => {
  render(<Harness rows={1} cols={3} maxCharsPerCell={3} masked={false} />);
  const cells = screen.getAllByRole('textbox');
  const first = cells[0];
  fireEvent.focus(first);

  fireEvent.keyDown(first, { key: 'a' });
  fireEvent.keyDown(first, { key: 'b' });
  fireEvent.keyDown(first, { key: 'c' });

  const encoded = screen.getByTestId('encoded').textContent || '';
  expect(encoded).toContain('(0,0)abc');
});

test('masked mode shows dots but engine still accumulates characters', () => {
  render(<Harness rows={1} cols={2} maxCharsPerCell={2} masked={true} />);
  const cells = screen.getAllByRole('textbox');
  const first = cells[0];
  fireEvent.focus(first);

  fireEvent.keyDown(first, { key: 'x' });
  fireEvent.keyDown(first, { key: 'y' });

  const encoded = screen.getByTestId('encoded').textContent || '';
  expect(encoded).toContain('(0,0)xy');
});

test('custom button text and classes are rendered', () => {
  render(
    <Harness
      rows={2}
      cols={2}
      showText="Afficher"
      hideText="Masquer"
      resetText="Réinitialiser"
      showHideButtonClassName="custom-show"
      resetButtonClassName="custom-reset"
    />
  );

  // Buttons are in the document
  expect(screen.getByText('Afficher') || screen.getByText('Masquer')).toBeInTheDocument();
  expect(screen.getByText('Réinitialiser')).toBeInTheDocument();

  // Check classes
  const showBtn = screen.getByText('Afficher') || screen.getByText('Masquer');
  expect(showBtn).toHaveClass('custom-show');
  const resetBtn = screen.getByText('Réinitialiser');
  expect(resetBtn).toHaveClass('custom-reset');
});

test('arrow and Tab navigation moves focus between cells', () => {
  render(<Harness rows={1} cols={3} />);
  const cells = screen.getAllByRole('textbox');
  const [first, second, third] = cells;

  fireEvent.focus(first);
  expect(document.activeElement).toBe(first);

  // ArrowRight should focus second
  fireEvent.keyDown(first, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(second);

  // ArrowRight again -> third
  fireEvent.keyDown(second, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(third);

  // ArrowLeft -> back to second
  fireEvent.keyDown(third, { key: 'ArrowLeft' });
  expect(document.activeElement).toBe(second);

  // Tab moves to next (wraps same as ArrowRight handler)
  fireEvent.keyDown(second, { key: 'Tab' });
  expect(document.activeElement).toBe(third);
});

test('deletion (Backspace) removes last character', () => {
  render(<Harness rows={1} cols={1} maxCharsPerCell={3} masked={false} />);
  const first = screen.getAllByRole('textbox')[0];
  fireEvent.focus(first);

  fireEvent.keyDown(first, { key: 'a' });
  fireEvent.keyDown(first, { key: 'b' });
  // ensure both added
  expect(screen.getByTestId('encoded').textContent).toContain('(0,0)ab');

  // Backspace should remove 'b'
  fireEvent.keyDown(first, { key: 'Backspace' });
  expect(screen.getByTestId('encoded').textContent).toContain('(0,0)a');
});

test('paste inserts multiple characters into engine', () => {
  render(<Harness rows={1} cols={2} maxCharsPerCell={3} masked={false} />);
  const first = screen.getAllByRole('textbox')[0];
  fireEvent.focus(first);

  // Simulate paste of 'xyz'
  fireEvent.paste(first, {
    clipboardData: {
      getData: (type: string) => (type === 'text' ? 'xyz' : ''),
    },
  } as unknown as DataTransfer);

  expect(screen.getByTestId('encoded').textContent).toContain('(0,0)xyz');
});

test('IME composition does not process intermediate keystrokes', () => {
  render(<Harness rows={1} cols={1} maxCharsPerCell={3} masked={false} />);
  const first = screen.getAllByRole('textbox')[0];
  fireEvent.focus(first);

  // Start composition
  fireEvent.compositionStart(first);
  // While composing, printable key should be ignored
  fireEvent.keyDown(first, { key: 'a' });
  expect(screen.getByTestId('encoded').textContent).not.toContain('(0,0)a');

  // End composition and send final character
  fireEvent.compositionEnd(first);
  fireEvent.keyDown(first, { key: 'ä' });
  expect(screen.getByTestId('encoded').textContent).toContain('(0,0)ä');
});

test('typing more than maxCharsPerCell stops at limit and moves to next cell', () => {
  render(<Harness rows={1} cols={2} maxCharsPerCell={3} masked={false} />);
  const cells = screen.getAllByRole('textbox');
  const first = cells[0];
  fireEvent.focus(first);

  // Type 4 characters into first cell with max 3. Send each key to the
  // currently focused element because the component moves focus when a
  // cell reaches maxCharsPerCell.
  let current = first as HTMLElement;
  const keys = ['1', '2', '3', '4'];
  for (const k of keys) {
    fireEvent.keyDown(current, { key: k });
    current = document.activeElement as HTMLElement;
  }

  const encoded = screen.getByTestId('encoded').textContent || '';
  // first cell contains only first 3 chars
  expect(encoded).toContain('(0,0)123');
  // next cell receives the overflowed '4'
  expect(encoded).toContain('(1,0)4');
});

test('encoding respects coordinateMode yx', () => {
  // Here we set coordinateMode to 'yx' and type in second column, expect (y,x)
  render(<Harness rows={1} cols={2} coordinateMode={'yx'} masked={false} />);
  const cells = screen.getAllByRole('textbox');
  const first = cells[0];
  fireEvent.focus(first);
  // move to second cell
  fireEvent.keyDown(first, { key: 'ArrowRight' });
  const second = document.activeElement as HTMLElement;
  fireEvent.keyDown(second, { key: 'q' });

  const encoded = screen.getByTestId('encoded').textContent || '';
  // In yx mode, for row=0 col=1 we expect (0,1)
  expect(encoded).toContain('(0,1)q');
});

test('multi-row wrapping advances to next row after last column', () => {
  // 2 rows x 3 cols, maxCharsPerCell=1 makes each key advance the cursor
  render(<Harness rows={2} cols={3} maxCharsPerCell={1} masked={false} />);
  const cells = screen.getAllByRole('textbox');
  // last column in first row: row 0, col 2 -> index 2
  const lastInFirstRow = cells[2];
  fireEvent.focus(lastInFirstRow);

  // Type a character into the last cell of row 0; with maxCharsPerCell=1
  // the next cell should be row 1, col 0 (index 3)
  fireEvent.keyDown(lastInFirstRow, { key: 'z' });

  const encoded = screen.getByTestId('encoded').textContent || '';
  // With coordinateMode default "xy" the encoded token for column=2,row=0 is (2,0)
  expect(encoded).toContain('(2,0)z');
  // Ensure focus moved to the first cell of next row
  const active = document.activeElement as HTMLElement;
  expect(active).toBe(cells[3]);
});

test('multi-row wrapping with maxCharsPerCell > 1 overflows into next row', () => {
  // 2 rows x 2 cols, maxCharsPerCell=2. We'll focus the last col of row0
  // (index 1), type 3 characters: first two fill that cell, third should
  // overflow into row1 col0 (index 2).
  render(<Harness rows={2} cols={2} maxCharsPerCell={2} masked={false} />);
  const cells = screen.getAllByRole('textbox');
  const lastInFirstRow = cells[1];
  fireEvent.focus(lastInFirstRow);

  // Type sequence 'a','b','c' sending to the active element each time
  let current = lastInFirstRow as HTMLElement;
  for (const k of ['a', 'b', 'c']) {
    fireEvent.keyDown(current, { key: k });
    current = document.activeElement as HTMLElement;
  }

  const encoded = screen.getByTestId('encoded').textContent || '';
  // Overflowed character should appear in row1 col0 => (0,1)
  expect(encoded).toContain('(0,1)c');
  // Focus should have moved to that cell (index 2)
  expect(document.activeElement).toBe(cells[2]);
});

test('typing beyond final cell clamps to last cell and discards extra input', () => {
  // 1 row x 2 cols, maxCharsPerCell=2. Typing many chars should clamp at
  // the last cell (col 1) and it should contain at most 2 chars.
  render(<Harness rows={1} cols={2} maxCharsPerCell={2} masked={false} />);
  const cells = screen.getAllByRole('textbox');
  const first = cells[0];
  fireEvent.focus(first);

  // Type a sequence longer than total capacity (4 = 2 cells * 2 chars)
  const keys = ['1', '2', '3', '4', '5'];
  let current = first as HTMLElement;
  for (const k of keys) {
    fireEvent.keyDown(current, { key: k });
    current = document.activeElement as HTMLElement;
  }

  const encoded = screen.getByTestId('encoded').textContent || '';
  // First cell should have first 2 chars
  expect(encoded).toContain('(0,0)12');
  // Second (last) cell should have next 2 chars and not include the 5th
  expect(encoded).toContain('(1,0)34');
  expect(encoded).not.toContain('5');
});
