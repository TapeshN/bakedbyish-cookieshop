"use client";

import { useEffect, useReducer, useState } from "react";
import { COOKIES, BOX_SIZES, DELIVERY_FEE, BoxId } from "@/data/cookies";
import SectionHeader from "./SectionHeader";
import type { BatchAvailability } from "@/lib/batch";

type Counts = Record<string, number>;

type State = {
  boxId: BoxId;
  counts: Counts;
  delivery: "pickup" | "delivery";
  pickupSlot: "sat" | "sat-mid" | "sat-late";
  note: string;
  stage: "build" | "placed";
};

type Action =
  | { type: "SET_BOX"; id: BoxId }
  | { type: "ADD"; cookieId: string; boxCount: number }
  | { type: "REMOVE"; cookieId: string }
  | { type: "FILL"; cookieId: string; remaining: number }
  | { type: "CLEAR" }
  | { type: "SET_DELIVERY"; mode: "pickup" | "delivery" }
  | { type: "SET_SLOT"; slot: "sat" | "sat-mid" | "sat-late" }
  | { type: "SET_NOTE"; note: string }
  | { type: "PLACE" }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_BOX":
      return { ...state, boxId: action.id };
    case "ADD": {
      const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
      if (total >= action.boxCount) return state;
      return {
        ...state,
        counts: {
          ...state.counts,
          [action.cookieId]: (state.counts[action.cookieId] || 0) + 1,
        },
      };
    }
    case "REMOVE": {
      const next = {
        ...state.counts,
        [action.cookieId]: Math.max(0, (state.counts[action.cookieId] || 0) - 1),
      };
      if (next[action.cookieId] === 0) delete next[action.cookieId];
      return { ...state, counts: next };
    }
    case "FILL": {
      const total = Object.values(state.counts).reduce((a, b) => a + b, 0);
      const space = action.remaining - 0; // use passed remaining
      if (space <= 0) return state;
      return {
        ...state,
        counts: {
          ...state.counts,
          [action.cookieId]: (state.counts[action.cookieId] || 0) + space,
        },
      };
    }
    case "CLEAR":
      return { ...state, counts: {} };
    case "SET_DELIVERY":
      return { ...state, delivery: action.mode };
    case "SET_SLOT":
      return { ...state, pickupSlot: action.slot };
    case "SET_NOTE":
      return { ...state, note: action.note };
    case "PLACE":
      return { ...state, stage: "placed" };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

const initialState: State = {
  boxId: "dozen",
  counts: {},
  delivery: "pickup",
  pickupSlot: "sat",
  note: "",
  stage: "build",
};

function Step({
  n,
  title,
  extra,
}: {
  n: string;
  title: string;
  extra?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "var(--ink)",
            color: "var(--paper)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-caprasimo), serif",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {n}
        </span>
        <span
          style={{
            fontFamily: "var(--font-caprasimo), serif",
            fontSize: 22,
            color: "var(--ink)",
          }}
        >
          {title}
        </span>
      </div>
      {extra}
    </div>
  );
}

function CookieIcon() {
  return (
    <svg
      viewBox="0 0 36 36"
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      <circle cx="13" cy="14" r="2" fill="rgba(0,0,0,0.45)" />
      <circle cx="22" cy="13" r="1.6" fill="rgba(0,0,0,0.45)" />
      <circle cx="15" cy="22" r="2.2" fill="rgba(0,0,0,0.45)" />
      <circle cx="23" cy="23" r="1.5" fill="rgba(0,0,0,0.45)" />
      <circle cx="10" cy="20" r="1.2" fill="rgba(0,0,0,0.45)" />
    </svg>
  );
}

