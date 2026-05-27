"use client";

import Image from "next/image";
import { useState } from "react";
import { COOKIES } from "@/data/cookies";
import SectionHeader from "./SectionHeader";
import type { BatchAvailability } from "@/lib/batch";

export default function MenuSection({
  onAdd,
  availability,
}: {
  onAdd: (id: string) => void;
  availability?: BatchAvailability;
}) {
  const [hover, setHover] = useState<string | null>(null);

  // Build a quick lookup: slug → availability info
  const availBySlug: Record<string, { remaining: number; soldOut: boolean }> = {};
  if (availability?.hasCapacityLimit) {
    for (const c of availability.cookies) {
      availBySlug[c.slug] = { remaining: c.remaining, soldOut: c.soldOut };
    }
  }
  // When a batch is active, hide cookies that aren't on this week's menu
  const visibleCookies = availability?.hasCapacityLimit
    ? COOKIES.filter((c) => availBySlug[c.id] !== undefined)
    : COOKIES;

  return (
    <section id="menu" style={{ padding: "100px 0 80px" }}>
      <div className="wrap">
        <SectionHeader
          kicker="The menu"
          title={
            <>
              This week&apos;s{" "}
              <em
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontStyle: "normal",
                  color: "var(--terracotta)",
                }}
              >
                line-up
              </em>
            </>
          }
          sub="Eight flavors on rotation. New drops every Sunday on Instagram."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20,
            marginTop: 40,
          }}
        >
          {visibleCookies.map((c) => {
            const avail   = availBySlug[c.id];
            const soldOut = avail?.soldOut ?? false;
            const isLow   = avail && !soldOut && avail.remaining <= 3;
            return (
            <article
              key={c.id}
              onMouseEnter={() => setHover(c.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                background: "var(--paper-deep)",
                border: "0.5px solid var(--line)",
                borderRadius: 18,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                opacity: soldOut ? 0.55 : 1,
                transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
                transform: hover === c.id && !soldOut ? "translateY(-4px)" : "none",
                boxShadow:
                  hover === c.id && !soldOut
                    ? "0 24px 48px -24px rgba(80,40,10,0.3)"
                    : "0 1px 0 rgba(255,255,255,0.4) inset",
              }}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "var(--paper-deep)",
                    position: "relative",
                  }}
                >
                  {c.photo ? (
                    <Image
                      src={c.photo}
                      alt={c.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 720px) calc(100vw - 44px), 260px"
                    />
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `color-mix(in oklch, ${c.accent}, transparent 80%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        viewBox="0 0 60 60"
                        width="60"
                        height="60"
                        fill="none"
                        aria-hidden="true"
                        opacity={0.35}
                      >
                        <circle cx="20" cy="22" r="5" fill="currentColor" />
                        <circle cx="36" cy="18" r="4" fill="currentColor" />
                        <circle cx="24" cy="36" r="5.5" fill="currentColor" />
                        <circle cx="40" cy="38" r="4" fill="currentColor" />
                        <circle cx="14" cy="36" r="3" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>

                {c.tags[0] && !soldOut && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: "var(--paper)",
                      color: c.accent,
                      padding: "5px 9px",
                      borderRadius: 999,
                      boxShadow: "0 4px 12px -4px rgba(0,0,0,0.15)",
                    }}
                  >
                    {c.tags[0]}
                  </span>
                )}

                {soldOut && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: "var(--ink)",
                      color: "var(--paper)",
                      padding: "5px 9px",
                      borderRadius: 999,
                      boxShadow: "0 4px 12px -4px rgba(0,0,0,0.15)",
                    }}
                  >
                    sold out
                  </span>
                )}

                {isLow && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: "var(--terracotta)",
                      color: "var(--paper)",
                      padding: "5px 9px",
                      borderRadius: 999,
                      boxShadow: "0 4px 12px -4px rgba(0,0,0,0.15)",
                    }}
                  >
                    only {avail!.remaining} left
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginTop: 14,
                  gap: 12,
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-caprasimo), serif",
                    fontSize: 22,
                    color: "var(--ink)",
                    lineHeight: 1.1,
                  }}
                >
                  {c.name}
                </h3>
                <div
                  style={{
                    fontFamily: "var(--font-caprasimo), serif",
                    fontSize: 18,
                    color: "var(--ink-soft)",
                    whiteSpace: "nowrap",
                  }}
                >
                  ${c.price}
                </div>
              </div>

              <p
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: "var(--ink-soft)",
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {c.blurb}
              </p>

              <button
                className="btn btn-ghost"
                disabled={soldOut}
                onClick={() => !soldOut && onAdd(c.id)}
                style={{
                  marginTop: 14,
                  alignSelf: "flex-start",
                  padding: "8px 12px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  cursor: soldOut ? "not-allowed" : "pointer",
                  opacity: soldOut ? 0.5 : 1,
                }}
              >
                {soldOut ? "Sold out" : "+ Add to box"}
              </button>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
