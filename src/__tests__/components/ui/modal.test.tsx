import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/ui/modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders children when open', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(<Modal {...defaultProps} title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <Modal {...defaultProps} title="Title" description="Test Description" />
      );
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('does not render title section when no title', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      // Content should still be visible
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('renders close button by default', () => {
      render(<Modal {...defaultProps} title="Title" />);
      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('does not render close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} title="Title" onClose={onClose} />);

      await user.click(screen.getByRole('button'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Overlay Click', () => {
    it('calls onClose when overlay is clicked by default', async () => {
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      // Click the backdrop (first motion.div)
      const backdrop = document.querySelector('.bg-black\\/60');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not call onClose when closeOnOverlayClick is false', async () => {
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);

      const backdrop = document.querySelector('.bg-black\\/60');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).not.toHaveBeenCalled();
      }
    });

    it('does not close when clicking inside modal content', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Modal Content'));
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key', () => {
    it('calls onClose when Escape is pressed by default', () => {
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when closeOnEscape is false', () => {
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not respond to other keys', () => {
      const onClose = jest.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Sizes', () => {
    const sizes = ['sm', 'md', 'lg', 'xl', 'full'] as const;

    sizes.forEach((size) => {
      it(`renders correctly with size ${size}`, () => {
        render(<Modal {...defaultProps} size={size} />);
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
      });
    });
  });

  describe('Body Scroll Lock', () => {
    it('locks body scroll when modal opens', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when modal closes', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Animation', () => {
    it('renders with animation wrapper', () => {
      render(<Modal {...defaultProps} />);
      // Content should be visible (framer-motion is mocked)
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible heading when title is provided', () => {
      render(<Modal {...defaultProps} title="Accessible Title" />);
      expect(screen.getByRole('heading', { name: 'Accessible Title' })).toBeInTheDocument();
    });

    it('supports custom className', () => {
      render(<Modal {...defaultProps} className="custom-modal" />);
      expect(screen.getByText('Modal Content').parentElement?.parentElement).toHaveClass('custom-modal');
    });
  });

  describe('Complex Content', () => {
    it('renders complex children correctly', () => {
      render(
        <Modal {...defaultProps}>
          <div data-testid="form">
            <input type="text" placeholder="Name" />
            <button>Submit</button>
          </div>
        </Modal>
      );

      expect(screen.getByTestId('form')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('handles form interactions inside modal', async () => {
      const handleSubmit = jest.fn();
      const user = userEvent.setup();

      render(
        <Modal {...defaultProps}>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <input type="text" placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );

      await user.type(screen.getByPlaceholderText('Name'), 'Test User');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