function Stepper({
  value,
  onDec,
  onInc,
  canInc,
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  canInc: boolean;
}) {
  const btnStyle = (disabled: boolean) => ({
    width: 28,
    height: 28,
    borderRadius: "50%",
    appearance: "none" as const,
    cursor: disabled ? "not-allowed" : "pointer",
    background: "var(--ink)",
    color: "var(--paper)",
    border: 0,
    fontFamily: "inherit",
    fontSize: 16,
    fontWeight: 600,
    display: "inline-flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    transition: "all 0.15s ease",
    opacity: disabled ? 0.3 : 1,
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button onClick={onDec} style={btnStyle(false)}>
        −
      </button>
      <span
        style={{
          minWidth: 18,
          textAlign: "center",
          fontFamily: "var(--font-caprasimo), serif",
          fontSize: 20,
          color: "var(--ink)",
        }}
      >
        {value}
      </span>
      <button onClick={onInc} disabled={!canInc} style={btnStyle(!canInc)}>
        +
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span
        style={{
          color: accent ? "var(--terracotta)" : "inherit",
          fontWeight: accent ? 600 : 400,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function OrderBuilder({
  initialAdd,
  onConsumed,
  availability,
}: {
  initialAdd: string | null;
  onConsumed: () => void;
  availability?: BatchAvailability;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [customerName, setCustomerName]   = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [placing, setPlacing]             = useState(false);
  const [placeError, setPlaceError]       = useState<string | null>(null);
  const box = BOX_SIZES.find((b) => b.id === state.boxId)!;

  // Per-cookie max from active batch
  const availBySlug: Record<string, number> = {};
  if (availability?.hasCapacityLimit) {
    for (const c of availability.cookies) availBySlug[c.slug] = c.remaining;
  }
  const hasCapacity = !!availability?.hasCapacityLimit;
  function maxFor(cookieId: string): number {
    if (!hasCapacity) return Infinity;
    return availBySlug[cookieId] ?? 0;
  }

  useEffect(() => {
    if (initialAdd) {
      dispatch({ type: "ADD", cookieId: initialAdd, boxCount: box.count });
      onConsumed();
      document
        .getElementById("order")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAdd]);

  const totalCount = Object.values(state.counts).reduce((a, b) => a + b, 0);
  const remaining = box.count - totalCount;
  const flavorCount = Object.values(state.counts).filter((v) => v > 0).length;

  const cookieSubtotal = Object.entries(state.counts).reduce((sum, [id, qty]) => {
    const c = COOKIES.find((c) => c.id === id);
    return sum + (c ? c.price * qty : 0);
  }, 0);
  const bulkAdjust = box.price;
  const deliveryFee = state.delivery === "delivery" ? DELIVERY_FEE : 0;
  const total = Math.max(0, cookieSubtotal + bulkAdjust + deliveryFee);
  const canCheckout = totalCount === box.count && !!customerName && !!customerPhone;

  async function handlePlace() {
    if (!canCheckout || placing) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const items = Object.entries(state.counts).map(([id, qty]) => {
        const c = COOKIES.find((c) => c.id === id)!;
        return { cookieSlug: c.id, cookieName: c.name, quantity: qty, unitPrice: c.price };
      });
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          boxSize:      state.boxId,
          boxCount:     box.count,
          deliveryMode: state.delivery,
          pickupSlot:   state.delivery === "pickup" ? state.pickupSlot : null,
          note:         state.note || null,
          subtotal:     cookieSubtotal,
          discount:     Math.abs(bulkAdjust),
          deliveryFee,
          total,
          items,
        }),
      });

      // 409 = capacity conflict (someone else grabbed the last one)
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        setPlaceError(body?.error ?? "Some items just sold out. Please refresh and try again.");
        setPlacing(false);
        return;
      }
      if (!res.ok) {
        setPlaceError("Something went wrong saving your order. Please try again.");
        setPlacing(false);
        return;
      }
    } catch {
      setPlaceError("Network error — please try again.");
      setPlacing(false);
      return;
    }
    dispatch({ type: "PLACE" });
    setPlacing(false);
  }

  if (state.stage === "placed") {
    const lines = Object.entries(state.counts).map(([id, qty]) => {
      const c = COOKIES.find((c) => c.id === id)!;
      return { name: c.name, qty };
    });

    return (
      <section id="order" style={{ padding: "100px 0", scrollMarginTop: 80 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div
            style={{
              background: "var(--paper-deep)",
              border: "0.5px solid var(--line)",
              borderRadius: 24,
              padding: 56,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: "50%",
                background: "var(--terracotta)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--paper)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12l5 5L20 7" />
              </svg>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-caprasimo), serif",
                fontSize: 56,
                lineHeight: 1.0,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              Order in!
            </h2>
            <p
              style={{
                marginTop: 12,
                fontSize: 18,
                color: "var(--ink-soft)",
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Ish will text you in a few hours to confirm your{" "}
              <strong style={{ color: "var(--ink)" }}>${total.toFixed(2)}</strong>{" "}
              {state.delivery} for this Saturday.
            </p>

            <div
              style={{
                marginTop: 32,
                background: "var(--paper)",
                border: "0.5px solid var(--line)",
                borderRadius: 14,
                padding: 20,
                textAlign: "left",
                maxWidth: 400,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                  marginBottom: 10,
                }}
              >
                your box
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {lines.map((l, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 15,
                    }}
                  >
                    <span>{l.name}</span>
                    <span style={{ color: "var(--ink-soft)" }}>×{l.qty}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              style={{
                marginTop: 32,
                fontFamily: "var(--font-caveat), cursive",
                fontSize: 28,
                color: "var(--chocolate)",
              }}
            >
              see you saturday! 🤎
            </div>

            <button
              onClick={() => dispatch({ type: "RESET" })}
              className="btn btn-ghost"
              style={{ marginTop: 24, fontSize: 14 }}
            >
              ← place another order
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="order" style={{ padding: "100px 0", scrollMarginTop: 80 }}>
        <div className="wrap">
          <SectionHeader
            kicker="Build your box"
            title={
              <>
                Custom{" "}
                <em
                  style={{
                    fontFamily: "var(--font-caveat), cursive",
                    fontStyle: "normal",
                    color: "var(--terracotta)",
                  }}
                >
                  cookie box
                </em>
                , your way
              </>
            }
            sub="Mix and match this week's flavors. Pickup is free; delivery is a flat $6 within town."
          />

          <div
            className="order-grid"
            style={{
              marginTop: 40,
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 32,
              alignItems: "start",
            }}
          >
            {/* LEFT: Steps card */}
            <div
              style={{
                background: "var(--paper-deep)",
                border: "0.5px solid var(--line)",
                borderRadius: 22,
                padding: 28,
              }}
            >
              {/* Step 1: Box size */}
              <Step n="1" title="Pick a box size" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 10,
                  marginTop: 12,
                  marginBottom: 28,
                }}
              >
                {BOX_SIZES.map((b) => {
                  const on = b.id === state.boxId;
                  return (
                    <button
                      key={b.id}
                      onClick={() => dispatch({ type: "SET_BOX", id: b.id as BoxId })}
                      style={{
                        appearance: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        padding: "16px 16px 14px",
                        borderRadius: 14,
                        border: `1.5px solid ${on ? "var(--ink)" : "var(--line)"}`,
                        background: on ? "var(--paper)" : "transparent",
                        color: "var(--ink)",
                        fontFamily: "inherit",
                        position: "relative",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {"popular" in b && b.popular && (
                        <span
                          style={{
                            position: "absolute",
                            top: -10,
                            right: 10,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--paper)",
                            background: "var(--terracotta)",
                            padding: "3px 8px",
                            borderRadius: 999,
                          }}
                        >
                          most popular
                        </span>
                      )}
                      <div
                        style={{
                          fontFamily: "var(--font-caprasimo), serif",
                          fontSize: 24,
                          color: "var(--ink)",
                        }}
                      >
                        {b.count}
                      </div>
                      <div
                        style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}
                      >
                        {b.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink-soft)",
                          marginTop: 4,
                        }}
                      >
                        {b.hint}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step 2: Flavors */}
              <Step
                n="2"
                title="Choose your flavors"
                extra={
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: remaining === 0 ? "var(--terracotta)" : "var(--ink-soft)",
                    }}
                  >
                    {totalCount} / {box.count} cookies
                  </span>
                }
              />

              {/* Progress bar */}
              <div
                style={{
                  marginTop: 12,
                  marginBottom: 18,
                  height: 8,
                  background: "var(--paper)",
                  borderRadius: 999,
                  overflow: "hidden",
                  border: "0.5px solid var(--line)",
                }}
              >
                <div
                  style={{
                    width: `${(totalCount / box.count) * 100}%`,
                    height: "100%",
                    background:
                      totalCount === box.count ? "var(--terracotta)" : "var(--caramel)",
                    transition:
                      "width 0.25s cubic-bezier(.4,.6,.3,1), background 0.25s",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* When a batch is active, only show cookies on this week's menu */}
                {(hasCapacity ? COOKIES.filter(c => availBySlug[c.id] !== undefined) : COOKIES).map((c) => {
                  const qty       = state.counts[c.id] || 0;
                  const cookieMax = maxFor(c.id);
                  const soldOut   = hasCapacity && cookieMax <= 0;
                  const atBoxMax  = totalCount >= box.count;
                  const atCookieMax = qty >= cookieMax;
                  const atMax     = atBoxMax || atCookieMax || soldOut;
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto auto",
                        alignItems: "center",
                        gap: 14,
                        padding: "10px 12px",
                        background: qty > 0 ? "var(--paper)" : "transparent",
                        border:
                          qty > 0
                            ? "0.5px solid var(--line)"
                            : "0.5px solid transparent",
                        borderRadius: 12,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: c.accent,
                          flexShrink: 0,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <CookieIcon />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 15,
                            color: "var(--ink)",
                          }}
                        >
                          {c.name}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                          ${c.price} each
                          {hasCapacity && (
                            <span
                              style={{
                                marginLeft: 8,
                                color: soldOut
                                  ? "var(--terracotta)"
                                  : cookieMax <= 3
                                  ? "var(--terracotta)"
                                  : "var(--ink-soft)",
                                fontWeight: soldOut || cookieMax <= 3 ? 600 : 400,
                              }}
                            >
                              {soldOut
                                ? "· sold out"
                                : cookieMax <= 3
                                ? `· only ${cookieMax} left`
                                : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {qty === 0 ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() =>
                              dispatch({
                                type: "ADD",
                                cookieId: c.id,
                                boxCount: box.count,
                              })
                            }
                            disabled={atMax}
                            style={{
                              appearance: "none",
                              cursor: atMax ? "not-allowed" : "pointer",
                              padding: "7px 12px",
                              border: "1px solid var(--line)",
                              borderRadius: 999,
                              background: "transparent",
                              color: "var(--ink)",
                              fontFamily: "inherit",
                              fontSize: 13,
                              fontWeight: 600,
                              opacity: atMax ? 0.4 : 1,
                              transition: "all 0.15s ease",
                            }}
                          >
                            + Add
                          </button>
                          {!atMax && remaining > 1 && (
                            <button
                              onClick={() => {
                                const fillBy = Math.min(remaining, cookieMax);
                                if (fillBy > 0) {
                                  dispatch({
                                    type: "FILL",
                                    cookieId: c.id,
                                    remaining: fillBy,
                                  });
                                }
                              }}
                              title={`Fill remaining ${Math.min(remaining, cookieMax)}`}
                              style={{
                                appearance: "none",
                                cursor: "pointer",
                                padding: "7px 12px",
                                border: "1px solid var(--line)",
                                borderRadius: 999,
                                background: "transparent",
                                color: "var(--ink)",
                                fontFamily: "inherit",
                                fontSize: 13,
                                fontWeight: 600,
                                opacity: 1,
                                transition: "all 0.15s ease",
                              }}
                            >
                              +{Math.min(remaining, cookieMax)}
                            </button>
                          )}
                        </div>
                      ) : (
                        <Stepper
                          value={qty}
                          onDec={() => dispatch({ type: "REMOVE", cookieId: c.id })}
                          onInc={() =>
                            dispatch({
                              type: "ADD",
                              cookieId: c.id,
                              boxCount: box.count,
                            })
                          }
                          canInc={!atMax}
                        />
                      )}

                      <div style={{ width: 0 }} />
                    </div>
                  );
                })}
              </div>

              {totalCount > 0 && (
                <button
                  onClick={() => dispatch({ type: "CLEAR" })}
                  className="btn btn-ghost"
                  style={{ marginTop: 14, padding: "8px 12px", fontSize: 13 }}
                >
                  clear box
                </button>
              )}

              {/* Step 3: Pickup or delivery */}
              <div style={{ marginTop: 36 }}>
                <Step n="3" title="Pickup or delivery" />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginTop: 12,
                  }}
                >
                  {(
                    [
                      {
                        id: "pickup" as const,
                        title: "Porch pickup",
                        sub: "From Ish's place · Saturdays 10–2",
                        meta: "Free",
                      },
                      {
                        id: "delivery" as const,
                        title: "Local delivery",
                        sub: "Within town · Saturday afternoon",
                        meta: "+$6",
                      },
                    ] as { id: "pickup" | "delivery"; title: string; sub: string; meta: string }[]
                  ).map((opt) => {
                    const sel = state.delivery === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() =>
                          dispatch({ type: "SET_DELIVERY", mode: opt.id })
                        }
                        style={{
                          appearance: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          padding: "14px 16px",
                          borderRadius: 14,
                          border: `1.5px solid ${sel ? "var(--ink)" : "var(--line)"}`,
                          background: sel ? "var(--paper)" : "transparent",
                          fontFamily: "inherit",
                          color: "var(--ink)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 15 }}>
                            {opt.title}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: sel ? "var(--terracotta)" : "var(--ink-soft)",
                              fontWeight: 600,
                            }}
                          >
                            {opt.meta}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--ink-soft)",
                            marginTop: 4,
                          }}
                        >
                          {opt.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {state.delivery === "pickup" && (
                  <div style={{ marginTop: 16 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--ink-soft)",
                        marginBottom: 8,
                      }}
                    >
                      Pick a time window
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {(
                        [
                          ["sat", "Sat · 10–11"],
                          ["sat-mid", "Sat · 11–12:30"],
                          ["sat-late", "Sat · 12:30–2"],
                        ] as [State["pickupSlot"], string][]
                      ).map(([id, label]) => {
                        const sel = state.pickupSlot === id;
                        return (
                          <button
                            key={id}
                            onClick={() =>
                              dispatch({ type: "SET_SLOT", slot: id })
                            }
                            style={{
                              appearance: "none",
                              cursor: "pointer",
                              padding: "8px 14px",
                              borderRadius: 999,
                              border: `1px solid ${sel ? "var(--ink)" : "var(--line)"}`,
                              background: sel ? "var(--ink)" : "transparent",
                              color: sel ? "var(--paper)" : "var(--ink)",
                              fontSize: 13,
                              fontWeight: 500,
                              fontFamily: "inherit",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Your info */}
              <div style={{ marginTop: 36 }}>
                <Step n="4" title="Your info" />
                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      padding: "12px 14px",
                      background: "var(--paper)",
                      border: "0.5px solid var(--line)",
                      borderRadius: 12,
                      fontFamily: "inherit",
                      fontSize: 14,
                      color: "var(--ink)",
                      outline: "none",
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 140,
                      padding: "12px 14px",
                      background: "var(--paper)",
                      border: "0.5px solid var(--line)",
                      borderRadius: 12,
                      fontFamily: "inherit",
                      fontSize: 14,
                      color: "var(--ink)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Step 5: Note */}
              <div style={{ marginTop: 36 }}>
                <Step n="5" title="Anything else?" />
                <textarea
                  value={state.note}
                  onChange={(e) =>
                    dispatch({ type: "SET_NOTE", note: e.target.value })
                  }
                  placeholder="Allergies, gift note, sub the raisins for chocolate, etc."
                  rows={2}
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: "12px 14px",
                    background: "var(--paper)",
                    border: "0.5px solid var(--line)",
                    borderRadius: 12,
                    fontFamily: "inherit",
                    fontSize: 14,
                    color: "var(--ink)",
                    resize: "vertical",
                    outline: "none",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--ink)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
                />
              </div>
            </div>

            {/* RIGHT: Sticky summary */}
            <aside className="order-aside" style={{ position: "sticky", top: 88 }}>
              <div
                style={{
                  background: "var(--ink)",
                  color: "var(--paper)",
                  borderRadius: 22,
                  padding: 28,
                  boxShadow: "0 24px 60px -30px rgba(40,25,10,0.55)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-caprasimo), serif",
                      fontSize: 28,
                      color: "var(--paper)",
                    }}
                  >
                    Your box
                  </h3>
                  <div
                    style={{
                      fontSize: 13,
                      color: "color-mix(in oklch, var(--paper), transparent 40%)",
                    }}
                  >
                    {flavorCount} flavors
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    minHeight: 80,
                  }}
                >
                  {Object.keys(state.counts).length === 0 ? (
                    <div
                      style={{
                        color: "color-mix(in oklch, var(--paper), transparent 50%)",
                        fontSize: 14,
                        fontStyle: "italic",
                      }}
                    >
                      your box is empty — start picking ↘
                    </div>
                  ) : (
                    Object.entries(state.counts).map(([id, qty]) => {
                      const c = COOKIES.find((c) => c.id === id);
                      if (!c) return null;
                      return (
                        <div
                          key={id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            fontSize: 14,
                            paddingBottom: 8,
                            borderBottom:
                              "0.5px dashed color-mix(in oklch, var(--paper), transparent 80%)",
                          }}
                        >
                          <span>
                            <span
                              style={{
                                display: "inline-block",
                                width: 22,
                                color:
                                  "color-mix(in oklch, var(--paper), transparent 30%)",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              ×{qty}
                            </span>
                            {c.name}
                          </span>
                          <span
                            style={{
                              color:
                                "color-mix(in oklch, var(--paper), transparent 30%)",
                            }}
                          >
                            ${(c.price * qty).toFixed(2)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop:
                      "0.5px solid color-mix(in oklch, var(--paper), transparent 70%)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    fontSize: 14,
                    color: "color-mix(in oklch, var(--paper), transparent 30%)",
                  }}
                >
                  <SummaryRow
                    label="Cookies"
                    value={`$${cookieSubtotal.toFixed(2)}`}
                  />
                  {bulkAdjust !== 0 && (
                    <SummaryRow
                      label={`Bulk discount (${box.label})`}
                      value={`-$${Math.abs(bulkAdjust).toFixed(2)}`}
                      accent
                    />
                  )}
                  <SummaryRow
                    label={
                      state.delivery === "delivery"
                        ? "Local delivery"
                        : "Porch pickup"
                    }
                    value={
                      state.delivery === "delivery"
                        ? `$${DELIVERY_FEE.toFixed(2)}`
                        : "Free"
                    }
                  />
                </div>

                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop:
                      "0.5px solid color-mix(in oklch, var(--paper), transparent 70%)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ fontSize: 16 }}>Total</span>
                  <span
                    style={{
                      fontFamily: "var(--font-caprasimo), serif",
                      fontSize: 36,
                      color: "var(--paper)",
                    }}
                  >
                    ${total.toFixed(2)}
                  </span>
                </div>

                <button
                  disabled={!canCheckout || placing}
                  onClick={handlePlace}
                  style={{
                    marginTop: 20,
                    width: "100%",
                    appearance: "none",
                    border: 0,
                    cursor: canCheckout && !placing ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: 16,
                    padding: "16px",
                    borderRadius: 14,
                    background: canCheckout
                      ? "var(--terracotta)"
                      : "color-mix(in oklch, var(--paper), transparent 80%)",
                    color: canCheckout
                      ? "var(--paper)"
                      : "color-mix(in oklch, var(--paper), transparent 50%)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {placing
                    ? "Sending…"
                    : totalCount < box.count
                    ? `Add ${remaining} more cookie${remaining === 1 ? "" : "s"}`
                    : !customerName || !customerPhone
                    ? "Add your name & phone above"
                    : "Place order →"}
                </button>

                {placeError && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      background: "rgba(255, 100, 80, 0.15)",
                      border: "0.5px solid var(--terracotta)",
                      borderRadius: 10,
                      color: "var(--paper)",
                      fontSize: 13,
                      lineHeight: 1.4,
                      textAlign: "center",
                    }}
                  >
                    {placeError}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 14,
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: "color-mix(in oklch, var(--paper), transparent 45%)",
                    textAlign: "center",
                  }}
                >
                  You&apos;ll get a text from Ish to confirm pickup/delivery.
                  <br />
                  No payment taken until then.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 920px) {
          .order-grid {
            grid-template-columns: 1fr !important;
          }
          .order-aside {
            position: static !important;
          }
        }
      `}</style>
    </>
  );
}
