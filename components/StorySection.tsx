import Image from "next/image";

export default function StorySection() {
  return (
    <>
      <section
        id="story"
        style={{ padding: "100px 0", background: "var(--paper-deep)" }}
      >
        <div
          className="wrap story-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          {/* Left: Portrait + quote */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "100%",
                height: 520,
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 30px 60px -30px rgba(80, 40, 10, 0.35)",
                position: "relative",
              }}
            >
              <Image
                src="/cookies/oatmeal-plate.png"
                alt="Dark chocolate toffee cookies on a plate"
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 880px) calc(100vw - 44px), 560px"
              />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: -20,
                right: -10,
                background: "var(--paper)",
                border: "0.5px solid var(--line)",
                padding: "16px 20px",
                borderRadius: 14,
                transform: "rotate(3deg)",
                boxShadow: "0 12px 24px -12px rgba(80, 40, 10, 0.25)",
                maxWidth: 200,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontSize: 22,
                  color: "var(--chocolate)",
                  lineHeight: 1.15,
                }}
              >
                &ldquo;no shortcuts, just
                <br />
                brown butter.&rdquo;
              </div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                  marginTop: 6,
                }}
              >
                — Ish
              </div>
            </div>
          </div>

          {/* Right: Copy */}
          <div>
            <span className="tag">our story</span>
            <h2
              style={{
                fontFamily: "var(--font-caprasimo), serif",
                fontSize: "clamp(40px, 5vw, 64px)",
                lineHeight: 1.0,
                marginTop: 16,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              Started as a Sunday
              <br />
              ritual. Stuck.
            </h2>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                fontSize: 17,
                lineHeight: 1.65,
                color: "var(--ink-soft)",
              }}
            >
              <p>
                Ish started baking a single tray of brown butter chocolate chip cookies
                every Sunday afternoon — first for the family, then for friends, then
                for friends-of-friends asking if she&apos;d{" "}
                <em>&ldquo;please sell some?&rdquo;</em>
              </p>
              <p>
                Now it&apos;s a tiny kitchen operation: small batches every week,
                ingredients she&apos;d actually feed her own family, and the kind of
                cookie that&apos;s still warm enough to fog up the box.
              </p>
              <p>
                Pickup is from her front porch. Delivery is her, in the car, on
                Saturdays. That&apos;s the whole operation. Hi.
              </p>
            </div>

            <div
              style={{
                marginTop: 36,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
              }}
            >
              {(
                [
                  ["European butter", "always browned"],
                  ["Valrhona chocolate", "70% & up"],
                  ["Aged dough", "48hr cold rest"],
                ] as [string, string][]
              ).map(([h, s]) => (
                <div
                  key={h}
                  style={{
                    background: "var(--paper)",
                    border: "0.5px solid var(--line)",
                    padding: "16px 14px",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-caprasimo), serif",
                      fontSize: 18,
                      color: "var(--ink)",
                    }}
                  >
                    {h}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
                    {s}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 880px) {
          .story-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </>
  );
}
