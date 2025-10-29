import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { use2DPassword } from '../use2DPassword';

function Harness(props: any) {
  const [encoded, PasswordGrid] = use2DPassword(props);
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
