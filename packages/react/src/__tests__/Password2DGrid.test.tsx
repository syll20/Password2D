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
