import { render, screen, fireEvent } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

describe('Card Component', () => {
  describe('Card', () => {
    describe('Rendering', () => {
      it('renders children correctly', () => {
        render(<Card>Card Content</Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
      });

      it('renders with default variant', () => {
        render(<Card>Default Card</Card>);
        // The Card element contains the text directly
        const card = screen.getByText('Default Card');
        expect(card).toHaveClass('rounded-xl', 'p-6');
      });
    });

    describe('Variants', () => {
      it('renders default variant correctly', () => {
        render(<Card variant="default">Default</Card>);
        expect(screen.getByText('Default')).toHaveClass('bg-surface', 'border-border');
      });

      it('renders elevated variant correctly', () => {
        render(<Card variant="elevated">Elevated</Card>);
        expect(screen.getByText('Elevated')).toHaveClass('bg-surface-light', 'shadow-lg');
      });

      it('renders outlined variant correctly', () => {
        render(<Card variant="outlined">Outlined</Card>);
        expect(screen.getByText('Outlined')).toHaveClass('bg-transparent', 'border-border');
      });

      it('renders interactive variant correctly', () => {
        render(<Card variant="interactive">Interactive</Card>);
        expect(screen.getByText('Interactive')).toHaveClass('card-hover', 'cursor-pointer');
      });
    });

    describe('Styling', () => {
      it('has rounded corners', () => {
        render(<Card>Rounded</Card>);
        expect(screen.getByText('Rounded')).toHaveClass('rounded-xl');
      });

      it('has padding', () => {
        render(<Card>Padded</Card>);
        expect(screen.getByText('Padded')).toHaveClass('p-6');
      });

      it('supports custom className', () => {
        render(<Card className="custom-card">Custom</Card>);
        expect(screen.getByText('Custom')).toHaveClass('custom-card');
      });
    });

    describe('Interactivity', () => {
      it('handles click events on interactive variant', () => {
        const handleClick = jest.fn();
        render(
          <Card variant="interactive" onClick={handleClick}>
            Clickable
          </Card>
        );
        fireEvent.click(screen.getByText('Clickable'));
        expect(handleClick).toHaveBeenCalled();
      });
    });

    describe('Ref Forwarding', () => {
      it('forwards ref correctly', () => {
        const ref = { current: null };
        render(<Card ref={ref}>Ref Card</Card>);
        expect(ref.current).toBeInstanceOf(HTMLDivElement);
      });
    });
  });

  describe('CardHeader', () => {
    it('renders children correctly', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('has flex column layout', () => {
      render(<CardHeader>Header</CardHeader>);
      expect(screen.getByText('Header')).toHaveClass('flex', 'flex-col');
    });

    it('supports custom className', () => {
      render(<CardHeader className="custom-header">Header</CardHeader>);
      expect(screen.getByText('Header')).toHaveClass('custom-header');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('renders children correctly', () => {
      render(<CardTitle>Card Title</CardTitle>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('has correct styling', () => {
      render(<CardTitle>Styled Title</CardTitle>);
      const title = screen.getByText('Styled Title');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-text');
    });

    it('supports custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      expect(screen.getByText('Title')).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('CardDescription', () => {
    it('renders as p element', () => {
      render(<CardDescription>Description</CardDescription>);
      const desc = screen.getByText('Description');
      expect(desc.tagName).toBe('P');
    });

    it('renders children correctly', () => {
      render(<CardDescription>Card Description</CardDescription>);
      expect(screen.getByText('Card Description')).toBeInTheDocument();
    });

    it('has correct styling', () => {
      render(<CardDescription>Styled Description</CardDescription>);
      const desc = screen.getByText('Styled Description');
      expect(desc).toHaveClass('text-sm', 'text-text-muted');
    });

    it('supports custom className', () => {
      render(<CardDescription className="custom-desc">Description</CardDescription>);
      expect(screen.getByText('Description')).toHaveClass('custom-desc');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardDescription ref={ref}>Description</CardDescription>);
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent', () => {
    it('renders children correctly', () => {
      render(<CardContent>Content Area</CardContent>);
      expect(screen.getByText('Content Area')).toBeInTheDocument();
    });

    it('has top padding', () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText('Content')).toHaveClass('pt-4');
    });

    it('supports custom className', () => {
      render(<CardContent className="custom-content">Content</CardContent>);
      expect(screen.getByText('Content')).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter', () => {
    it('renders children correctly', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('has flex layout', () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText('Footer')).toHaveClass('flex', 'items-center');
    });

    it('has top padding', () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText('Footer')).toHaveClass('pt-4');
    });

    it('supports custom className', () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>);
      expect(screen.getByText('Footer')).toHaveClass('custom-footer');
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Complete Card Composition', () => {
    it('renders a complete card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument();
      expect(screen.getByText('This is a test card description')).toBeInTheDocument();
      expect(screen.getByText('Main content goes here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('renders interactive card with complex content', () => {
      const handleClick = jest.fn();

      render(
        <Card variant="interactive" onClick={handleClick}>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div data-testid="complex-content">
              <span>Item 1</span>
              <span>Item 2</span>
            </div>
          </CardContent>
        </Card>
      );

      expect(screen.getByText('Interactive Card')).toBeInTheDocument();
      expect(screen.getByTestId('complex-content')).toBeInTheDocument();
    });
  });
});
