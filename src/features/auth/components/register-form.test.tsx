
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./register-form";

jest.mock("../actions", () => ({
  registerAction: jest.fn(),
}));

import { registerAction } from "../actions";

const mockedRegisterAction = jest.mocked(registerAction);

describe("RegisterForm", () => {
  test("displays all registration fields and buttons", () => {
    render(<RegisterForm />);

    expect(
      screen.getByText("Create your Orbit account")
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Create a password")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Create account" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Sign in" })
    ).toHaveAttribute("href", "/sign-in");
  });

  test("does not submit when the registration details are invalid", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(mockedRegisterAction).not.toHaveBeenCalled();
  });

  test("submits valid registration details", async () => {
    const user = userEvent.setup();

    mockedRegisterAction.mockResolvedValue({
      error: undefined,
      fieldErrors: undefined,
    });

    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Your name"), "John Doe");

    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "john@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Create a password"),
      "Password123"
    );

        // Select the developer level.
    await user.click(screen.getByRole("radio", { name: "Junior" }));

    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockedRegisterAction).toHaveBeenCalled();
    });
  });
});
