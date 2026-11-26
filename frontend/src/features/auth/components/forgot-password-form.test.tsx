import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "./forgot-password-form";

const mockForgotPassword = jest.fn();

jest.mock("../api", () => ({
  authApi: {
    forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
  },
}));

jest.mock("@tanstack/react-query", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    useMutation: (options: {
      mutationFn: (values: unknown) => Promise<{ message: string }>;
      onError: (error: unknown) => void;
    }) => {
      const [state, setState] = React.useState<{
        isSuccess: boolean;
        isPending: boolean;
        data: { message: string } | undefined;
      }>({
        isSuccess: false,
        isPending: false,
        data: undefined,
      });

      return {
        ...state,
        mutate: async (values: unknown) => {
          try {
            const result = await options.mutationFn(values);
            setState({
              isSuccess: true,
              isPending: false,
              data: result,
            });
          } catch (error) {
            options.onError(error);
          }
        },
      };
    },
  };
});

jest.mock("@/components/shared/turnstile", () => ({
  useCaptcha: () => ({
    token: "test-captcha-token",
    setToken: jest.fn(),
    reset: jest.fn(),
    widgetKey: "test",
  }),
  Turnstile: () => <div>Security check</div>,
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockForgotPassword.mockResolvedValue({
      message: "If your email is registered, a reset link will be sent.",
    });
  });

  test("renders the password reset form", () => {
    render(<ForgotPasswordForm />);

    expect(
      screen.getByRole("heading", { name: /reset your password/i }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /send reset link/i }),
    ).toBeInTheDocument();
  });

  test("displays a link back to sign in", () => {
    render(<ForgotPasswordForm />);

    expect(
      screen.getByRole("link", { name: /back to sign in/i }),
    ).toHaveAttribute("href", "/sign-in");
  });

  test("does not submit an invalid email address", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "invalid-email",
    );

    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  test("submits a valid email address with the CAPTCHA token", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "john@example.com",
    );

    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({
        email: "john@example.com",
        captchaToken: "test-captcha-token",
      });
    });
  });

  test("shows confirmation after a successful reset request", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordForm />);

    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "john@example.com",
    );

    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(
      await screen.findByRole("heading", { name: /check your inbox/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /back to sign in/i }),
    ).toHaveAttribute("href", "/sign-in");
  });
});