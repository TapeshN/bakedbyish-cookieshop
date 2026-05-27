import { REVIEWS } from "@/data/reviews";
import SectionHeader from "./SectionHeader";

export default function ReviewsSection() {
  return (
    <section id="reviews" style={{ padding: "100px 0" }}>
      <div className="wrap">
        <SectionHeader
          kicker="Word of mouth"
          title={
            <>
              What people{" "}
              <em
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontStyle: "normal",
                  color: "var(--terracotta)",
                }}
              >
                actually
              </em>{" "}
              say
            </>
          }
          sub="Texts, DMs, and a few hand-delivered thank-you notes."
        />

        <div
          style={{
            marginTop: 40,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {REVIEWS.map((r, i) => (
            <figure
              key={i}
              style={{
                margin: 0,
                background: "var(--paper)",
                border: "0.5px solid var(--line)",
                borderRadius: 18,
                padding: "28px 24px 22px",
                display: "flex",
                flexDirection: "column",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 28px -20px rgba(80,40,10,0.2)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-caprasimo), serif",
                  fontSize: 64,
                  color: r.color,
                  lineHeight: 0.5,
                  marginBottom: 12,
                  opacity: 0.7,
                }}
              >
                &ldquo;
              </div>
              <blockquote
                style={{
                  margin: 0,
                  fontSize: 17,
                  lineHeight: 1.55,
                  color: "var(--ink)",
                  fontFamily: "var(--font-jakarta), sans-serif",
                  fontWeight: 500,
                  flex: 1,
                }}
              >
                {r.quote}
              </blockquote>
              <figcaption
                style={{
                  marginTop: 22,
                  paddingTop: 18,
                  borderTop: "0.5px dashed var(--line)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>
                  {r.name}
                </span>
                <span style={{ fontSize: 12, color: r.color, fontWeight: 600 }}>
                  {r.flavor}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Rating chip */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 20,
            background: "var(--paper-deep)",
            borderRadius: 999,
            maxWidth: 540,
            margin: "40px auto 0",
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <svg
                key={i}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="var(--terracotta)"
                aria-hidden="true"
              >
                <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.6L6 22l1.5-7.2L2 10l7.1-1.1z" />
              </svg>
            ))}
          </div>
          <div
            style={{
              fontFamily: "var(--font-caprasimo), serif",
              fontSize: 22,
              color: "var(--ink)",
            }}
          >
            4.9{" "}
            <span style={{ color: "var(--ink-soft)", fontSize: 16 }}>
              · 87 reviews on Instagram
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
