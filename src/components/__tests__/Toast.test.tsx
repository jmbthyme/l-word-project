import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastContainer, useToast, type ToastMessage } from '../Toast';

describe('Toast Component', () => {
  const mockToast: ToastMessage = {
    id: '1',
    title: 'Test Title',
    message: 'Test message',
    type: 'info'
  };

  it('renders toast message correctly', () => {
    const onClose = vi.fn();
    
    render(
      <ToastContainer messages={[mockToast]} onClose={onClose} />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('closes when close button is clicked', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    
    render(
      <ToastContainer messages={[mockToast]} onClose={onClose} />
    );

    // Find the close button by its aria-label
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    // Fast-forward time to trigger the close animation timeout
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // The close handler should be called after the animation
    expect(onClose).toHaveBeenCalledWith('1');
    
    vi.useRealTimers();
  });

  it('renders different toast types', () => {
    const toasts: ToastMessage[] = [
      { ...mockToast, id: '1', type: 'success' },
      { ...mockToast, id: '2', type: 'error' },
      { ...mockToast, id: '3', type: 'warning' },
      { ...mockToast, id: '4', type: 'info' }
    ];

    const onClose = vi.fn();
    
    render(
      <ToastContainer messages={toasts} onClose={onClose} />
    );

    // Check that all toasts are rendered
    expect(screen.getAllByText('Test Title')).toHaveLength(4);
    expect(screen.getAllByText('Test message')).toHaveLength(4);
  });

  it('handles empty message list', () => {
    const onClose = vi.fn();
    
    const { container } = render(
      <ToastContainer messages={[]} onClose={onClose} />
    );

    // Should render empty container
    expect(container.firstChild?.childNodes).toHaveLength(0);
  });

  it('provides screen reader text', () => {
    const onClose = vi.fn();
    
    render(
      <ToastContainer messages={[mockToast]} onClose={onClose} />
    );

    expect(screen.getByText('Close')).toBeInTheDocument();
  });
});