import { ReactNode } from "react";

export default function SectionHeader({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: ReactNode;
  sub?: string;
}) {
  return (
    <div style={{ maxWidth: 640 }}>
      <span className="tag">{kicker}</span>
      <h2
        style={{
          marginTop: 16,
          fontSize: "clamp(38px, 5vw, 58px)",
          lineHeight: 1.0,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          style={{
            marginTop: 16,
            fontSize: 18,
            color: "var(--ink-soft)",
            lineHeight: 1.55,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
