import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      render(<Badge>Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-surface-light', 'text-text-secondary');
    });
  });

  describe('Variants', () => {
    it('renders default variant correctly', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-surface-light', 'text-text-secondary');
    });

    it('renders primary variant correctly', () => {
      render(<Badge variant="primary">Primary</Badge>);
      const badge = screen.getByText('Primary');
      expect(badge).toHaveClass('bg-primary/20', 'text-primary');
    });

    it('renders secondary variant correctly', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-accent/20', 'text-accent');
    });

    it('renders success variant correctly', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-success/20', 'text-success');
    });

    it('renders warning variant correctly', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-warning/20', 'text-warning');
    });

    it('renders error variant correctly', () => {
      render(<Badge variant="error">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-error/20', 'text-error');
    });

    it('renders outline variant correctly', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('border', 'border-border', 'text-text-secondary');
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      render(<Badge size="sm">Small</Badge>);
      const badge = screen.getByText('Small');
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('renders medium size correctly', () => {
      render(<Badge size="md">Medium</Badge>);
      const badge = screen.getByText('Medium');
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm');
    });

    it('renders large size correctly', () => {
      render(<Badge size="lg">Large</Badge>);
      const badge = screen.getByText('Large');
      expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
    });
  });

  describe('Styling', () => {
    it('has rounded-full class', () => {
      render(<Badge>Rounded</Badge>);
      expect(screen.getByText('Rounded')).toHaveClass('rounded-full');
    });

    it('has inline-flex display', () => {
      render(<Badge>Flex</Badge>);
      expect(screen.getByText('Flex')).toHaveClass('inline-flex');
    });

    it('supports custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>);
      expect(screen.getByText('Custom')).toHaveClass('custom-class');
    });

    it('merges custom className with defaults', () => {
      render(<Badge className="custom-class" variant="primary">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-class', 'rounded-full', 'bg-primary/20');
    });
  });

  describe('Complex Content', () => {
    it('renders with icon and text', () => {
      render(
        <Badge>
          <span data-testid="icon">🎮</span>
          <span>Gaming</span>
        </Badge>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Gaming')).toBeInTheDocument();
    });

    it('renders with multiple elements', () => {
      render(
        <Badge>
          <span>Level</span>
          <strong>42</strong>
        </Badge>
      );
      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Badge ref={ref}>Ref Badge</Badge>);
      expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    });
  });

  describe('HTML Attributes', () => {
    it('passes through HTML attributes', () => {
      render(
        <Badge data-testid="test-badge" id="badge-1">
          Test
        </Badge>
      );
      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('id', 'badge-1');
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      render(<Badge onClick={handleClick}>Clickable</Badge>);
      screen.getByText('Clickable').click();
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('All Variant/Size Combinations', () => {
    const variants = ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'outline'] as const;
    const sizes = ['sm', 'md', 'lg'] as const;

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        it(`renders ${variant}/${size} combination`, () => {
          render(
            <Badge variant={variant} size={size}>
              {variant}-{size}
            </Badge>
          );
          expect(screen.getByText(`${variant}-${size}`)).toBeInTheDocument();
        });
      });
    });
  });
});
