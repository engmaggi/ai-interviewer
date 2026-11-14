
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { VerifyEmailPanel } from "./verify-email-panel";

jest.mock("../actions", () => ({
  resendVerificationAction: jest.fn(),
}));

describe("VerifyEmailPanel", () => {
  test("displays the default email verification message", () => {
    render(<VerifyEmailPanel email="john@example.com" />);

    expect(screen.getByText("Check your inbox")).toBeInTheDocument();

    expect(screen.getByText("john@example.com")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Resend verification email" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Change email address" })
    ).toHaveAttribute("href", "/register");
  });

  test("displays an expired message when the verification link has expired", () => {
    render(
      <VerifyEmailPanel
        email="john@example.com"
        status="expired"
      />
    );

    expect(screen.getByText("Link expired")).toBeInTheDocument();

    expect(
      screen.getByText(
        "This verification link has expired or was already used."
      )
    ).toBeInTheDocument();
  });
});
