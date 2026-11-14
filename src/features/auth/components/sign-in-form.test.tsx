
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "./sign-in-form";

jest.mock("../actions", () => ({
  signInAction: jest.fn(),
}));

import { signInAction } from "../actions";

const mockedSignInAction = jest.mocked(signInAction);

describe("SignInForm", () => {
  test("displays all sign-in fields and links", () => {
    render(<SignInForm />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Forgot password?" })
    ).toHaveAttribute("href", "/forgot-password");

    expect(
      screen.getByRole("button", { name: "Sign in" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Create an account" })
    ).toHaveAttribute("href", "/register");
  });

  test("does not submit when the details are invalid", async () => {
    const user = userEvent.setup();

    render(<SignInForm />);

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockedSignInAction).not.toHaveBeenCalled();
  });

  test("submits valid sign-in details", async () => {
    const user = userEvent.setup();

    mockedSignInAction.mockResolvedValue({
      error: undefined,
      fieldErrors: undefined,
    });

    render(<SignInForm />);

    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "john@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "Password123"
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockedSignInAction).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "Password123",
      });
    });
  });

  test("displays a server error", async () => {
    const user = userEvent.setup();

    mockedSignInAction.mockResolvedValue({
      error: "Incorrect email or password.",
    });

    render(<SignInForm />);

    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "john@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Enter your password"),
      "Password123"
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Incorrect email or password.")
    ).toBeInTheDocument();
  });
});
