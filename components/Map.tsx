"use client";
import { GameState, nameOf, route, StationId, stations } from "@/lib/game";
export default function Map({
  state,
  selected,
  onSelect,
  traveling,
}: {
  state: GameState;
  selected: StationId;
  onSelect: (id: StationId) => void;
  traveling: boolean;
}) {
  const path = route(state.station, selected);
  const coords = (ids: StationId[]) =>
    ids
      .map((id) => {
        const s = stations.find((s) => s.id === id)!;
        return `${s.x},${s.y}`;
      })
      .join(" ");
  return (
    <div className="map-wrap">
      <svg
        viewBox="0 0 980 450"
        role="group"
        aria-label="Interactive Berlin U-Bahn map"
      >
        <defs>
          <pattern
            id="map-grid"
            width="35"
            height="35"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".7" fill="#43555c" />
          </pattern>
          <filter id="map-glow">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <rect width="980" height="450" fill="url(#map-grid)" />
        <path
          d="M0 115Q200 30 450 205T980 180"
          stroke="#234b59"
          strokeWidth="25"
          fill="none"
          opacity=".22"
        />
        <text
          x="820"
          y="192"
          fill="#45616a"
          fontSize="11"
          letterSpacing="5"
          transform="rotate(-8 820 192)"
        >
          SPREE
        </text>
        <path
          d="M340 340H805"
          stroke="#629587"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M340 340V180L420 110L510 40"
          stroke="#678dca"
          strokeWidth="8"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {path.length > 1 && (
          <polyline
            points={coords(path)}
            stroke="#f5cd66"
            strokeWidth="4"
            fill="none"
            className={traveling ? "route-travel" : "route-preview"}
            strokeLinecap="round"
          />
        )}
        <g fontFamily="monospace" fontSize="12" fontWeight="bold">
          <rect x="864" y="328" width="38" height="24" rx="5" fill="#4b8778" />
          <text x="874" y="345" fill="#f6f0d5">
            U3
          </text>
          <rect x="527" y="26" width="38" height="24" rx="5" fill="#547bb4" />
          <text x="537" y="43" fill="#edf0ea">
            U8
          </text>
        </g>
        {stations.map((s) => (
          <g
            key={s.id}
            role="button"
            tabIndex={0}
            aria-label={`Select ${s.name}`}
            aria-pressed={selected === s.id}
            onClick={() => onSelect(s.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(s.id);
              }
            }}
            className="station-node"
          >
            {state.station === s.id && (
              <circle
                cx={s.x}
                cy={s.y}
                r="20"
                fill="#f4ca65"
                opacity=".13"
                className="station-pulse"
              />
            )}
            <circle
              cx={s.x}
              cy={s.y}
              r={s.id === "kotti" ? 10 : 7}
              fill={state.station === s.id ? "#f7ce65" : "#14232c"}
              stroke={
                selected === s.id
                  ? "#ffe5a4"
                  : state.visited.includes(s.id)
                    ? "#b9c4b6"
                    : "#8ca2aa"
              }
              strokeWidth="3"
            />
            <text
              x={
                s.x +
                (s.id === "moritz" || s.id === "heinrich"
                  ? -20
                  : s.id === "jannowitz"
                    ? 24
                    : 0)
              }
              y={
                s.y +
                (s.id === "moritz" || s.id === "heinrich"
                  ? 5
                  : s.id === "jannowitz"
                    ? 5
                    : 31)
              }
              textAnchor={
                s.id === "moritz" || s.id === "heinrich"
                  ? "end"
                  : s.id === "jannowitz"
                    ? "start"
                    : "middle"
              }
              fill={selected === s.id ? "#f8d57e" : "#bfcac8"}
              fontSize={s.scene ? 15 : 13}
              fontWeight={s.scene ? 600 : 400}
            >
              {s.name}
            </text>
            {s.id === "kotti" && (
              <text
                x="340"
                y="390"
                textAnchor="middle"
                fill="#91a393"
                fontSize="10"
                letterSpacing="2"
              >
                TRANSFER · U3 / U8
              </text>
            )}
          </g>
        ))}
        {traveling && (
          <g className="travel-marker">
            <circle r="10" fill="#f9d26d">
              <animateMotion
                dur="2.2s"
                fill="freeze"
                path={path
                  .map((id, i) => {
                    const s = stations.find((s) => s.id === id)!;
                    return `${i ? "L" : "M"}${s.x},${s.y}`;
                  })
                  .join(" ")}
              />
            </circle>
          </g>
        )}
        <text x="40" y="52" fill="#657e85" fontSize="10" letterSpacing="3">
          BERLIN / NIGHT NETWORK
        </text>
        <text x="40" y="73" fill="#adc0bd" fontSize="13">
          Follow the yellow thread.
        </text>
        <text x="940" y="429" textAnchor="end" fill="#60777c" fontSize="10">
          SIMPLIFIED GAME MAP · NOT A LIVE TIMETABLE
        </text>
      </svg>
      <div className="map-key">
        <span>
          <i className="key-dot" /> You are here: {nameOf(state.station)}
        </span>
        <span>◎ 3 story stations</span>
      </div>
    </div>
  );
}
