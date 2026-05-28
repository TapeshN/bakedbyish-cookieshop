"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin",             label: "Dashboard",    icon: "📊" },
  { href: "/admin/orders",      label: "Orders",       icon: "📦" },
  { href: "/admin/batch",       label: "Batch",        icon: "🍪" },
  { href: "/admin/recipes",     label: "Recipes",      icon: "📋" },
  { href: "/admin/ingredients", label: "Ingredients",  icon: "🧂" },
  { href: "/admin/shopping",    label: "Shopping",     icon: "🛒" },
  { href: "/admin/packaging",   label: "Packaging",    icon: "🎁" },
  { href: "/admin/insights",    label: "Insights",     icon: "🔥" },
  { href: "/admin/costs",       label: "Cost & P&L",   icon: "💰" },
  { href: "/admin/investment",  label: "Investment",   icon: "🏦" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav
      style={{
        width: 220,
        flexShrink: 0,
        background: "var(--ink)",
        color: "var(--paper)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 0",
        gap: 0,
      }}
    >
      {/* Brand */}
      <div style={{ padding: "0 1.25rem 1.5rem" }}>
        <p style={{ fontFamily: "var(--font-caprasimo)", fontSize: "1.25rem", color: "var(--paper)", margin: 0 }}>
          baked by <span style={{ color: "var(--caramel)" }}>ish</span>
        </p>
        <p style={{ fontFamily: "var(--font-caveat)", fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", margin: 0 }}>
          admin
        </p>
      </div>

      {/* Links */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: "0 0.75rem" }}>
        {links.map(({ href, label, icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 400,
                color: active ? "var(--caramel)" : "rgba(255,255,255,0.7)",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div style={{ padding: "1rem 1.5rem 0" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "0.5rem",
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.8125rem",
            padding: "0.5rem",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
