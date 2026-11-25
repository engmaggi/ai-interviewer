import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "./sign-in-form";

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockLogin = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

jest.mock("../api", () => ({
  authApi: {
    login: (...args: unknown[]) => mockLogin(...args),
  },
  verifyEmailPath: (email: string) =>
    `/verify-email?email=${encodeURIComponent(email)}`,
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: {
    mutationFn: (values: unknown) => Promise<unknown>;
    onSuccess: () => void;
    onError: (error: unknown, variables: { email: string }) => void;
  }) => ({
    mutate: async (values: unknown) => {
      try {
        await options.mutationFn(values);
        options.onSuccess();
      } catch (error) {
        options.onError(error, values as { email: string });
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

describe("SignInForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({});
  });

  test("renders the sign-in form", () => {
    render(<SignInForm />);

    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  test("displays the forgot password and create account links", () => {
    render(<SignInForm />);

    expect(screen.getByRole("link", { name: /forgot password/i }))
      .toHaveAttribute("href", "/forgot-password");

    expect(screen.getByRole("link", { name: /create an account/i }))
      .toHaveAttribute("href", "/register");
  });

  test("does not submit invalid sign-in details", async () => {
    const user = userEvent.setup();

    render(<SignInForm />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test("submits valid details and redirects to the overview page", async () => {
    const user = userEvent.setup();

    render(<SignInForm />);

    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "john@example.com",
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "password123",
    );

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        captchaToken: "test-captcha-token",
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/overview");
    expect(mockRefresh).toHaveBeenCalled();
  });
});