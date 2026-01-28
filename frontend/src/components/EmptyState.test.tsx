import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title and optional description', () => {
    render(<EmptyState title="No items yet" description="Add your first item." />);
    expect(screen.getByRole('heading', { name: 'No items yet' })).toBeInTheDocument();
    expect(screen.getByText('Add your first item.')).toBeInTheDocument();
  });

  it('renders action button when actionLabel and onAction provided', async () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="Empty"
        actionLabel="Add item"
        onAction={onAction}
      />
    );
    const btn = screen.getByRole('button', { name: 'Add item' });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('has data-empty-state attribute', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector('[data-empty-state]')).toBeInTheDocument();
  });
});
