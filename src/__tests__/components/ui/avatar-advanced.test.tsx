/**
 * Avatar Component Advanced Tests
 *
 * Tests rendering, fallback behavior, frame styles, status indicators,
 * and image error handling — asserting the CURRENT component behavior:
 *  - status colors are hardcoded inline hex (theme-independent)
 *  - with no src and no `fallback` prop, the default avatar SVG renders
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from '@/components/ui/avatar';

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError, fill, unoptimized, ...props }: {
    src: string;
    alt: string;
    onError?: () => void;
    fill?: boolean;
    unoptimized?: boolean;
    className?: string;
  }) {
    return (
      <img
        src={src}
        alt={alt}
        data-testid="avatar-image"
        data-fill={fill ? "true" : undefined}
        onError={onError}
        {...props}
      />
    );
  };
});

jest.mock('@/lib/storage', () => ({
  normalizeImageUrl: (src: string | null) => src ?? null,
}));

const DEFAULT_SVG = '/images/defaults/avatar.svg';
// jsdom serializes inline hex colors to rgb(); match on computed backgroundColor.
const STATUS_RGB = {
  online: 'rgb(0, 255, 136)', // #00ff88
  away: 'rgb(255, 170, 0)',   // #ffaa00
  dnd: 'rgb(255, 68, 68)',    // #ff4444
  offline: 'rgb(90, 90, 106)',// #5a5a6a
};

function getStatusDot(container: HTMLElement, rgb: string) {
  return Array.from(container.querySelectorAll('span')).find(
    (el) => (el as HTMLElement).style.backgroundColor === rgb
  );
}

/** The user-provided src image (i.e. not the default avatar SVG). */
function getUserImage() {
  return screen
    .queryAllByTestId('avatar-image')
    .find((img) => img.getAttribute('src') !== DEFAULT_SVG);
}

describe('Avatar Component', () => {
  describe('Rendering', () => {
    it('renders with image when src is provided', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="User" />);
      expect(getUserImage()).toBeTruthy();
    });

    it('renders default avatar SVG when no src is provided', () => {
      render(<Avatar alt="John Doe" />);
      expect(getUserImage()).toBeUndefined();
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', DEFAULT_SVG);
    });

    it('renders default avatar SVG when src is null', () => {
      render(<Avatar src={null} alt="Test User" />);
      expect(getUserImage()).toBeUndefined();
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', DEFAULT_SVG);
    });

    it('renders with custom alt text', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="Custom Alt" />);
      expect(getUserImage()).toHaveAttribute('alt', 'Custom Alt');
    });
  });

  describe('Sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const;

    it.each(sizes)('renders with size %s', (size) => {
      const { container } = render(<Avatar size={size} alt="Test" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('defaults to md size', () => {
      const { container } = render(<Avatar alt="Test" />);
      const inner = container.querySelector('.h-10');
      expect(inner).toBeInTheDocument();
    });
  });

  describe('Image Error Handling', () => {
    it('falls back to default avatar SVG on image load error (no fallback prop)', () => {
      render(<Avatar src="https://example.com/broken.jpg" alt="Test User" />);

      const img = getUserImage()!;
      fireEvent.error(img);

      // After error, the user image is gone and the default SVG is shown.
      expect(getUserImage()).toBeUndefined();
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', DEFAULT_SVG);
    });
  });

  describe('Status Indicator', () => {
    it('shows online status when showStatus is true', () => {
      const { container } = render(
        <Avatar alt="Test" showStatus status="online" />
      );
      expect(getStatusDot(container, STATUS_RGB.online)).toBeTruthy();
    });

    it('shows offline status', () => {
      const { container } = render(
        <Avatar alt="Test" showStatus status="offline" />
      );
      expect(getStatusDot(container, STATUS_RGB.offline)).toBeTruthy();
    });

    it('shows away status', () => {
      const { container } = render(
        <Avatar alt="Test" showStatus status="away" />
      );
      expect(getStatusDot(container, STATUS_RGB.away)).toBeTruthy();
    });

    it('shows dnd status', () => {
      const { container } = render(
        <Avatar alt="Test" showStatus status="dnd" />
      );
      expect(getStatusDot(container, STATUS_RGB.dnd)).toBeTruthy();
    });

    it('does not show status when showStatus is false', () => {
      const { container } = render(
        <Avatar alt="Test" status="online" showStatus={false} />
      );
      expect(getStatusDot(container, STATUS_RGB.online)).toBeFalsy();
    });

    it('does not show status when status is undefined', () => {
      const { container } = render(<Avatar alt="Test" showStatus />);
      const anyStatus = Object.values(STATUS_RGB).some((hex) =>
        getStatusDot(container, hex)
      );
      expect(anyStatus).toBe(false);
    });
  });

  describe('Frame Styles', () => {
    it('renders without frame by default', () => {
      const { container } = render(<Avatar alt="Test" />);
      const framedEl = container.querySelector('.ring-2');
      expect(framedEl).not.toBeInTheDocument();
    });

    it('renders with default frame', () => {
      const { container } = render(<Avatar alt="Test" frameStyle="default" />);
      const framedEl = container.querySelector('.ring-2');
      expect(framedEl).toBeInTheDocument();
    });

    it('renders with epic frame', () => {
      const { container } = render(<Avatar alt="Test" frameStyle="epic" />);
      const framedEl = container.querySelector('.ring-4');
      expect(framedEl).toBeInTheDocument();
    });

    it('renders with rgb frame animation wrapper', () => {
      const { container } = render(<Avatar alt="Test" frameStyle="rgb" />);
      const rgbWrapper = container.querySelector('.avatar-rgb-wrapper');
      expect(rgbWrapper).toBeInTheDocument();
    });

    it('renders with mythic frame gradient', () => {
      const { container } = render(<Avatar alt="Test" frameStyle="mythic" />);
      const gradient = container.querySelector('.animate-gradient-xy');
      expect(gradient).toBeInTheDocument();
    });
  });

  describe('Glow Effect', () => {
    it('applies glow color when provided', () => {
      const { container } = render(<Avatar alt="Test" glowColor="#ff00ff" />);
      const inner = container.querySelector('.overflow-hidden');
      expect(inner).toBeInTheDocument();
      expect(inner?.getAttribute('style')).toContain('box-shadow');
    });

    it('does not apply glow when not provided', () => {
      const { container } = render(<Avatar alt="Test" />);
      const inner = container.querySelector('.overflow-hidden');
      expect(inner?.getAttribute('style')).toBeNull();
    });
  });

  describe('Fallback Text', () => {
    it('renders default SVG (not initials) from alt text when no fallback prop', () => {
      render(<Avatar alt="John Doe" />);
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', DEFAULT_SVG);
    });

    it('uses custom fallback when provided', () => {
      const { container } = render(<Avatar alt="Test" fallback="XY" />);
      expect(container.textContent).toContain('XY');
    });
  });

  describe('Accessibility', () => {
    it('should have correct alt text for the user image', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="User Avatar" />);
      expect(getUserImage()).toHaveAttribute('alt', 'User Avatar');
    });

    it('should be keyboard focusable when clickable', () => {
      const { container } = render(
        <Avatar alt="Test" onClick={() => {}} tabIndex={0} />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveAttribute('tabindex', '0');
    });
  });
});
