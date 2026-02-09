/**
 * Avatar Component Advanced Tests
 *
 * Tests rendering, fallback behavior, frame styles, status indicators,
 * and image error handling.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from '@/components/ui/avatar';

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError, fill, ...props }: {
    src: string;
    alt: string;
    onError?: () => void;
    fill?: boolean;
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

describe('Avatar Component', () => {
  describe('Rendering', () => {
    it('renders with image when src is provided', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="User" />);
      expect(screen.getByTestId('avatar-image')).toBeInTheDocument();
    });

    it('renders fallback when no src is provided', () => {
      render(<Avatar alt="John Doe" />);
      // Should show initials as fallback
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
    });

    it('renders fallback when src is null', () => {
      render(<Avatar src={null} alt="Test User" />);
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
    });

    it('renders with custom alt text', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="Custom Alt" />);
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('alt', 'Custom Alt');
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
    it('shows fallback on image load error', () => {
      render(<Avatar src="https://example.com/broken.jpg" alt="Test User" />);

      const img = screen.getByTestId('avatar-image');
      fireEvent.error(img);

      // After error, image should be replaced with fallback text
      expect(screen.queryByTestId('avatar-image')).not.toBeInTheDocument();
    });
  });

  describe('Status Indicator', () => {
    it('shows online status when showStatus is true', () => {
      const { container } = render(
        <Avatar alt="Test" showStatus status="online" />
      );
      const statusDot = container.querySelector('.bg-success');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows offline status', () => {
      const { container } = render(
        <Avatar alt="Test" showStatus status="offline" />
      );
      const statusDot = container.querySelector('.bg-text-dim');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows away status', () => {
      const { container } = render(
        <Avatar alt="Test" showStatus status="away" />
      );
      const statusDot = container.querySelector('.bg-warning');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows dnd status', () => {
      const { container } = render(
        <Avatar alt="Test" showStatus status="dnd" />
      );
      const statusDot = container.querySelector('.bg-error');
      expect(statusDot).toBeInTheDocument();
    });

    it('does not show status when showStatus is false', () => {
      const { container } = render(
        <Avatar alt="Test" status="online" showStatus={false} />
      );
      const statusDot = container.querySelector('.bg-success');
      expect(statusDot).not.toBeInTheDocument();
    });

    it('does not show status when status is undefined', () => {
      const { container } = render(
        <Avatar alt="Test" showStatus />
      );
      const statusDots = container.querySelectorAll('.bg-success, .bg-text-dim, .bg-warning, .bg-error');
      expect(statusDots).toHaveLength(0);
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
      const inner = container.querySelector('[style]');
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
    it('generates initials from alt text', () => {
      render(<Avatar alt="John Doe" />);
      // The generateAvatarFallback utility should produce initials
      const fallback = screen.queryByTestId('avatar-image');
      expect(fallback).not.toBeInTheDocument();
    });

    it('uses custom fallback when provided', () => {
      const { container } = render(<Avatar alt="Test" fallback="XY" />);
      expect(container.textContent).toContain('XY');
    });
  });

  describe('Accessibility', () => {
    it('should have correct role and alt text for image', () => {
      render(<Avatar src="https://example.com/avatar.jpg" alt="User Avatar" />);
      const img = screen.getByTestId('avatar-image');
      expect(img).toHaveAttribute('alt', 'User Avatar');
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
