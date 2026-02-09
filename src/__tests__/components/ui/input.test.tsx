import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';
import { Search, Eye } from 'lucide-react';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Email" placeholder="Enter email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('renders with correct input type', () => {
      render(<Input type="password" placeholder="Password" />);
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
    });

    it('renders with different types', () => {
      const types = ['text', 'email', 'password', 'number', 'tel'] as const;

      types.forEach((type) => {
        const { unmount } = render(<Input type={type} placeholder={type} />);
        expect(screen.getByPlaceholderText(type)).toHaveAttribute('type', type);
        unmount();
      });
    });
  });

  describe('Icons', () => {
    it('renders with left icon', () => {
      render(
        <Input
          leftIcon={<Search data-testid="left-icon" />}
          placeholder="Search"
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders with right icon', () => {
      render(
        <Input
          rightIcon={<Eye data-testid="right-icon" />}
          placeholder="Password"
        />
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('applies correct padding when left icon is present', () => {
      render(
        <Input
          leftIcon={<Search data-testid="icon" />}
          placeholder="Search"
        />
      );
      expect(screen.getByPlaceholderText('Search')).toHaveClass('pl-10');
    });

    it('applies correct padding when right icon is present', () => {
      render(
        <Input
          rightIcon={<Eye data-testid="icon" />}
          placeholder="Password"
        />
      );
      expect(screen.getByPlaceholderText('Password')).toHaveClass('pr-10');
    });
  });

  describe('Error State', () => {
    it('displays error message', () => {
      render(<Input error="This field is required" placeholder="Input" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styles to input', () => {
      render(<Input error="Error" placeholder="Input" />);
      expect(screen.getByPlaceholderText('Input')).toHaveClass('border-error');
    });

    it('has correct error text styling', () => {
      render(<Input error="Error message" placeholder="Input" />);
      const errorText = screen.getByText('Error message');
      expect(errorText).toHaveClass('text-error');
    });
  });

  describe('User Input', () => {
    it('updates value on user input', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);

      const input = screen.getByPlaceholderText('Type here');
      await user.type(input, 'Hello World');

      expect(input).toHaveValue('Hello World');
    });

    it('calls onChange handler', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input placeholder="Input" onChange={handleChange} />);

      await user.type(screen.getByPlaceholderText('Input'), 'a');
      expect(handleChange).toHaveBeenCalled();
    });

    it('supports controlled input', () => {
      const handleChange = jest.fn();
      render(
        <Input
          value="controlled value"
          onChange={handleChange}
          placeholder="Controlled"
        />
      );

      expect(screen.getByPlaceholderText('Controlled')).toHaveValue('controlled value');
    });
  });

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Input disabled placeholder="Disabled" />);
      expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
    });

    it('has correct disabled styles', () => {
      render(<Input disabled placeholder="Disabled" />);
      const input = screen.getByPlaceholderText('Disabled');
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('does not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled placeholder="Disabled" />);

      const input = screen.getByPlaceholderText('Disabled');
      await user.type(input, 'test');

      expect(input).toHaveValue('');
    });
  });

  describe('Focus Behavior', () => {
    it('applies focus styles on focus', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Focus me" />);

      const input = screen.getByPlaceholderText('Focus me');
      await user.click(input);

      expect(input).toHaveFocus();
    });

    it('can be focused programmatically', () => {
      render(<Input placeholder="Focus me" />);
      const input = screen.getByPlaceholderText('Focus me');

      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<Input placeholder="Input" />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<Input aria-label="Search input" placeholder="Search" />);
      expect(screen.getByLabelText('Search input')).toBeInTheDocument();
    });

    it('associates label with input', () => {
      render(<Input label="Username" placeholder="Enter username" />);
      // Label should be visible
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('supports aria-describedby for error messages', () => {
      render(<Input error="Required field" aria-describedby="error-msg" placeholder="Input" />);
      expect(screen.getByText('Required field')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(<Input ref={ref} placeholder="Ref Input" />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Custom Props', () => {
    it('supports custom className', () => {
      render(<Input className="custom-class" placeholder="Custom" />);
      expect(screen.getByPlaceholderText('Custom')).toHaveClass('custom-class');
    });

    it('supports additional HTML attributes', () => {
      render(
        <Input
          placeholder="Test"
          maxLength={50}
          minLength={5}
          required
          autoComplete="email"
        />
      );

      const input = screen.getByPlaceholderText('Test');
      expect(input).toHaveAttribute('maxLength', '50');
      expect(input).toHaveAttribute('minLength', '5');
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('autoComplete', 'email');
    });
  });
});
