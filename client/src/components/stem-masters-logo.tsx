interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function StemMastersLogo({ className = "", size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  }

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative">
        <svg viewBox="0 0 120 120" className={`${sizeClasses[size]} w-auto`} aria-label="STEM Masters Logo">
          {/* Hexagon base */}
          <path d="M60 10L110 40V90L60 120L10 90V40L60 10Z" className="fill-primary/10 stroke-primary stroke-2" />

          {/* Science (Atom) - Top */}
          <g transform="translate(60, 40) scale(0.6)">
            <circle cx="0" cy="0" r="10" className="fill-white dark:fill-slate-800 stroke-primary stroke-2" />
            <ellipse
              cx="0"
              cy="0"
              rx="25"
              ry="10"
              className="fill-none stroke-primary stroke-2"
              transform="rotate(0)"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="25"
              ry="10"
              className="fill-none stroke-primary stroke-2"
              transform="rotate(60)"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="25"
              ry="10"
              className="fill-none stroke-primary stroke-2"
              transform="rotate(120)"
            />
          </g>

          {/* Technology (Circuit) - Right */}
          <g transform="translate(85, 70) scale(0.5)">
            <path d="M-20,-20 L20,20 M-20,20 L20,-20" className="stroke-primary stroke-3 stroke-linecap-round" />
            <circle cx="-20" cy="-20" r="5" className="fill-white dark:fill-slate-800 stroke-primary stroke-2" />
            <circle cx="20" cy="-20" r="5" className="fill-white dark:fill-slate-800 stroke-primary stroke-2" />
            <circle cx="-20" cy="20" r="5" className="fill-white dark:fill-slate-800 stroke-primary stroke-2" />
            <circle cx="20" cy="20" r="5" className="fill-white dark:fill-slate-800 stroke-primary stroke-2" />
          </g>

          {/* Engineering (Gear) - Bottom */}
          <g transform="translate(60, 90) scale(0.5)">
            <circle cx="0" cy="0" r="15" className="fill-white dark:fill-slate-800 stroke-primary stroke-2" />
            <path
              d="M0,-25 L0,-18 M18,-18 L13,-13 M25,0 L18,0 M18,18 L13,13 M0,25 L0,18 M-18,18 L-13,13 M-25,0 L-18,0 M-18,-18 L-13,-13"
              className="stroke-primary stroke-3 stroke-linecap-round"
            />
          </g>

          {/* Math (Ruler) - Left */}
          <g transform="translate(35, 70) scale(0.5)">
            <rect
              x="-15"
              y="-20"
              width="30"
              height="40"
              rx="2"
              className="fill-white dark:fill-slate-800 stroke-primary stroke-2"
            />
            <path
              d="M-10,-15 L10,-15 M-10,-5 L0,-5 M-10,5 L10,5 M-10,15 L0,15"
              className="stroke-primary stroke-2 stroke-linecap-round"
            />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="ml-3">
          <h1 className="font-bold tracking-tight text-slate-800 dark:text-white">
            <span className="text-primary">STEM</span> Masters
          </h1>
        </div>
      )}
    </div>
  )
}
