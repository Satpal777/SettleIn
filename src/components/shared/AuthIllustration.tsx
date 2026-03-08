/** Inline SVG illustration for auth pages — SettleIn house-key motif */
export default function AuthIllustration() {
    return (
        <svg
            viewBox="0 0 480 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="w-full max-w-sm mx-auto"
        >
            <circle cx="240" cy="240" r="220" fill="var(--color-highlight)" opacity="0.06" />
            <circle cx="240" cy="240" r="160" fill="var(--color-secondary)" opacity="0.05" />

            <rect x="130" y="230" width="220" height="160" rx="6"
                fill="var(--color-background)" stroke="var(--color-secondary)" strokeWidth="3" />

            <polygon points="110,235 240,120 370,235"
                fill="var(--color-highlight)" opacity="0.85" />
            <polygon points="110,235 240,120 370,235"
                fill="none" stroke="var(--color-highlight)" strokeWidth="3" strokeLinejoin="round" />

            <rect x="290" y="140" width="28" height="50" rx="3"
                fill="var(--color-secondary)" opacity="0.7" />

            <rect x="200" y="300" width="80" height="90" rx="4"
                fill="var(--color-secondary)" opacity="0.2"
                stroke="var(--color-secondary)" strokeWidth="2" />
            <circle cx="270" cy="348" r="5" fill="var(--color-highlight)" />

            <rect x="148" y="268" width="54" height="44" rx="4"
                fill="var(--color-highlight)" opacity="0.12"
                stroke="var(--color-secondary)" strokeWidth="2" />
            <line x1="175" y1="268" x2="175" y2="312" stroke="var(--color-secondary)" strokeWidth="1.5" opacity="0.5" />
            <line x1="148" y1="290" x2="202" y2="290" stroke="var(--color-secondary)" strokeWidth="1.5" opacity="0.5" />

            <rect x="278" y="268" width="54" height="44" rx="4"
                fill="var(--color-highlight)" opacity="0.12"
                stroke="var(--color-secondary)" strokeWidth="2" />
            <line x1="305" y1="268" x2="305" y2="312" stroke="var(--color-secondary)" strokeWidth="1.5" opacity="0.5" />
            <line x1="278" y1="290" x2="332" y2="290" stroke="var(--color-secondary)" strokeWidth="1.5" opacity="0.5" />

            <rect x="222" y="390" width="36" height="50" rx="2"
                fill="var(--color-secondary)" opacity="0.15" />

            <line x1="80" y1="390" x2="400" y2="390"
                stroke="var(--color-secondary)" strokeWidth="2" opacity="0.2" />

            <g transform="translate(338, 140) rotate(-30)">
                <circle cx="0" cy="0" r="18" stroke="var(--color-tertiary)" strokeWidth="4" fill="none" />
                <circle cx="0" cy="0" r="8" stroke="var(--color-tertiary)" strokeWidth="3" fill="none" />
                <rect x="16" y="-4" width="52" height="8" rx="3"
                    fill="var(--color-tertiary)" />
                <rect x="44" y="4" width="6" height="10" rx="2" fill="var(--color-tertiary)" />
                <rect x="58" y="4" width="6" height="14" rx="2" fill="var(--color-tertiary)" />
            </g>

            <circle cx="108" cy="180" r="4" fill="var(--color-highlight)" opacity="0.5" />
            <circle cx="380" cy="200" r="3" fill="var(--color-tertiary)" opacity="0.6" />
            <circle cx="150" cy="420" r="3" fill="var(--color-secondary)" opacity="0.4" />
            <circle cx="360" cy="400" r="5" fill="var(--color-highlight)" opacity="0.3" />

            {[0, 1, 2, 3].map(row =>
                [0, 1, 2, 3].map(col => (
                    <circle
                        key={`${row}-${col}`}
                        cx={90 + col * 14}
                        cy={410 + row * 14}
                        r="2"
                        fill="var(--color-secondary)"
                        opacity="0.2"
                    />
                ))
            )}
        </svg>
    )
}
