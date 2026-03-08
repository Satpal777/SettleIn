// Landing page shared types

export interface NavLink {
    label: string
    href: string
}

export interface Feature {
    icon: string
    title: string
    description: string
}

export interface Step {
    number: number
    title: string
    description: string
}

export interface Testimonial {
    avatar: string
    name: string
    role: string
    quote: string
}
