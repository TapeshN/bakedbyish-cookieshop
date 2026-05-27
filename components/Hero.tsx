import Image from "next/image";

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-caprasimo), serif",
          fontSize: 28,
          color: "var(--ink)",
          lineHeight: 1,
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-soft)",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <>
      <header id="top" style={{ paddingTop: 24, paddingBottom: 56 }}>
        <div
          className="wrap hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 56,
            alignItems: "center",
            minHeight: 560,
          }}
        >
          {/* Left: Copy */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <span className="tag">small batch · baked weekly</span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-caprasimo), serif",
                fontSize: "clamp(56px, 8vw, 104px)",
                lineHeight: 0.95,
                color: "var(--ink)",
                letterSpacing: "-0.025em",
                marginBottom: 18,
              }}
            >
              Cookies that
              <br />
              <span style={{ color: "var(--terracotta)" }}>taste</span> like
              <br />
              a hug from{" "}
              <span
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontWeight: 600,
                  fontStyle: "italic",
                  color: "var(--chocolate)",
                }}
              >
                Ish.
              </span>
            </h1>

            <p
              style={{
                fontSize: 19,
                lineHeight: 1.55,
                color: "var(--ink-soft)",
                maxWidth: 460,
                marginBottom: 32,
              }}
            >
              Hand-rolled, brown-buttered, slightly under-baked on purpose. Made in
              small batches every week and delivered warm-ish across town.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 36,
              }}
            >
              <a href="#order" className="btn btn-primary">
                Build your box →
              </a>
              <a href="#menu" className="btn btn-secondary">
                See the menu
              </a>
            </div>

            <div
              style={{
                display: "flex",
                gap: 28,
                paddingTop: 24,
                borderTop: "0.5px solid var(--line)",
              }}
            >
              <Stat n="1,200+" label="boxes baked" />
              <Stat n="8" label="rotating flavors" />
              <Stat n="48h" label="dough to doorstep" />
            </div>
          </div>

          {/* Right: Image collage */}
          <div style={{ position: "relative", height: 560 }}>
            {/* Main hero image */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 380,
                height: 460,
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 30px 60px -30px rgba(80, 40, 10, 0.4)",
              }}
            >
              <Image
                src="/cookies/hero-stack.png"
                alt="Stack of brown butter white chip cookies"
                fill
                style={{ objectFit: "cover" }}
                priority
                sizes="380px"
              />
            </div>

            {/* Handwritten note card */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 80,
                width: 240,
                background: "var(--paper)",
                border: "0.5px solid var(--line)",
                borderRadius: 18,
                padding: 18,
                transform: "rotate(-4deg)",
                boxShadow: "0 20px 40px -20px rgba(80, 40, 10, 0.25)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontSize: 28,
                  lineHeight: 1.05,
                  color: "var(--chocolate)",
                }}
              >
                today&apos;s bake:
                <br />
                brown butter
                <br />
                white chip 🤎
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--terracotta)",
                }}
              >
                fresh out · 3:14 pm
              </div>
            </div>

            {/* Detail image */}
            <div
              style={{
                position: "absolute",
                left: 30,
                bottom: 0,
                width: 220,
                height: 180,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 24px 48px -24px rgba(80, 40, 10, 0.35)",
                transform: "rotate(2deg)",
              }}
            >
              <Image
                src="/cookies/snickerdoodles.png"
                alt="Cinnamon snickerdoodles"
                fill
                style={{ objectFit: "cover" }}
                sizes="220px"
              />
            </div>

            {/* Spinning sticker badge */}
            <div
              style={{
                position: "absolute",
                right: -10,
                bottom: 30,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "var(--terracotta)",
                color: "var(--paper)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                transform: "rotate(8deg)",
                boxShadow: "0 18px 36px -16px rgba(180, 80, 40, 0.6)",
                animation: "badge-spin 22s linear infinite",
              }}
            >
              <svg
                viewBox="0 0 120 120"
                style={{ position: "absolute", inset: 0 }}
                aria-hidden="true"
              >
                <defs>
                  <path
                    id="circ"
                    d="M 60 60 m -42 0 a 42 42 0 1 1 84 0 a 42 42 0 1 1 -84 0"
                  />
                </defs>
                <text
                  fontFamily="Plus Jakarta Sans"
                  fontSize="11"
                  fontWeight="700"
                  letterSpacing="3"
                  fill="var(--paper)"
                >
                  <textPath href="#circ">
                    BAKED WEEKLY · SMALL BATCH · BAKED WEEKLY ·{" "}
                  </textPath>
                </text>
              </svg>
              <div
                style={{
                  fontFamily: "var(--font-caprasimo), serif",
                  fontSize: 22,
                  lineHeight: 1,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                fresh
                <br />
                weekly
              </div>
            </div>
          </div>
        </div>
      </header>

      <style>{`
        @media (max-width: 880px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            min-height: auto !important;
          }
          .hero-grid > div:last-child {
            height: 460px !important;
          }
        }
      `}</style>
    </>
  );
}
