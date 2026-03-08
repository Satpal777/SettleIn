/** Sign-Up illustration — move-in checklist with a house and boxes */
export default function SignUpIllustration() {
    return (
        <svg
            viewBox="0 0 480 460"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="w-full max-w-sm mx-auto"
        >
            {/* Background circle */}
            <circle cx="240" cy="225" r="185" fill="var(--color-secondary)" opacity="0.05" />

            {/* ── House silhouette ─────────────────────────────────── */}
            {/* Walls */}
            <rect x="120" y="210" width="200" height="150" rx="4"
                fill="var(--color-background)"
                stroke="var(--color-secondary)" strokeWidth="2.5" />
            {/* Roof */}
            <polygon points="100,215 220,110 340,215"
                fill="var(--color-highlight)" opacity="0.8" />
            <polygon points="100,215 220,110 340,215"
                fill="none" stroke="var(--color-highlight)" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Door */}
            <rect x="192" y="288" width="56" height="72" rx="3"
                fill="var(--color-secondary)" opacity="0.18"
                stroke="var(--color-secondary)" strokeWidth="1.5" />
            <circle cx="238" cy="326" r="4" fill="var(--color-highlight)" opacity="0.9" />
            {/* Window */}
            <rect x="148" y="248" width="48" height="40" rx="3"
                fill="var(--color-highlight)" opacity="0.1"
                stroke="var(--color-secondary)" strokeWidth="1.5" />
            <line x1="172" y1="248" x2="172" y2="288"
                stroke="var(--color-secondary)" strokeWidth="1" opacity="0.4" />
            <line x1="148" y1="268" x2="196" y2="268"
                stroke="var(--color-secondary)" strokeWidth="1" opacity="0.4" />
            {/* Window right */}
            <rect x="244" y="248" width="48" height="40" rx="3"
                fill="var(--color-highlight)" opacity="0.1"
                stroke="var(--color-secondary)" strokeWidth="1.5" />
            <line x1="268" y1="248" x2="268" y2="288"
                stroke="var(--color-secondary)" strokeWidth="1" opacity="0.4" />
            <line x1="244" y1="268" x2="292" y2="268"
                stroke="var(--color-secondary)" strokeWidth="1" opacity="0.4" />
            {/* Ground */}
            <line x1="80" y1="360" x2="400" y2="360"
                stroke="var(--color-secondary)" strokeWidth="2" opacity="0.15" />

            {/* ── Moving boxes stacked ──────────────────────────────── */}
            {/* Box 1 (large, bottom) */}
            <rect x="340" y="300" width="72" height="60" rx="4"
                fill="var(--color-tertiary)" opacity="0.3"
                stroke="var(--color-tertiary)" strokeWidth="2" />
            <line x1="376" y1="300" x2="376" y2="360"
                stroke="var(--color-tertiary)" strokeWidth="1.5" opacity="0.5" />
            <line x1="340" y1="326" x2="412" y2="326"
                stroke="var(--color-tertiary)" strokeWidth="1.5" opacity="0.5" />
            {/* Box handle */}
            <path d="M360 314 Q376 308 392 314"
                stroke="var(--color-tertiary)" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Box 2 (small, stacked) */}
            <rect x="350" y="256" width="52" height="44" rx="4"
                fill="var(--color-tertiary)" opacity="0.2"
                stroke="var(--color-tertiary)" strokeWidth="2" />
            <line x1="376" y1="256" x2="376" y2="300"
                stroke="var(--color-tertiary)" strokeWidth="1.5" opacity="0.4" />

            {/* ── Checklist card ───────────────────────────────────── */}
            <rect x="58" y="70" width="168" height="200" rx="6"
                fill="var(--color-background)"
                stroke="var(--color-secondary)" strokeWidth="1.5" />
            {/* Card header bar */}
            <rect x="58" y="70" width="168" height="32" rx="6"
                fill="var(--color-highlight)" opacity="0.12" />
            <rect x="58" y="86" width="168" height="16" rx="0"
                fill="var(--color-highlight)" opacity="0.12" />
            <rect x="75" y="80" width="80" height="8" rx="3"
                fill="var(--color-headline)" opacity="0.5" />

            {/* Check rows */}
            {[
                { y: 122, done: true, label: 'Upload ID document' },
                { y: 152, done: true, label: 'Sign agreement' },
                { y: 182, done: true, label: 'Pay deposit' },
                { y: 212, done: false, label: 'Collect keys' },
                { y: 242, done: false, label: 'Inventory check' },
            ].map(({ y, done, label }) => (
                <g key={label}>
                    {/* Checkbox */}
                    <rect x="75" y={y - 9} width="16" height="16" rx="3"
                        fill={done ? 'var(--color-highlight)' : 'var(--color-background)'}
                        stroke={done ? 'var(--color-highlight)' : 'var(--color-secondary)'}
                        strokeWidth="1.5"
                        opacity={done ? 0.9 : 0.4} />
                    {done && (
                        <path d={`M${79} ${y} L${83} ${y + 4} L${89} ${y - 3}`}
                            stroke="var(--color-background)" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    )}
                    {/* Label line */}
                    <rect x="100" y={y - 4} width={done ? 100 : 76} height="6" rx="3"
                        fill="var(--color-paragraph)" opacity={done ? 0.25 : 0.15} />
                </g>
            ))}

            {/* Progress bar */}
            <rect x="75" y="278" width="134" height="6" rx="3"
                fill="var(--color-secondary)" opacity="0.15" />
            <rect x="75" y="278" width="88" height="6" rx="3"
                fill="var(--color-highlight)" opacity="0.7" />

            {/* ── Sparkles ─────────────────────────────────────────── */}
            <circle cx="430" cy="120" r="5" fill="var(--color-highlight)" opacity="0.4" />
            <circle cx="55" cy="380" r="4" fill="var(--color-tertiary)" opacity="0.5" />
            <circle cx="415" cy="240" r="3" fill="var(--color-secondary)" opacity="0.5" />
            <circle cx="240" cy="68" r="4" fill="var(--color-highlight)" opacity="0.35" />

            {/* Dot pattern top-right */}
            {[0, 1, 2].map(row =>
                [0, 1, 2].map(col => (
                    <circle
                        key={`d${row}-${col}`}
                        cx={390 + col * 12}
                        cy={80 + row * 12}
                        r="2"
                        fill="var(--color-secondary)"
                        opacity="0.2"
                    />
                ))
            )}
        </svg>
    )
}
