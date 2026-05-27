import { requireAdmin } from "@/lib/auth";
import AdminNav from "./AdminNav";

export const metadata = { title: "Admin — Baked by Ish" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--paper-deep)" }}>
      <AdminNav />
      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
