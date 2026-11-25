import { render, screen } from "@testing-library/react";
import { AuthCard } from "./auth-card";

describe("AuthCard", () => {
  test("displays the title", () => {
    render(
      <AuthCard title="Sign in" description="Welcome back">
        <button>Continue</button>
      </AuthCard>,
    );

    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
  });

  test("displays the description", () => {
    render(
      <AuthCard title="Sign in" description="Welcome back">
        <button>Continue</button>
      </AuthCard>,
    );

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  test("displays its child content", () => {
    render(
      <AuthCard title="Sign in" description="Welcome back">
        <button>Continue</button>
      </AuthCard>,
    );

    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
  });
});