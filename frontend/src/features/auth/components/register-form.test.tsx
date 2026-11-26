import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./register-form";
import { ApiError } from "@/lib/api/client";

const mockPush = jest.fn();
const mockRegister = jest.fn();
const mockReset = jest.fn();
const mockSetToken = jest.fn();
let mockCaptchaToken: string | null = "test-captcha-token";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../api", () => ({
  authApi: {
    register: (...args: unknown[]) => mockRegister(...args),
  },
  verifyEmailPath: (email: string) =>
    `/verify-email?email=${encodeURIComponent(email)}`,
}));

jest.mock("@/features/developer-roles/api", () => ({
  developerRolesQueryOptions: {},
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: [
      { code: "frontend_developer", label: "Frontend Developer" },
    ],
    isPending: false,
    isError: false,
  }),
  useMutation: (options: {
    mutationFn: (values: unknown) => Promise<unknown>;
    onSuccess: (data: unknown, variables: { email: string }) => void;
    onError: (error: unknown) => void;
  }) => ({
    mutate: async (values: unknown) => {
      try {
        const result = await options.mutationFn(values);
        options.onSuccess(result, values as { email: string });
      } catch (error) {
        options.onError(error);
      }
    },
    isPending: false,
  }),
}));

jest.mock("@/components/shared/turnstile", () => ({
  useCaptcha: () => ({
    token: mockCaptchaToken,
    setToken: mockSetToken,
    reset: mockReset,
    widgetKey: "test",
  }),
  Turnstile: () => <div>Security check</div>,
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCaptchaToken = "test-captcha-token";
    mockRegister.mockResolvedValue({ message: "Success" });
  });

  test("renders the registration form", () => {
    render(<RegisterForm />);

    expect(
      screen.getByRole("heading", { name: /create your orbit account/i }),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Create a password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  test("shows the developer role and experience level options", () => {
    render(<RegisterForm />);

    expect(screen.getByRole("combobox", { name: /developer role/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Junior" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Mid" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Senior" })).toBeInTheDocument();
  });

  test("does not submit invalid registration details", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  test("submits valid registration details", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Your name"), "John Doe");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /developer role/i }),
      "frontend_developer",
    );
    await user.click(screen.getByRole("radio", { name: "Junior" }));
    await user.type(screen.getByPlaceholderText("0"), "2");
    await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Create a password"), "password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        displayName: "John Doe",
        developerRole: "frontend_developer",
        targetSeniority: "junior",
        yearsOfExperience: 2,
        email: "john@example.com",
        password: "password123",
        captchaToken: "test-captcha-token",
      });
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/verify-email?email=john%40example.com",
    );
  });
  test("displays an error when the server rejects registration", async () => {
    const user = userEvent.setup();

    mockRegister.mockRejectedValue(
      new ApiError(400, "EMAIL_EXISTS", "This email is already registered."),
    );

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Your name"), "John Doe");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /developer role/i }),
      "frontend_developer",
    );
    await user.click(screen.getByRole("radio", { name: "Junior" }));
    await user.type(screen.getByPlaceholderText("0"), "2");
    await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Create a password"), "password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("This email is already registered."),
    ).toBeInTheDocument();

    expect(mockReset).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
  test("prevents registration when the security check is not completed", async () => {
    const user = userEvent.setup();

    mockCaptchaToken = null;

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Your name"), "John Doe");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /developer role/i }),
      "frontend_developer",
    );
    await user.click(screen.getByRole("radio", { name: "Junior" }));
    await user.type(screen.getByPlaceholderText("0"), "2");
    await user.type(screen.getByPlaceholderText("you@example.com"), "john@example.com");
    await user.type(screen.getByPlaceholderText("Create a password"), "password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("Complete the security check first."),
    ).toBeInTheDocument();

    expect(mockRegister).not.toHaveBeenCalled();
  }, 10000);
});