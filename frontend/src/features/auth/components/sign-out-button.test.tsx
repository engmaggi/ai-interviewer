import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignOutButton } from "./sign-out-button";

const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockLogout = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

jest.mock("../api", () => ({
  authApi: {
    logout: (...args: unknown[]) => mockLogout(...args),
  },
}));

jest.mock("@tanstack/react-query", () => ({
  useMutation: (options: {
    mutationFn: () => Promise<unknown>;
    onSettled: () => void;
  }) => ({
    mutate: async () => {
      try {
        await options.mutationFn();
      } finally {
        options.onSettled();
      }
    },
    isPending: false,
  }),
}));

describe("SignOutButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogout.mockResolvedValue(undefined);
  });

  test("renders a text sign-out button when children are provided", () => {
    render(<SignOutButton>Sign out</SignOutButton>);

    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  test("renders an icon-only sign-out button when no children are provided", () => {
    render(<SignOutButton />);

    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  test("signs out and redirects to the sign-in page when clicked", async () => {
    const user = userEvent.setup();

    render(<SignOutButton>Sign out</SignOutButton>);

    await user.click(screen.getByRole("button", { name: /sign out/i }));

    expect(mockLogout).toHaveBeenCalled();

    expect(mockReplace).toHaveBeenCalledWith("/sign-in");
    expect(mockRefresh).toHaveBeenCalled();
  });
});