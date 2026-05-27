"use client";

import { useEffect, useState } from "react";
import { getOrderStatus, getOpenDate, getCloseDate, getNextOpenDate } from "@/data/orderConfig";
import SectionHeader from "./SectionHeader";
import type { BatchAvailability } from "@/lib/batch";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 72 }}>
      <div
        style={{
          fontFamily: "var(--font-caprasimo), serif",
          fontSize: "clamp(40px, 6vw, 72px)",
          lineHeight: 1,
          color: "var(--ink)",
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pad(value)}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-soft)",
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        fontFamily: "var(--font-caprasimo), serif",
        fontSize: "clamp(32px, 5vw, 56px)",
        color: "var(--line)",
        lineHeight: 1,
        alignSelf: "flex-start",
        paddingTop: 4,
        userSelect: "none",
      }}
    >
      :
    </div>
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
    hour:    "numeric",
    minute:  "2-digit",
    timeZoneName: "short",
  });
}

export default function OrderClosed({
  reason = "window",
  availability,
}: {
  reason?: "window" | "sold-out";
  availability?: BatchAvailability;
} = {}) {
  const status = getOrderStatus();

  // Sold-out variant: short-circuit with a dedicated UI
  if (reason === "sold-out") {
    return (
      <section id="order" style={{ padding: "100px 0", scrollMarginTop: 80 }}>
        <div className="wrap">
          <SectionHeader
            kicker="Build your box"
            title={
              <>
                This week is{" "}
                <em
                  style={{
                    fontFamily: "var(--font-caveat), cursive",
                    fontStyle: "normal",
                    color: "var(--terracotta)",
                  }}
                >
                  sold out
                </em>
              </>
            }
          />
          <div
            style={{
              marginTop: 40,
              background: "var(--paper-deep)",
              border: "0.5px solid var(--line)",
              borderRadius: 22,
              padding: "56px 48px",
              textAlign: "center",
              maxWidth: 720,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-caprasimo), serif",
                fontSize: 56,
                color: "var(--ink)",
                lineHeight: 1.0,
                letterSpacing: "-0.02em",
              }}
            >
              every cookie&apos;s spoken for 🍪
            </div>
            <p
              style={{
                marginTop: 16,
                fontSize: 17,
                color: "var(--ink-soft)",
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              All {availability?.totalPlanned ?? 0} cookies for the{" "}
              {availability?.weekOf ?? "week"} batch are claimed. Follow{" "}
              <a
                href="https://instagram.com/bakedbyish"
                style={{
                  color: "var(--terracotta)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                @bakedbyish
              </a>{" "}
              for next week&apos;s drop!
            </p>
            <div
              style={{
                marginTop: 32,
                fontFamily: "var(--font-caveat), cursive",
                fontSize: 28,
                color: "var(--chocolate)",
              }}
            >
              thank you for the love 🤎
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Target for countdown — upcoming = count to openAt, closed = count to nextOpenAt (if any)
  const countdownTarget: Date | null =
    status === "upcoming" ? getOpenDate() :
    status === "closed"   ? getNextOpenDate() :
    null;

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    countdownTarget ? getTimeLeft(countdownTarget) : null
  );

  // Tick every second
  useEffect(() => {
    if (!countdownTarget) return;
    const id = setInterval(() => {
      const t = getTimeLeft(countdownTarget);
      setTimeLeft(t);
    }, 1000);
    return () => clearInterval(id);
  }, [countdownTarget]);

  const isUpcoming = status === "upcoming";
  const openDate   = getOpenDate();
  const closeDate  = getCloseDate();
  const nextOpen   = getNextOpenDate();

  return (
    <section id="order" style={{ padding: "100px 0", scrollMarginTop: 80 }}>
      <div className="wrap">
        <SectionHeader
          kicker="Build your box"
          title={
            <>
              Orders are{" "}
              <em
                style={{
                  fontFamily: "var(--font-caveat), cursive",
                  fontStyle: "normal",
                  color: isUpcoming ? "var(--caramel)" : "var(--terracotta)",
                }}
              >
                {isUpcoming ? "opening soon" : "closed"}
              </em>
            </>
          }
        />

        <div
          style={{
            marginTop: 40,
            background: "var(--paper-deep)",
            border: "0.5px solid var(--line)",
            borderRadius: 22,
            padding: "56px 48px",
            textAlign: "center",
            maxWidth: 720,
          }}
        >
          {/* Countdown */}
          {timeLeft && (countdownTarget!) && (
            <>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                  marginBottom: 28,
                }}
              >
                {isUpcoming ? "Orders open in" : "Next batch in"}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                {timeLeft.days > 0 && (
                  <>
                    <CountdownUnit value={timeLeft.days}    label="days" />
                    <Divider />
                  </>
                )}
                <CountdownUnit value={timeLeft.hours}   label="hours" />
                <Divider />
                <CountdownUnit value={timeLeft.minutes} label="min" />
                <Divider />
                <CountdownUnit value={timeLeft.seconds} label="sec" />
              </div>

              <div
                style={{
                  marginTop: 32,
                  display: "inline-block",
                  padding: "10px 20px",
                  background: "var(--paper)",
                  border: "0.5px solid var(--line)",
                  borderRadius: 999,
                  fontSize: 14,
                  color: "var(--ink-soft)",
                }}
              >
                {isUpcoming
                  ? `Opens ${formatDate(countdownTarget!)}`
                  : `Opens ${formatDate(countdownTarget!)}`}
              </div>
            </>
          )}

          {/* No countdown target (closed + no next date set) */}
          {!timeLeft && (
            <div
              style={{
                fontFamily: "var(--font-caveat), cursive",
                fontSize: 32,
                color: "var(--chocolate)",
                lineHeight: 1.2,
              }}
            >
              next batch details dropping soon 🤎
            </div>
          )}

          {/* Window info strip */}
          <div
            style={{
              marginTop: 40,
              paddingTop: 28,
              borderTop: "0.5px solid var(--line)",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px 32px",
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            {isUpcoming && (
              <>
                <span>
                  <strong style={{ color: "var(--ink)" }}>Opens</strong>{" "}
                  {formatDate(openDate)}
                </span>
                <span>·</span>
                <span>
                  <strong style={{ color: "var(--ink)" }}>Closes</strong>{" "}
                  {formatDate(closeDate)}
                </span>
              </>
            )}
            {!isUpcoming && nextOpen && (
              <span>
                <strong style={{ color: "var(--ink)" }}>Next window opens</strong>{" "}
                {formatDate(nextOpen)}
              </span>
            )}
            {!isUpcoming && !nextOpen && (
              <span>
                Follow{" "}
                <a
                  href="https://instagram.com/bakedbyish"
                  style={{
                    color: "var(--terracotta)",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  @bakedbyish
                </a>{" "}
                on Instagram for the next menu drop
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
