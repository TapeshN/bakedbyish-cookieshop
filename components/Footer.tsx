export default function Footer() {
  return (
    <footer
      style={{
        padding: "80px 0 40px",
        background: "var(--ink)",
        color: "var(--paper)",
      }}
    >
      <div className="wrap">
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 48,
            alignItems: "start",
          }}
        >
          {/* Col 1: Brand */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <span
                style={{
                  fontFamily: "var(--font-caprasimo), serif",
                  fontSize: 32,
                  letterSpacing: "-0.02em",
                }}
              >
                BakedByIsh
              </span>
            </div>
            <p
              style={{
                maxWidth: 360,
                color: "color-mix(in oklch, var(--paper), transparent 30%)",
                fontSize: 15,
              }}
            >
              Small-batch cookies, baked every week by Ish. Hand-delivered or ready
              for pickup off the front porch.
            </p>
          </div>

          {/* Col 2: Find Us */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-jakarta), sans-serif",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "color-mix(in oklch, var(--paper), transparent 40%)",
                marginBottom: 16,
              }}
            >
              Find us
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                fontSize: 16,
              }}
            >
              <li>
                <a
                  href="#"
                  style={{ color: "var(--paper)", textDecoration: "none" }}
                >
                  @bakedbyish on Instagram
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@bakedbyish.co"
                  style={{ color: "var(--paper)", textDecoration: "none" }}
                >
                  hello@bakedbyish.co
                </a>
              </li>
              <li>Pickup: Saturdays, 10–2</li>
            </ul>
          </div>

          {/* Col 3: This Week */}
          <div>
            <h4
              style={{
                fontFamily: "var(--font-jakarta), sans-serif",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "color-mix(in oklch, var(--paper), transparent 40%)",
                marginBottom: 16,
              }}
            >
              This week
            </h4>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                fontSize: 16,
                color: "color-mix(in oklch, var(--paper), transparent 20%)",
              }}
            >
              <li>Mon — dough cold-resting</li>
              <li>Wed — Instagram menu drop</li>
              <li>Fri — order cutoff @ 8pm</li>
              <li>Sat — pickup &amp; delivery</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            marginTop: 56,
            paddingTop: 24,
            borderTop:
              "0.5px solid color-mix(in oklch, var(--paper), transparent 80%)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 13,
            color: "color-mix(in oklch, var(--paper), transparent 50%)",
          }}
        >
          <div>
            © 2026 BakedByIsh. Baked with brown butter and a lot of love.
          </div>
          <div
            style={{
              fontFamily: "var(--font-caveat), cursive",
              fontSize: 22,
              color: "var(--paper)",
            }}
          >
            thanks for stopping by 🤎
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </footer>
  );
}
