import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from '@/components/ui/avatar';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError, fill, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      onError={onError}
      data-testid="avatar-image"
      data-fill={fill ? "true" : undefined}
      {...props}
    />
  ),
}));

// Mock the utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  generateAvatarFallback: (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  },
}));

describe('Avatar Component', () => {
  describe('Rendering', () => {
    it('renders with image when src is provided', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="User" />);
      expect(screen.getByTestId('avatar-image')).toBeInTheDocument();
    });

    it('renders fallback when no src is provided', () => {
      render(<Avatar alt="John Doe" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      render(<Avatar alt="User" fallback="AB" />);
      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('uses default alt text', () => {
      render(<Avatar src="https://example.com/avatar.jpg" />);
      const image = screen.getByTestId('avatar-image');
      expect(image).toHaveAttribute('alt', 'Avatar');
    });
  });

  describe('Sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

    sizes.forEach((size) => {
      it(`renders correctly with size ${size}`, () => {
        render(<Avatar alt="Test" size={size} fallback="TS" />);
        expect(screen.getByText('TS')).toBeInTheDocument();
      });
    });
  });

  describe('Status Indicator', () => {
    it('shows status indicator when showStatus is true', () => {
      const { container } = render(
        <Avatar alt="User" status="online" showStatus />
      );
      const statusIndicator = container.querySelector('.bg-success');
      expect(statusIndicator).toBeInTheDocument();
    });

    it('does not show status when showStatus is false', () => {
      const { container } = render(
        <Avatar alt="User" status="online" showStatus={false} />
      );
      const statusIndicator = container.querySelector('.bg-success');
      expect(statusIndicator).not.toBeInTheDocument();
    });

    it('does not show status when status is not provided', () => {
      const { container } = render(<Avatar alt="User" showStatus />);
      const statusIndicator = container.querySelector('.bg-success, .bg-text-dim, .bg-warning, .bg-error');
      expect(statusIndicator).not.toBeInTheDocument();
    });

    it('renders online status with correct color', () => {
      const { container } = render(
        <Avatar alt="User" status="online" showStatus />
      );
      expect(container.querySelector('.bg-success')).toBeInTheDocument();
    });

    it('renders offline status with correct color', () => {
      const { container } = render(
        <Avatar alt="User" status="offline" showStatus />
      );
      expect(container.querySelector('.bg-text-dim')).toBeInTheDocument();
    });

    it('renders away status with correct color', () => {
      const { container } = render(
        <Avatar alt="User" status="away" showStatus />
      );
      expect(container.querySelector('.bg-warning')).toBeInTheDocument();
    });

    it('renders dnd status with correct color', () => {
      const { container } = render(
        <Avatar alt="User" status="dnd" showStatus />
      );
      expect(container.querySelector('.bg-error')).toBeInTheDocument();
    });
  });

  describe('Image Error Handling', () => {
    it('shows fallback when image fails to load', () => {
      render(
        <Avatar src="https://invalid-url.com/image.jpg" alt="John Doe" />
      );

      const image = screen.getByTestId('avatar-image');
      fireEvent.error(image);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Fallback Generation', () => {
    it('generates initials from single name', () => {
      render(<Avatar alt="John" />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('generates initials from two names', () => {
      render(<Avatar alt="John Doe" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('uses first two initials for multiple names', () => {
      render(<Avatar alt="John Michael Doe" />);
      expect(screen.getByText('JM')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('supports custom className', () => {
      const { container } = render(
        <Avatar alt="Test" className="custom-avatar" fallback="T" />
      );
      expect(container.firstChild).toHaveClass('custom-avatar');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Avatar ref={ref} alt="Test" fallback="T" />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Accessibility', () => {
    it('has alt text on image', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="User Avatar" />);
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('alt', 'User Avatar');
    });

    it('uses aria attributes when passed', () => {
      render(
        <Avatar
          alt="User"
          fallback="U"
          aria-label="User profile picture"
        />
      );
      expect(screen.getByLabelText('User profile picture')).toBeInTheDocument();
    });
  });
});
