import type { CharacterId, LocationId } from "@/lib/narrative";
export function Portrait({ id }: { id: CharacterId | "nora" | "narrator" }) {
  const weber = id === "weber",
    milo = id === "milo",
    lena = id === "lena";
  return (
    <svg
      viewBox="0 0 110 120"
      role="img"
      aria-label={id === "narrator" ? "Detective notebook" : `${id} portrait`}
      className="portrait"
    >
      <rect
        width="110"
        height="120"
        rx="9"
        fill={weber ? "#394a4e" : milo ? "#4a4059" : "#3f5756"}
      />
      {id === "narrator" ? (
        <>
          <rect x="27" y="21" width="58" height="79" rx="3" fill="#dbc599" />
          <path
            d="M36 21v79M45 40h28m-28 12h22m-22 12h28m-28 12h18"
            stroke="#6e6251"
            strokeWidth="3"
          />
          <path d="M64 87l22-38 5 3-22 38-6 2Z" fill="#ae8056" />
        </>
      ) : (
        <>
          <path
            d="M8 120q0-42 47-42t47 42"
            fill={
              weber
                ? "#6b7765"
                : milo
                  ? "#ad7f52"
                  : lena
                    ? "#b67564"
                    : "#7d9d96"
            }
          />
          <path d="M39 76v20l16 9 17-9V76" fill="#b58064" />
          <ellipse
            cx="55"
            cy="52"
            rx="28"
            ry="34"
            fill={weber ? "#c79774" : milo ? "#b37d60" : "#d5a17d"}
          />
          <path
            d={
              lena
                ? "M24 75V35Q26 5 57 11q32 0 30 32v35L74 69V30L50 36 34 27v48Z"
                : milo
                  ? "M24 49Q16 13 54 8q39-3 34 41L74 27 52 34 37 25 30 51Z"
                  : "M24 43q-5-34 30-34 37 0 34 34L75 24H37L29 47Z"
            }
            fill={weber ? "#87908a" : lena ? "#423138" : "#282936"}
          />
          {weber && (
            <>
              <path d="M23 23q33-26 65 0v7H23Z" fill="#536561" />
              <path
                d="M33 49h17v11H33Zm27 0h17v11H60Zm-10 3h10"
                stroke="#3b4540"
                strokeWidth="2"
                fill="none"
              />
              <path d="M42 70q14-12 27 0" fill="#8d9180" />
            </>
          )}
          <path
            d="M39 52h5m23 0h5"
            stroke="#3b3534"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={weber ? "M47 78h17" : "M45 73q11 7 22-1"}
            stroke="#764c43"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          {lena && (
            <path
              d="M25 66q-8 13 1 16m58-17q8 12-1 16"
              stroke="#dcb667"
              strokeWidth="3"
              fill="none"
            />
          )}
          {milo && (
            <path
              d="M28 47q-10-7-11 8v18h10m56-26q10-7 11 8v18H84"
              stroke="#b8aa89"
              fill="none"
              strokeWidth="5"
            />
          )}
          <path d="M28 91l17 28m37-28-16 28" stroke="#253941" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}
function Person({
  x,
  y,
  color,
  hat = false,
}: {
  x: number;
  y: number;
  color: string;
  hat?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="119" rx="30" ry="8" fill="#09111c" opacity=".5" />
      <path d="M-13 68l-6 48h12l8-40 9 40h13l-9-48" fill="#26323c" />
      <path d="M-24 70l4-40Q0 15 20 30l5 40Z" fill={color} />
      <path
        d="M-21 36l-12 34m53-34 13 34"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <ellipse cx="0" cy="9" rx="14" ry="18" fill="#b98c6e" />
      <path
        d="M-15 5q-4-27 15-25 23 0 16 25L7-9-6-2Z"
        fill={hat ? "#7e8b80" : "#32313b"}
      />
      {hat && <path d="M-20-9q20-16 40 0v5h-40Z" fill="#647c74" />}
      <path d="M-7 10h2m10 0h2" stroke="#2e3335" strokeWidth="2" />
    </g>
  );
}
export function Facade() {
  return (
    <svg
      className="facade-art"
      viewBox="0 0 900 780"
      role="img"
      aria-label="Rain falls on a Berlin apartment building with warm windows just before midnight"
    >
      <defs>
        <linearGradient id="night" x2="0" y2="1">
          <stop stopColor="#171d34" />
          <stop offset="1" stopColor="#36424c" />
        </linearGradient>
        <linearGradient id="brick" x2="0" y2="1">
          <stop stopColor="#536365" />
          <stop offset="1" stopColor="#2c404a" />
        </linearGradient>
        <radialGradient id="windowGlow">
          <stop stopColor="#e7b56e" stopOpacity=".45" />
          <stop offset="1" stopColor="#e7b56e" stopOpacity="0" />
        </radialGradient>
        <pattern
          id="brickwork"
          width="48"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 0h48M24 0v13M0 13h48M0 13v13m48-13v13"
            stroke="#c4bd9a"
            opacity=".08"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="900" height="780" fill="url(#night)" />
      <circle cx="690" cy="110" r="47" fill="#d7d1b2" opacity=".75" />
      <path
        d="M0 350h50V190h56v70h55V135h72v175h58V230h55v110h223V170h55v70h56V130h80v105h80V190h60v590H0Z"
        fill="#142333"
      />
      <g className="building">
        <path d="M135 212L455 77 774 212Z" fill="#263741" />
        <path d="M170 207h570v539H170Z" fill="url(#brick)" />
        <path d="M170 207h570v539H170Z" fill="url(#brickwork)" />
        <path d="M151 207h608v21H151Z" fill="#71807a" />
        <path d="M193 212v508m523-508v508" stroke="#73817c" strokeWidth="11" />
        <path d="M214 165h484" stroke="#6a7b78" strokeWidth="9" />
        {[0, 1, 2, 3].map((row) => (
          <g key={row}>
            <path
              d={`M170 ${262 + row * 111}h570`}
              stroke="#72817b"
              strokeWidth="8"
            />
            {[0, 1, 2, 3, 4].map((col) => {
              const lit = (row + col) % 3 !== 0;
              return (
                <g key={col}>
                  <rect
                    x={222 + col * 96}
                    y={284 + row * 111}
                    width="54"
                    height="76"
                    fill="#1a2937"
                    stroke="#80908a"
                    strokeWidth="5"
                  />
                  {lit && (
                    <>
                      <ellipse
                        cx={249 + col * 96}
                        cy={322 + row * 111}
                        rx="50"
                        ry="67"
                        fill="url(#windowGlow)"
                      />
                      <rect
                        className={row === 1 && col === 2 ? "flicker" : ""}
                        x={226 + col * 96}
                        y={288 + row * 111}
                        width="46"
                        height="68"
                        fill={(row + col) % 2 ? "#e4bd7d" : "#b48f67"}
                      />
                    </>
                  )}
                  <path
                    d={`M${249 + col * 96} ${285 + row * 111}v72m-26-35h52`}
                    stroke="#4b514d"
                    strokeWidth="4"
                  />
                  <path
                    d={`M${214 + col * 96} ${365 + row * 111}h70`}
                    stroke="#92917b"
                    strokeWidth="6"
                  />
                </g>
              );
            })}
          </g>
        ))}
        <path
          d="M409 745V638q46-57 92 0v107Z"
          fill="#162b36"
          stroke="#9a9b81"
          strokeWidth="8"
        />
        <path d="M455 617v128m-43-88h85" stroke="#4a6666" strokeWidth="4" />
        <circle cx="467" cy="695" r="4" fill="#dfc087" />
        <rect x="391" y="573" width="127" height="23" fill="#d4ba82" />
        <text
          x="455"
          y="589"
          textAnchor="middle"
          fontFamily="monospace"
          fontSize="11"
          fill="#34474a"
        >
          ORANIENSTRASSE 17
        </text>
        <path d="M143 746h624v14H143Z" fill="#889187" />
      </g>
      <path d="M0 760Q400 716 900 761v19H0Z" fill="#1c303e" />
      <path
        d="M270 770h95m170 0h108"
        stroke="#a99e77"
        strokeWidth="3"
        opacity=".45"
      />
      <g className="rain">
        {Array.from({ length: 35 }, (_, i) => (
          <path
            key={i}
            d={`M${(i * 137) % 900} ${(i * 79) % 760}l-9 29`}
            stroke="#b2c7c9"
            strokeWidth="1"
            opacity=".19"
          />
        ))}
      </g>
    </svg>
  );
}
export function Room({
  location,
  rescued,
  painting,
}: {
  location: LocationId;
  rescued: boolean;
  painting: boolean;
}) {
  return (
    <svg
      viewBox="0 0 1100 610"
      className="room-art"
      role="img"
      aria-label={
        location === "hallway"
          ? "The illustrated apartment hallway with missing painting, doors and flickering lamps"
          : location === "office"
            ? "Weber’s office, with a cluttered desk, photograph and key cabinet"
            : "A basement with a covered canvas, recording player and jammed archive door"
      }
    >
      <defs>
        <linearGradient id="wall" x2="0" y2="1">
          <stop stopColor={location === "basement" ? "#253d45" : "#4a4a50"} />
          <stop offset="1" stopColor="#273846" />
        </linearGradient>
        <linearGradient id="floor" x2="0" y2="1">
          <stop stopColor="#3d464a" />
          <stop offset="1" stopColor="#192a36" />
        </linearGradient>
        <radialGradient id="lamp">
          <stop stopColor="#f5cf8c" stopOpacity=".52" />
          <stop offset="1" stopColor="#f5cf8c" stopOpacity="0" />
        </radialGradient>
        <pattern
          id="wallpaper"
          width="45"
          height="42"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M22 3l10 17-10 18-10-18Z"
            stroke="#b6b39d"
            opacity=".06"
            fill="none"
          />
        </pattern>
        <pattern
          id="planks"
          width="130"
          height="40"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-25)"
        >
          <rect
            width="130"
            height="40"
            fill="none"
            stroke="#9b9681"
            strokeOpacity=".12"
          />
        </pattern>
      </defs>
      <rect width="1100" height="610" fill="#172737" />
      <rect x="35" y="25" width="1030" height="415" fill="url(#wall)" />
      <rect x="35" y="25" width="1030" height="415" fill="url(#wallpaper)" />
      <path d="M0 0l35 25v415L0 610M1100 0l-35 25v415l35 170" fill="#1c2b3a" />
      <path d="M0 610l35-170h1030l35 170Z" fill="url(#floor)" />
      <path d="M0 610l35-170h1030l35 170Z" fill="url(#planks)" />
      <path
        d="M35 432h1030M35 443h1030M35 82h1030"
        stroke="#798076"
        strokeWidth="6"
        opacity=".55"
      />
      {location === "hallway" && (
        <>
          <path
            d="M48 439V192h113v247"
            fill="#1e313c"
            stroke="#85816e"
            strokeWidth="9"
          />
          <path d="M67 208h73v175H67Z" fill="#2f454b" stroke="#586a65" />
          <rect x="77" y="261" width="54" height="14" fill="#ac9b73" />
          <text
            x="104"
            y="272"
            fill="#283b41"
            textAnchor="middle"
            fontSize="9"
            fontFamily="monospace"
          >
            KELLER
          </text>
          <circle cx="140" cy="338" r="4" fill="#d7b578" />
          <rect
            x="177"
            y="175"
            width="132"
            height="178"
            fill="#394840"
            stroke="#9c8c6b"
            strokeWidth="9"
          />
          <path
            d="M194 193h44v57h-44Zm55 10h41v77h-41Zm-52 60h43v70h-43Zm51 30h39v41h-39Z"
            fill="#bcb08b"
          />
          <path
            d="M201 209h28m-28 10h24m26 90h25"
            stroke="#746953"
            strokeWidth="2"
          />
          <rect
            x="390"
            y="153"
            width="245"
            height="144"
            fill="#233640"
            stroke="#5b615a"
            strokeWidth="2"
          />
          <path d="M400 142l9-5m206 5-9-5" stroke="#c6af80" strokeWidth="3" />
          <path
            d="M425 151q12 65 2 141m152-141q-9 78-3 141"
            stroke="#657d7c"
            opacity=".3"
            strokeWidth="9"
          />
          <path d="M643 324l42-3 3 53-40 4Z" fill="#dbcda9" />
          <path
            d="M651 338l24-2m-22 10 21-2m-20 11 16-1"
            stroke="#827e66"
            strokeWidth="2"
          />
          <path
            d="M757 438V166q52-15 102 0v272Z"
            fill="#34434a"
            stroke="#8c826f"
            strokeWidth="8"
          />
          <path
            d="M775 190h65v97h-65Zm0 120h65v97h-65Z"
            fill="#293b44"
            stroke="#61706b"
            strokeWidth="2"
          />
          <circle cx="838" cy="300" r="4" fill="#d7b578" />
          <rect x="795" y="166" width="28" height="15" rx="3" fill="#a69571" />
          <text
            x="809"
            y="178"
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="11"
            fill="#263b42"
          >
            04
          </text>
          <circle
            cx="974"
            cy="140"
            r="35"
            fill="#d2c5a2"
            stroke="#747c73"
            strokeWidth="6"
          />
          <path
            d="M974 115v25l-18 10"
            stroke="#32434a"
            strokeWidth="3"
            fill="none"
          />
          <circle cx="974" cy="140" r="3" fill="#344752" />
          <Person x={335} y={321} color="#aa7367" />
          <Person x={712} y={331} color="#95806c" />
          <g className="flicker">
            <ellipse cx="522" cy="90" rx="230" ry="151" fill="url(#lamp)" />
            <path d="M501 87h42l-6-18h-30Z" fill="#ead7a0" />
            <path d="M522 25v44" stroke="#9da58d" strokeWidth="3" />
          </g>
          <path
            d="M880 370h140m-130-12v40m120-40v40"
            stroke="#6f807a"
            strokeWidth="7"
          />
          <path d="M888 365h126" stroke="#a6a48c" strokeWidth="9" />
        </>
      )}
      {location === "office" && (
        <>
          <rect
            x="60"
            y="130"
            width="132"
            height="213"
            fill="#1a303d"
            stroke="#7c887e"
            strokeWidth="8"
          />
          <path d="M126 132v209M60 228h133" stroke="#6c8178" strokeWidth="5" />
          <path
            d="M80 151l-9 33m80 59-15 52m-17-126-9 30"
            stroke="#91a5a0"
            opacity=".4"
          />
          <rect
            x="208"
            y="142"
            width="93"
            height="88"
            fill="#bc9e72"
            stroke="#75684f"
            strokeWidth="8"
          />
          <rect x="217" y="151" width="75" height="70" fill="#657469" />
          <circle cx="241" cy="175" r="9" fill="#c4b08b" />
          <circle cx="266" cy="178" r="9" fill="#c4b08b" />
          <path d="M228 216v-25h26v25m0 0v-22h28v22" fill="#8a8672" />
          <rect
            x="716"
            y="115"
            width="218"
            height="156"
            fill="#304b50"
            stroke="#8a8e76"
            strokeWidth="7"
          />
          {Array.from({ length: 12 }, (_, i) => (
            <g key={i}>
              <circle
                cx={741 + (i % 6) * 33}
                cy={148 + Math.floor(i / 6) * 64}
                r="6"
                fill="none"
                stroke="#c4b27a"
                strokeWidth="3"
              />
              <path
                d={`M${741 + (i % 6) * 33} ${154 + Math.floor(i / 6) * 64}v20l6-4m-6-2h5`}
                stroke="#c4b27a"
                strokeWidth="3"
                fill="none"
              />
            </g>
          ))}
          <path d="M212 363h517l47 38H177Z" fill="#92795a" />
          <path d="M191 403h558v99H191Z" fill="#645b4f" />
          <path
            d="M215 410h210v75H215Zm232 0h270v75H447Z"
            fill="none"
            stroke="#a28d68"
            strokeWidth="3"
          />
          <path d="M239 502v57m480-57v57" stroke="#484b46" strokeWidth="18" />
          <path d="M444 362l82-6 37 28-82 9Z" fill="#d6c59b" />
          <path
            d="M468 366l49-3m-39 9 49-4m-36 11 45-4"
            stroke="#7c7a62"
            strokeWidth="2"
          />
          <ellipse cx="342" cy="374" rx="23" ry="8" fill="#9b9a7d" />
          <path d="M326 345v27q17 12 31 0v-27Z" fill="#718c85" />
          <path
            d="M355 347q24-4 4 20"
            fill="none"
            stroke="#718c85"
            strokeWidth="5"
          />
          <Person x={631} y={272} color="#6a7b6a" hat />
          <path
            d="M882 331h135v82H882Z"
            fill="#746b58"
            stroke="#a79570"
            strokeWidth="4"
          />
          <rect x="894" y="341" width="79" height="43" rx="4" fill="#273f43" />
          <path
            d="M904 352h58m-58 9h58m-58 9h58"
            stroke="#60756a"
            strokeWidth="3"
          />
          <circle cx="995" cy="357" r="10" fill="#bcb084" />
          <path d="M978 330l18-56" stroke="#b0b59d" strokeWidth="2" />
          <path
            d="M396 342v-87l34-19"
            fill="none"
            stroke="#9aab8a"
            strokeWidth="8"
          />
          <path d="M414 240l-26 20h60Z" fill="#d4bf7e" />
          <ellipse cx="425" cy="293" rx="129" ry="100" fill="url(#lamp)" />
          <text
            x="529"
            y="118"
            fill="#b8b99b"
            fontFamily="monospace"
            fontSize="11"
            letterSpacing="3"
          >
            ORDNUNG MUSS SEIN.
          </text>
        </>
      )}
      {location === "basement" && (
        <>
          <path
            d="M35 80h1030m-880 0v70h370v-70m331 0v141"
            stroke="#637b77"
            strokeWidth="15"
            fill="none"
          />
          <path d="M35 80h1030" stroke="#94a48a" strokeWidth="3" />
          <rect
            x="103"
            y="142"
            width="175"
            height="236"
            fill="#243b43"
            stroke="#ac9568"
            strokeWidth="12"
          />
          <path
            d="M119 159l144 201m-144 0 144-201"
            stroke="#84785a"
            strokeWidth="4"
          />
          <path
            d="M150 437l8-148 65-87 121 13 57 226Z"
            fill={painting ? "#667e8b" : "#577c86"}
            stroke="#78999c"
            strokeWidth="3"
          />
          <path
            d="M158 288q77 27 163-72m-119 82 13 139m52-147 9 151m43-144 34 140"
            stroke="#9fb4ad"
            opacity=".4"
            strokeWidth="3"
          />
          {painting && (
            <g>
              <rect x="220" y="252" width="124" height="117" fill="#b5965c" />
              <rect x="230" y="262" width="104" height="97" fill="#334d61" />
              <circle cx="303" cy="285" r="13" fill="#dfc88b" />
              <path
                d="M232 340l29-54 22 53 24-29 25 30v17H232Z"
                fill="#738b7a"
              />
            </g>
          )}
          <path d="M431 389h127v68H431Z" fill="#776e56" />
          <rect x="442" y="367" width="102" height="35" rx="4" fill="#afad87" />
          <circle cx="468" cy="384" r="11" fill="#324e52" />
          <circle cx="515" cy="384" r="11" fill="#324e52" />
          <path d="M469 384h46" stroke="#d4c79b" strokeWidth="2" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <path
                d={`M${643 + (i % 2) * 110} ${330 + Math.floor(i / 2) * 78}h103v76H${643 + (i % 2) * 110}Z`}
                fill={i % 2 ? "#625d50" : "#7a715b"}
                stroke="#9b8b69"
                strokeWidth="2"
              />
              <path
                d={`M${667 + (i % 2) * 110} ${353 + Math.floor(i / 2) * 78}h53v17h-53Z`}
                fill="#b2aa83"
              />
              <text
                x={694 + (i % 2) * 110}
                y={365 + Math.floor(i / 2) * 78}
                fill="#4c5146"
                textAnchor="middle"
                fontFamily="monospace"
                fontSize="8"
              >
                NORA · ARCHIV
              </text>
            </g>
          ))}
          <rect
            x="849"
            y="142"
            width="139"
            height="295"
            fill="#152932"
            stroke="#839489"
            strokeWidth="8"
          />
          <g className={rescued ? "open-archive" : ""}>
            <path
              d="M849 437V142h139v295Z"
              fill="#354c52"
              stroke="#839489"
              strokeWidth="6"
            />
            <path
              d="M870 163h96v186h-96Z"
              fill="#243e47"
              stroke="#596e6a"
              strokeWidth="3"
            />
            <text
              x="918"
              y="211"
              fill="#b7b89b"
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="13"
              letterSpacing="4"
            >
              ARCHIV
            </text>
          </g>
          <path
            d="M819 260v52"
            stroke="#b16e59"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="819" cy="255" r="8" fill="#d68a66" />
          {rescued && <Person x={921} y={320} color="#829e95" />}
          <ellipse cx="549" cy="161" rx="245" ry="170" fill="url(#lamp)" />
          <path d="M549 25v69" stroke="#83968b" strokeWidth="3" />
          <path d="M526 98h46l-7-18h-32Z" fill="#d9c487" />
          <path
            d="M45 476q180-26 275 6t377-5"
            stroke="#8ba7a3"
            strokeWidth="3"
            opacity=".28"
            fill="none"
          />
        </>
      )}
      <path d="M0 590h1100" stroke="#81908a" strokeOpacity=".15" />
      <text
        x="46"
        y="577"
        fill="#c7c2a0"
        opacity=".45"
        fontFamily="monospace"
        fontSize="8"
        letterSpacing="3"
      >
        ORANIENSTRASSE 17 · BERLIN · THE NIGHT REMEMBERS
      </text>
    </svg>
  );
}
