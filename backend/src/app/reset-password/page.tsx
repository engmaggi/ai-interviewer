"use client";

import { useState, type FormEvent } from "react";

// PLACEHOLDER page so the password-reset flow can be tested end to end.
// The frontend team replaces it with the real design. What it must do:
//   1. The emailed link already signed the visitor into a short "recovery session"
//      (GET /auth/confirm set the cookies), so this page only needs a password field.
//   2. POST the new password to /api/auth/reset-password.
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = await response.json();
    setMessage(response.ok ? body.data.message : body.error.message);
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 32, maxWidth: 420 }}>
      <h1>Choose a new password</h1>
      <form onSubmit={onSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          required
          style={{ display: "block", width: "100%", marginBottom: 12, padding: 8 }}
        />
        <button type="submit">Update password</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
