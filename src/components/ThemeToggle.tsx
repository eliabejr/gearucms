import { useEffect, useState } from "react"
import { Sun, Moon, Monitor } from "lucide-react"

type ThemeMode = "light" | "dark" | "auto"

function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") return "auto"
	const stored = window.localStorage.getItem("theme")
	if (stored === "light" || stored === "dark" || stored === "auto") return stored
	return "auto"
}

function applyThemeMode(mode: ThemeMode) {
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
	const resolved = mode === "auto" ? (prefersDark ? "dark" : "light") : mode

	document.documentElement.classList.remove("light", "dark")
	document.documentElement.classList.add(resolved)

	if (mode === "auto") {
		document.documentElement.removeAttribute("data-theme")
	} else {
		document.documentElement.setAttribute("data-theme", mode)
	}

	document.documentElement.style.colorScheme = resolved
}

const icons = { light: Sun, dark: Moon, auto: Monitor } as const
const labels = { light: "Light", dark: "Dark", auto: "System" } as const

export default function ThemeToggle() {
	const [mode, setMode] = useState<ThemeMode>("auto")

	useEffect(() => {
		const initial = getInitialMode()
		setMode(initial)
		applyThemeMode(initial)
	}, [])

	useEffect(() => {
		if (mode !== "auto") return
		const media = window.matchMedia("(prefers-color-scheme: dark)")
		const onChange = () => applyThemeMode("auto")
		media.addEventListener("change", onChange)
		return () => media.removeEventListener("change", onChange)
	}, [mode])

	function cycleMode() {
		const next: ThemeMode =
			mode === "auto" ? "light" : mode === "light" ? "dark" : "auto"
		setMode(next)
		applyThemeMode(next)
		window.localStorage.setItem("theme", next)
	}

	const Icon = icons[mode]

	return (
		<button
			type="button"
			onClick={cycleMode}
			aria-label={`Theme: ${labels[mode]}. Click to switch.`}
			title={`Theme: ${labels[mode]}`}
			className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--sea-ink-soft)] transition hover:bg-[var(--foam)] hover:text-[var(--sea-ink)]"
		>
			<Icon size={18} />
			{labels[mode]}
		</button>
	)
}
