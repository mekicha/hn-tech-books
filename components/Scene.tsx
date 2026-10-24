import { StationId } from "@/lib/game";
export function Portrait({
  character,
}: {
  character: "ayo" | "deniz" | "berti";
}) {
  return (
    <svg
      viewBox="0 0 100 110"
      role="img"
      aria-label={`${character} portrait`}
      className="portrait"
    >
      <rect
        width="100"
        height="110"
        rx="16"
        fill={character === "berti" ? "#3f6380" : "#273c47"}
      />
      {character === "berti" ? (
        <>
          <rect x="19" y="13" width="62" height="86" rx="8" fill="#f0c84c" />
          <rect x="27" y="24" width="46" height="34" rx="3" fill="#173638" />
          <path d="M34 38h8m15 0h8M40 49h20" stroke="#a9f4c9" strokeWidth="4" />
          <rect x="29" y="68" width="23" height="5" fill="#293a41" />
          <circle cx="66" cy="73" r="7" fill="#ef794f" />
          <path d="M31 90h38" stroke="#394c58" strokeWidth="5" />
        </>
      ) : (
        <>
          <path
            d="M9 110q1-39 41-39t41 39"
            fill={character === "ayo" ? "#d9a734" : "#d26855"}
          />
          <path d="M35 73v18l15 10 16-10V72" fill="#b97958" />
          <ellipse
            cx="50"
            cy="48"
            rx="27"
            ry="34"
            fill={character === "ayo" ? "#9c644e" : "#cb9372"}
          />
          <path
            d="M23 43q-9-34 28-33 34 0 28 35l-10-23-19 9-23-2"
            fill="#19272d"
          />
          <path
            d="M26 24q20-27 49 0"
            fill="none"
            stroke={character === "ayo" ? "#e8b93b" : "#3d7779"}
            strokeWidth="14"
          />
          <path
            d="M36 48h5m19 0h5"
            stroke="#202d31"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M41 65q10 8 20-2"
            fill="none"
            stroke="#4f3533"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {character === "deniz" && (
            <path d="M34 60q17-17 33 0-16-5-33 0" fill="#283139" />
          )}
          <path
            d="M18 109l11-21m54 21L71 88"
            stroke="#273a3d"
            strokeWidth="5"
          />
          {character === "ayo" && (
            <path d="M45 101h14" stroke="#fff0c0" strokeWidth="3" />
          )}
        </>
      )}
    </svg>
  );
}
export default function Scene({
  station,
  ended,
}: {
  station: StationId;
  ended: boolean;
}) {
  const kiosk = station === "kotti",
    alex = station === "alex";
  return (
    <svg
      className="station-art"
      viewBox="0 0 980 390"
      role="img"
      aria-label={
        kiosk
          ? "Deniz’s warmly lit kiosk at Kottbusser Tor"
          : alex
            ? "BERTI beside the lost property lockers at Alexanderplatz"
            : "A yellow train beneath Berlin’s night sky"
      }
    >
      <defs>
        <linearGradient id="sky" x2="0" y2="1">
          <stop stopColor="#172530" />
          <stop offset="1" stopColor="#34414b" />
        </linearGradient>
        <linearGradient id="floor" x2="0" y2="1">
          <stop stopColor="#28363e" />
          <stop offset="1" stopColor="#141f28" />
        </linearGradient>
        <radialGradient id="glow">
          <stop stopColor="#f6cf65" stopOpacity=".35" />
          <stop offset="1" stopColor="#f6cf65" stopOpacity="0" />
        </radialGradient>
        <pattern
          id="tiles"
          width="72"
          height="44"
          patternUnits="userSpaceOnUse"
        >
          <rect width="72" height="44" fill="#293f48" />
          <path d="M0 0H72V44H0Z" stroke="#3d545c" strokeWidth="1" />
        </pattern>
        <linearGradient id="train" x2="0" y2="1">
          <stop stopColor="#f8d367" />
          <stop offset="1" stopColor="#c18d2c" />
        </linearGradient>
      </defs>
      <rect width="980" height="390" fill="url(#sky)" />
      {!kiosk && !alex && (
        <>
          <circle cx="760" cy="48" r="25" fill="#d9e4d6" opacity=".7" />
          <path
            d="M0 100h70V70h45v45h55V62h78v55h65V83h55v28h100V90h67v22h73V66h62v44h71V90h70v30h149v65H0Z"
            fill="#15252e"
          />
          <path
            d="M880 12v109m-12-60h24m-26 9h28m-14-52v25"
            stroke="#89949a"
            strokeWidth="2"
          />
          <ellipse cx="880" cy="62" rx="11" ry="8" fill="#586b78" />
        </>
      )}
      {(kiosk || alex) && (
        <>
          <rect x="0" y="45" width="980" height="233" fill="url(#tiles)" />
          <path d="M0 40h980M0 269h980" stroke="#5a6264" strokeWidth="8" />
          <rect x="600" y="74" width="285" height="37" rx="3" fill="#122c43" />
          <text
            x="742"
            y="99"
            textAnchor="middle"
            fill="#e8efef"
            fontSize="20"
            fontFamily="monospace"
          >
            {kiosk ? "Kottbusser Tor" : "Alexanderplatz"}
          </text>
        </>
      )}
      <rect y="277" width="980" height="113" fill="url(#floor)" />
      <path d="M0 313h980M0 322h980" stroke="#d0b75b" strokeWidth="3" />
      <path d="M0 375h980" stroke="#71808a" strokeWidth="3" />
      <path d="M0 354h980" stroke="#090f17" strokeWidth="18" />
      {!kiosk && !alex && (
        <g className="scene-train">
          <rect
            x="-40"
            y="137"
            width="1060"
            height="145"
            rx="14"
            fill="url(#train)"
          />
          <rect x="-40" y="149" width="1060" height="9" fill="#f9e19c" />
          {[15, 172, 329, 486, 643, 800].map((x) => (
            <g key={x}>
              <rect
                x={x}
                y="166"
                width="103"
                height="64"
                rx="5"
                fill="#1b343e"
              />
              <path
                d={`M${x + 8} 222l55-49h29l-55 49Z`}
                fill="#40545c"
                opacity=".5"
              />
              <rect
                x={x + 119}
                y="163"
                width="25"
                height="108"
                fill="#d7ad4d"
              />
              <path d={`M${x + 131} 166v99`} stroke="#7f6c39" />
              <circle cx={x + 45} cy="285" r="11" fill="#121e25" />
            </g>
          ))}
          <text
            x="766"
            y="251"
            fill="#4c432b"
            fontFamily="monospace"
            fontSize="14"
          >
            BERLIN · NACHTLINIE
          </text>
          <rect x="46" y="117" width="250" height="29" rx="3" fill="#142e42" />
          <text
            x="171"
            y="137"
            textAnchor="middle"
            fill="#eff1dc"
            fontFamily="monospace"
            fontSize="16"
          >
            Warschauer Straße
          </text>
        </g>
      )}
      {kiosk && (
        <>
          <ellipse cx="281" cy="195" rx="260" ry="185" fill="url(#glow)" />
          <rect x="80" y="70" width="375" height="221" fill="#18272b" />
          <rect x="87" y="79" width="361" height="40" fill="#e4b943" />
          <text
            x="268"
            y="107"
            textAnchor="middle"
            fill="#253330"
            fontSize="25"
            fontWeight="bold"
            letterSpacing="5"
          >
            SPÄTI DENIZ
          </text>
          <rect x="98" y="130" width="335" height="116" fill="#b27a47" />
          {[0, 1, 2].map((y) => (
            <g key={y}>
              <path
                d={`M100 ${164 + y * 35}h330`}
                stroke="#433f2d"
                strokeWidth="7"
              />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((x) => (
                <g key={x}>
                  <rect
                    x={111 + x * 40}
                    y={137 + y * 35}
                    width="17"
                    height="24"
                    rx="3"
                    fill={["#7caa87", "#d2b36c", "#a54d3f"][x % 3]}
                  />
                  <rect
                    x={116 + x * 40}
                    y={133 + y * 35}
                    width="7"
                    height="6"
                    fill="#253e38"
                  />
                </g>
              ))}
            </g>
          ))}
          <path d="M70 242h399v51H70Z" fill="#3e605f" />
          <text x="130" y="274" fill="#efcd7d" fontSize="18">
            MATE. MUSIK. MÖGLICHKEITEN.
          </text>
          <g transform="translate(315 154) scale(.83)">
            <PortraitDrawing />
          </g>
          <path d="M620 279v-96h146v96" fill="#1e3038" />
          <text
            x="693"
            y="215"
            textAnchor="middle"
            fill="#d5ab6d"
            fontFamily="monospace"
            fontSize="13"
          >
            HEUTE
          </text>
          <text
            x="693"
            y="245"
            textAnchor="middle"
            fill="#e9dfbd"
            fontSize="21"
          >
            KEIN STRESS.
          </text>
        </>
      )}
      {alex && (
        <>
          <rect x="80" y="105" width="333" height="180" rx="4" fill="#47515a" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <g key={i}>
              <rect
                x={88 + (i % 4) * 80}
                y={113 + Math.floor(i / 4) * 83}
                width="71"
                height="73"
                rx="2"
                fill={i === 6 && ended ? "#eed074" : "#2e3e47"}
                stroke="#6b7473"
              />
              <text
                x={100 + (i % 4) * 80}
                y={134 + Math.floor(i / 4) * 83}
                fill="#d6d4b9"
                fontSize="12"
                fontFamily="monospace"
              >
                0{i + 1}
              </text>
              <path
                d={`M${142 + (i % 4) * 80} ${148 + Math.floor(i / 4) * 83}v13`}
                stroke="#b6b098"
                strokeWidth="3"
              />
            </g>
          ))}
          <g transform="translate(555 105)">
            <rect width="115" height="177" rx="8" fill="#d8b64d" />
            <rect x="15" y="20" width="85" height="60" rx="4" fill="#173d3d" />
            <path
              d="M33 43h12m23 0h12M40 63h35"
              stroke="#a8dfb4"
              strokeWidth="5"
            />
            <rect x="20" y="96" width="39" height="6" fill="#293b42" />
            <circle cx="84" cy="107" r="12" fill="#d66a4e" />
            <path d="M23 147h70" stroke="#283c42" strokeWidth="9" />
            <text
              x="58"
              y="136"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="13"
              fill="#344648"
            >
              BERTI
            </text>
          </g>
          <text
            x="245"
            y="92"
            textAnchor="middle"
            fill="#d3d6bf"
            fontSize="14"
            letterSpacing="4"
          >
            FUNDSTELLE · LOST & FOUND
          </text>
        </>
      )}
      <path d="M0 0h980v22H0Z" fill="#0c171e" />
      {[70, 460, 903].map((x) => (
        <g key={x}>
          <rect x={x} width="14" height="305" fill="#1c3037" />
          <rect x={x + 2} y="62" width="10" height="10" fill="#c4ad61" />
          <ellipse cx={x + 7} cy="80" rx="100" ry="80" fill="url(#glow)" />
        </g>
      ))}
      <path d="M160 302h150m350 0h190" stroke="#75837d" opacity=".4" />
      <text x="32" y="367" fill="#b3c1bb" fontSize="11" letterSpacing="4">
        {ended
          ? "THE CITY KEPT YOUR SONG SAFE."
          : "SOMEWHERE BELOW BERLIN, A STORY IS WAITING."}
      </text>
    </svg>
  );
}
function PortraitDrawing() {
  return (
    <>
      <path d="M-16 106q0-57 39-57t41 57" fill="#c26d55" />
      <ellipse cx="23" cy="33" rx="25" ry="30" fill="#c58d68" />
      <path d="M-2 22q-5-33 26-31 31 1 25 32" fill="#235657" />
      <path
        d="M8 30h4m18 0h4M11 48q11 7 22-1"
        stroke="#283236"
        strokeWidth="3"
      />
      <path d="M7 42q15-13 29 0" fill="#253439" />
    </>
  );
}
