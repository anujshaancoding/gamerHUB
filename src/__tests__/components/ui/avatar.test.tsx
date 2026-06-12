import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from '@/components/ui/avatar';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError, fill, unoptimized, ...props }: any) => (
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

// Mock storage normalizeImageUrl (passes src through unchanged)
jest.mock('@/lib/services/storage', () => ({
  normalizeImageUrl: (src: string | null) => src ?? null,
}));

// Status colors are hardcoded inline hex (theme-independent) — see avatar.tsx.
// jsdom serializes inline colors as rgb(), so match on the element's
// computed style.backgroundColor (set from the hex by the browser/jsdom).
const STATUS_RGB = {
  online: 'rgb(0, 255, 136)', // #00ff88
  away: 'rgb(255, 170, 0)',   // #ffaa00
  dnd: 'rgb(255, 68, 68)',    // #ff4444
  offline: 'rgb(90, 90, 106)',// #5a5a6a
};

/** Find the status indicator span by its inline background color. */
function getStatusDot(container: HTMLElement, rgb: string) {
  return Array.from(container.querySelectorAll('span')).find(
    (el) => (el as HTMLElement).style.backgroundColor === rgb
  );
}

describe('Avatar Component', () => {
  describe('Rendering', () => {
    it('renders with image when src is provided', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="User" />);
      // The src image is rendered (first avatar-image)
      expect(screen.getAllByTestId('avatar-image')[0]).toHaveAttribute(
        'src',
        'https://example.com/avatar.jpg'
      );
    });

    it('renders the default avatar SVG when no src and no fallback prop', () => {
      // Current behavior: with no src and no fallback prop, the component
      // renders the default avatar SVG image (NOT generated initials).
      render(<Avatar alt="John Doe" />);
      const img = screen.getByTestId('avatar-image');
      expect(img).toHaveAttribute('src', '/images/defaults/avatar.svg');
    });

    it('renders custom fallback text when provided and no src', () => {
      render(<Avatar alt="User" fallback="AB" />);
      expect(screen.getByText('AB')).toBeInTheDocument();
    });

    it('uses default alt text', () => {
      render(<Avatar src="https://example.com/avatar.jpg" />);
      const image = screen.getAllByTestId('avatar-image')[0];
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
      expect(getStatusDot(container, STATUS_RGB.online)).toBeTruthy();
    });

    it('does not show status when showStatus is false', () => {
      const { container } = render(
        <Avatar alt="User" status="online" showStatus={false} />
      );
      expect(getStatusDot(container, STATUS_RGB.online)).toBeFalsy();
    });

    it('does not show status when status is not provided', () => {
      const { container } = render(<Avatar alt="User" showStatus />);
      const anyStatus = Object.values(STATUS_RGB).some((hex) =>
        getStatusDot(container, hex)
      );
      expect(anyStatus).toBe(false);
    });

    it('renders online status with correct color', () => {
      const { container } = render(
        <Avatar alt="User" status="online" showStatus />
      );
      expect(getStatusDot(container, STATUS_RGB.online)).toBeTruthy();
    });

    it('renders offline status with correct color', () => {
      const { container } = render(
        <Avatar alt="User" status="offline" showStatus />
      );
      expect(getStatusDot(container, STATUS_RGB.offline)).toBeTruthy();
    });

    it('renders away status with correct color', () => {
      const { container } = render(
        <Avatar alt="User" status="away" showStatus />
      );
      expect(getStatusDot(container, STATUS_RGB.away)).toBeTruthy();
    });

    it('renders dnd status with correct color', () => {
      const { container } = render(
        <Avatar alt="User" status="dnd" showStatus />
      );
      expect(getStatusDot(container, STATUS_RGB.dnd)).toBeTruthy();
    });
  });

  describe('Image Error Handling', () => {
    it('falls back to default avatar SVG when src image fails to load', () => {
      // With a src but no fallback prop, an error swaps to the default SVG.
      render(<Avatar src="https://invalid-url.com/image.jpg" alt="John Doe" />);

      const image = screen.getByTestId('avatar-image');
      fireEvent.error(image);

      expect(screen.getByTestId('avatar-image')).toHaveAttribute(
        'src',
        '/images/defaults/avatar.svg'
      );
    });

    it('falls back to custom fallback text on image error when fallback provided', () => {
      render(
        <Avatar src="https://invalid-url.com/image.jpg" alt="John Doe" fallback="JD" />
      );

      const image = screen.getByTestId('avatar-image');
      fireEvent.error(image);

      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  describe('Fallback Text', () => {
    it('renders provided fallback for single name initial', () => {
      render(<Avatar alt="John" fallback="J" />);
      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('renders provided fallback for two-name initials', () => {
      render(<Avatar alt="John Doe" fallback="JD" />);
      expect(screen.getByText('JD')).toBeInTheDocument();
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
      expect(screen.getAllByTestId('avatar-image')[0]).toHaveAttribute(
        'alt',
        'User Avatar'
      );
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
