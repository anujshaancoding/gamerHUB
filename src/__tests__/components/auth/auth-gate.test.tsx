import { render, screen, fireEvent, act } from "@testing-library/react";
import { AuthGateModal } from "@/components/auth/auth-gate-modal";
import {
  AuthGateProvider,
  useActionGate,
} from "@/components/auth/auth-gate-provider";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/find-gamers",
}));

// Capture trackCtaClick calls without hitting the network.
const trackMock = jest.fn();
jest.mock("@/lib/analytics/cta-click", () => ({
  trackCtaClick: (...args: unknown[]) => trackMock(...args),
}));

describe("AuthGateModal — contextual reason", () => {
  beforeEach(() => {
    pushMock.mockClear();
    trackMock.mockClear();
  });

  it("renders the generic headline when no reason is passed", () => {
    render(<AuthGateModal isOpen onClose={() => {}} />);
    expect(screen.getByText("Join the Gaming Community")).toBeInTheDocument();
  });

  it("renders the action-specific reason as the heading", () => {
    render(
      <AuthGateModal isOpen onClose={() => {}} reason="Sign up to apply to this lobby" />
    );
    expect(
      screen.getByText("Sign up to apply to this lobby")
    ).toBeInTheDocument();
  });

  it("fires trackCtaClick with the surface source and routes to /register on Create Account", () => {
    render(
      <AuthGateModal
        isOpen
        onClose={() => {}}
        reason="Sign up to apply to this lobby"
        source="lfg_apply"
        redirectTo="/find-gamers"
      />
    );
    fireEvent.click(screen.getByText("Create Account"));
    expect(trackMock).toHaveBeenCalledWith("lfg_apply");
    expect(pushMock).toHaveBeenCalledWith(
      "/register?redirect=%2Ffind-gamers"
    );
  });

  it("does not render when closed", () => {
    render(<AuthGateModal isOpen={false} onClose={() => {}} reason="Hidden" />);
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});

describe("useActionGate — imperative gate", () => {
  beforeEach(() => {
    pushMock.mockClear();
    trackMock.mockClear();
  });

  function Trigger() {
    const { openAuthGate } = useActionGate();
    return (
      <button
        onClick={() =>
          openAuthGate({
            reason: "Sign up to add this gamer as a friend",
            source: "add_friend",
          })
        }
      >
        Add friend
      </button>
    );
  }

  it("opens the contextual modal when an action triggers the gate", () => {
    render(
      <AuthGateProvider>
        <Trigger />
      </AuthGateProvider>
    );

    // Closed by default — generic copy not visible.
    expect(
      screen.queryByText("Sign up to add this gamer as a friend")
    ).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText("Add friend"));
    });

    expect(
      screen.getByText("Sign up to add this gamer as a friend")
    ).toBeInTheDocument();
  });

  it("provides a no-op fallback when used outside the provider", () => {
    // Should not throw when rendered without AuthGateProvider.
    expect(() => render(<Trigger />)).not.toThrow();
    act(() => {
      fireEvent.click(screen.getByText("Add friend"));
    });
    // No modal mounts because there is no provider.
    expect(
      screen.queryByText("Sign up to add this gamer as a friend")
    ).not.toBeInTheDocument();
  });
});
