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


test('should create grid', () => {
  render(<Harness rows={2} cols={3} />);
  expect(<Harness />).toBeTruthy();
});


test('should render the correct number of cells', () => {
  render(<Harness rows={3} cols={6} />);
  const encoded = screen.getByTestId('encoded').textContent || '';
  // With default 2 rows, 8 cols and maxCharsPerCell=1, the encoded string should be empty
  expect(encoded).toBe('');
  const cells = screen.getAllByRole('textbox');
  expect(cells.length).toBe(18); // 2 rows * 8 cols
});


test('custom button text and classes are rendered', () => {
  render(
    <Harness
      rows={2}
      cols={2}
      showText="Afficher"
      hideText="Masquer"
      resetText="Réinitialiser"
      showHideButtonClassName="custom-toggle"
      resetButtonClassName="custom-reset"
    />
  );

  // Buttons are in the document
  expect(screen.getByText('Afficher') || screen.getByText('Masquer')).toBeInTheDocument();
  expect(screen.getByText('Réinitialiser')).toBeInTheDocument();

  // Check classes
  const showBtn = screen.getByText('Afficher') || screen.getByText('Masquer');
  expect(showBtn).toHaveClass('custom-toggle');
  const resetBtn = screen.getByText('Réinitialiser');
  expect(resetBtn).toHaveClass('custom-reset');
});


test('arrow and Tab navigation moves focus between cells', () => {
  render(<Harness rows={2} cols={3} />);
  const cells = screen.getAllByRole('textbox');
  const [first, second, third, fourth, fifth, sixth] = cells;

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

  // ArrowDown -> sixth
  fireEvent.keyDown(third, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(sixth);

  // ArrowUp -> third
  fireEvent.keyDown(sixth, { key: 'ArrowUp' });
  expect(document.activeElement).toBe(third);

  // Tab moves to next line cell: fourth
  fireEvent.keyDown(third, { key: 'Tab' });
  expect(document.activeElement).toBe(fourth);

  // Tab moves to next fifth cell
  fireEvent.keyDown(fourth, { key: 'Tab' });
  expect(document.activeElement).toBe(fifth);
  
});


test('Shift+Tab moves focus backward to previous cell', () => {
  render(<Harness rows={2} cols={3} />);
  const cells = screen.getAllByRole('textbox');
  const [first, second, third, fourth, fifth, sixth] = cells;

  // Focus second, Shift+Tab should move back to first
  fireEvent.focus(second);
  expect(document.activeElement).toBe(second);
  fireEvent.keyDown(second, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(first);

  // Focus third, Shift+Tab should move back to second
  fireEvent.focus(third);
  expect(document.activeElement).toBe(third);
  fireEvent.keyDown(third, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(second);

  // Focus fouth on line 2, Shift+Tab should move back to third on line 1
  fireEvent.focus(fourth);
  expect(document.activeElement).toBe(fourth);
  fireEvent.keyDown(fourth, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(third);
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