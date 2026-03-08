import { useTheme } from '../../context/ThemeContext'

export default function HouseIllustration() {
    const { dark } = useTheme()

    return (
        <div className="w-full max-w-lg">
            <img
                src={dark ? '/city-dark-bg.png' : '/city-light.png'}
                alt="City skyline illustration"
                className="w-full block"
                width={1024}
                height={576}
                loading="eager"
                decoding="async"
            />
        </div>
    )
}
