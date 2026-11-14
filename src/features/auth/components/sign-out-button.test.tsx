
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { SignOutButton } from "./sign-out-button";

jest.mock("../actions", () => ({
  signOutAction: jest.fn(),
}));

describe("SignOutButton", () => {
  test("displays the text sign-out button when a label is provided", () => {
    render(<SignOutButton>Sign out</SignOutButton>);

    expect(
      screen.getByRole("button", { name: "Sign out" })
    ).toBeInTheDocument();
  });

  test("displays the icon-only sign-out button when no label is provided", () => {
    render(<SignOutButton />);

    expect(
      screen.getByRole("button", { name: "Sign out" })
    ).toBeInTheDocument();
  });
});
