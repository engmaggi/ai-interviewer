import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerifyEmailPanel } from "./verify-email-panel";

const mockResend = jest.fn();

jest.mock("../api", () => ({
  authApi: {
    resendVerification: (...args: unknown[]) => mockResend(...args),
  },
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: {
    mutationFn: (values: unknown) => Promise<unknown>;
    onSuccess: () => void;
    onError: (error: unknown) => void;
    onSettled: () => void;
  }) => ({
    mutate: async (values: unknown) => {
      try {
        await options.mutationFn(values);
        options.onSuccess();
      } catch (error) {
        options.onError(error);
      } finally {
        options.onSettled();
      }
    },
    isPending: false,
  }),
}));

jest.mock("@/components/shared/turnstile", () => ({
  useCaptcha: () => ({
    token: "test-captcha-token",
    setToken: jest.fn(),
    reset: jest.fn(),
    widgetKey: "test",
  }),
  Turnstile: () => <div>Security check</div>,
}));

describe("VerifyEmailPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResend.mockResolvedValue({ message: "Success" });
  });

  test("displays the pending verification message", () => {
    render(<VerifyEmailPanel />);

    expect(
      screen.getByRole("heading", { name: /check your inbox/i }),
    ).toBeInTheDocument();
  });

  test("displays the supplied email address", () => {
    render(<VerifyEmailPanel email="john@example.com" />);

    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  test("displays the resend and change email options", () => {
    render(<VerifyEmailPanel email="john@example.com" />);

    expect(
      screen.getByRole("button", { name: /resend verification email/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /change email address/i }),
    ).toHaveAttribute("href", "/register");
  });

  test("displays the expired link message", () => {
    render(<VerifyEmailPanel status="expired" />);

    expect(
      screen.getByRole("heading", { name: /link expired/i }),
    ).toBeInTheDocument();
  });

  test("requests a new verification email", async () => {
    const user = userEvent.setup();

    render(<VerifyEmailPanel email="john@example.com" />);

    await user.click(
      screen.getByRole("button", { name: /resend verification email/i }),
    );

    expect(mockResend).toHaveBeenCalledWith({
      email: "john@example.com",
      captchaToken: "test-captcha-token",
    });

    expect(
      await screen.findByText(/a new verification link is on its way/i),
    ).toBeInTheDocument();
  });
});