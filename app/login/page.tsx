"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Wrong password — try again.");
      setPassword("");
    }
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--paper-deep)",
      }}
    >
      <div
        style={{
          background: "var(--paper)",
          border: "1.5px solid var(--line)",
          borderRadius: "1.25rem",
          padding: "2.5rem 2rem",
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-caprasimo)",
              fontSize: "1.75rem",
              color: "var(--ink)",
              lineHeight: 1,
              marginBottom: "0.25rem",
            }}
          >
            baked by{" "}
            <span style={{ color: "var(--terracotta)" }}>ish</span>
          </p>
          <p
            style={{
              fontFamily: "var(--font-caveat)",
              fontSize: "1rem",
              color: "var(--ink-soft)",
            }}
          >
            admin access
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="password"
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--ink)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="••••••••"
              style={{
                border: error ? "1.5px solid var(--terracotta)" : "1.5px solid var(--line)",
                borderRadius: "0.625rem",
                padding: "0.625rem 0.875rem",
                fontSize: "1rem",
                background: "var(--paper)",
                color: "var(--ink)",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
              }}
            />
            {error && (
              <p style={{ fontSize: "0.8125rem", color: "var(--terracotta)", margin: 0 }}>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              background: loading || !password ? "var(--line)" : "var(--ink)",
              color: "var(--paper)",
              border: "none",
              borderRadius: "0.625rem",
              padding: "0.75rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
