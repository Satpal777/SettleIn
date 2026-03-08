export default function SignInIllustration() {
    return (
        <svg
            viewBox="0 0 480 440"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="w-full max-w-sm mx-auto"
        >
            <circle cx="240" cy="210" r="190" fill="var(--color-highlight)" opacity="0.06" />

            <rect x="60" y="60" width="360" height="270" rx="6"
                fill="var(--color-background)"
                stroke="var(--color-secondary)" strokeWidth="2" />

            {[110, 160, 210, 260, 310].map(x => (
                <line key={`v${x}`} x1={x} y1="60" x2={x} y2="330"
                    stroke="var(--color-secondary)" strokeWidth="0.8" opacity="0.15" />
            ))}
            {[110, 160, 210, 260, 310].map(y => (
                <line key={`h${y}`} x1="60" y1={y} x2="420" y2={y}
                    stroke="var(--color-secondary)" strokeWidth="0.8" opacity="0.15" />
            ))}

            <rect x="60" y="190" width="360" height="16" rx="2"
                fill="var(--color-secondary)" opacity="0.1" />
            <rect x="230" y="60" width="16" height="270" rx="2"
                fill="var(--color-secondary)" opacity="0.1" />

            <rect x="80" y="80" width="60" height="40" rx="3"
                fill="var(--color-secondary)" opacity="0.15"
                stroke="var(--color-secondary)" strokeWidth="1.5" />
            <rect x="95" y="130" width="40" height="30" rx="3"
                fill="var(--color-secondary)" opacity="0.1"
                stroke="var(--color-secondary)" strokeWidth="1.5" />

            <rect x="270" y="80" width="50" height="35" rx="3"
                fill="var(--color-secondary)" opacity="0.15"
                stroke="var(--color-secondary)" strokeWidth="1.5" />
            <rect x="340" y="90" width="60" height="45" rx="3"
                fill="var(--color-secondary)" opacity="0.1"
                stroke="var(--color-secondary)" strokeWidth="1.5" />

            <rect x="80" y="230" width="70" height="40" rx="3"
                fill="var(--color-secondary)" opacity="0.12"
                stroke="var(--color-secondary)" strokeWidth="1.5" />
            <rect x="270" y="225" width="55" height="50" rx="3"
                fill="var(--color-secondary)" opacity="0.15"
                stroke="var(--color-secondary)" strokeWidth="1.5" />
            <rect x="345" y="240" width="50" height="35" rx="3"
                fill="var(--color-secondary)" opacity="0.1"
                stroke="var(--color-secondary)" strokeWidth="1.5" />

            <circle cx="165" cy="275" r="20"
                fill="var(--color-highlight)" opacity="0.12"
                stroke="var(--color-highlight)" strokeWidth="1.5" />

            <g filter="url(#pinShadow)">
                <path d="M240 75 C220 75 205 90 205 110 C205 138 240 172 240 172 C240 172 275 138 275 110 C275 90 260 75 240 75 Z"
                    fill="var(--color-highlight)" />
                <circle cx="240" cy="110" r="14" fill="var(--color-background)" />
                <path d="M240 100 L231 109 H234 V118 H246 V109 H249 Z"
                    fill="var(--color-highlight)" />
            </g>
            <defs>
                <filter id="pinShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6"
                        floodColor="var(--color-highlight)" floodOpacity="0.3" />
                </filter>
            </defs>

            <rect x="100" y="344" width="280" height="42" rx="4"
                fill="var(--color-background)"
                stroke="var(--color-secondary)" strokeWidth="1.5" />
            <circle cx="126" cy="365" r="9" stroke="var(--color-paragraph)" strokeWidth="2" fill="none" opacity="0.4" />
            <line x1="132" y1="371" x2="140" y2="379"
                stroke="var(--color-paragraph)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <rect x="148" y="360" width="100" height="6" rx="3"
                fill="var(--color-paragraph)" opacity="0.15" />
            <rect x="148" y="370" width="70" height="4" rx="2"
                fill="var(--color-paragraph)" opacity="0.1" />

            <circle cx="84" cy="360" r="4" fill="var(--color-tertiary)" opacity="0.6" />
            <circle cx="400" cy="355" r="3" fill="var(--color-highlight)" opacity="0.5" />
            <circle cx="420" cy="75" r="5" fill="var(--color-tertiary)" opacity="0.4" />
            <circle cx="70" cy="350" r="2.5" fill="var(--color-secondary)" opacity="0.5" />
        </svg>
    )
}
