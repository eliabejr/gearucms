/**
 * Styled react-select wrapper matching the admin panel design system.
 *
 * Uses CSS custom properties (--sea-ink, --lagoon, --foam, --sand, --line)
 * to stay consistent with the island/ocean design tokens.
 */
import ReactSelect, {
	type Props as ReactSelectProps,
	type GroupBase,
	type StylesConfig,
	type ClassNamesConfig,
} from "react-select"

export interface SelectOption {
	value: string
	label: string
}

interface SelectProps {
	/** Currently selected value (string) */
	value?: string
	/** Callback when value changes */
	onChange: (value: string) => void
	/** Available options */
	options: SelectOption[]
	/** Placeholder text */
	placeholder?: string
	/** Is the select required? */
	required?: boolean
	/** Is the select disabled? */
	disabled?: boolean
	/** Is it clearable? */
	isClearable?: boolean
	/** Is it searchable? */
	isSearchable?: boolean
	/** HTML id for the input */
	id?: string
	/** Additional class name for the container */
	className?: string
	/** Compact size variant */
	size?: "default" | "sm"
}

/**
 * Custom styles that match the admin panel Tailwind design.
 * We use the `styles` API to hook into CSS custom properties.
 */
function getStyles(size: "default" | "sm"): StylesConfig<SelectOption, false> {
	const isSmall = size === "sm"

	return {
		control: (base, state) => ({
			...base,
			borderRadius: "0.5rem",
			borderColor: state.isFocused ? "var(--lagoon)" : "var(--line)",
			backgroundColor: "var(--foam)",
			minHeight: isSmall ? "32px" : "38px",
			fontSize: "0.875rem",
			color: "var(--sea-ink)",
			boxShadow: "none",
			transition: "border-color 150ms ease",
			cursor: "pointer",
			"&:hover": {
				borderColor: "var(--lagoon)",
			},
		}),
		valueContainer: (base) => ({
			...base,
			padding: isSmall ? "0 8px" : "2px 12px",
		}),
		input: (base) => ({
			...base,
			color: "var(--sea-ink)",
			margin: 0,
			padding: 0,
		}),
		singleValue: (base) => ({
			...base,
			color: "var(--sea-ink)",
		}),
		placeholder: (base) => ({
			...base,
			color: "var(--sea-ink-soft, #999)",
			opacity: 0.7,
		}),
		indicatorSeparator: () => ({
			display: "none",
		}),
		dropdownIndicator: (base, state) => ({
			...base,
			color: state.isFocused ? "var(--lagoon)" : "var(--sea-ink-soft, #999)",
			padding: isSmall ? "4px 6px" : "8px",
			transition: "color 150ms ease, transform 150ms ease",
			transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : undefined,
			"&:hover": {
				color: "var(--lagoon)",
			},
		}),
		clearIndicator: (base) => ({
			...base,
			color: "var(--sea-ink-soft, #999)",
			padding: isSmall ? "4px" : "8px",
			cursor: "pointer",
			"&:hover": {
				color: "var(--sea-ink)",
			},
		}),
		menu: (base) => ({
			...base,
			borderRadius: "0.5rem",
			border: "1px solid var(--line)",
			boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
			backgroundColor: "var(--foam)",
			overflow: "hidden",
			zIndex: 50,
			marginTop: "4px",
		}),
		menuList: (base) => ({
			...base,
			padding: "4px",
		}),
		option: (base, state) => ({
			...base,
			fontSize: "0.875rem",
			borderRadius: "0.375rem",
			padding: isSmall ? "6px 10px" : "8px 12px",
			cursor: "pointer",
			backgroundColor: state.isSelected
				? "var(--lagoon)"
				: state.isFocused
					? "var(--sand)"
					: "transparent",
			color: state.isSelected ? "#fff" : "var(--sea-ink)",
			"&:active": {
				backgroundColor: state.isSelected ? "var(--lagoon)" : "var(--sand)",
			},
		}),
		noOptionsMessage: (base) => ({
			...base,
			fontSize: "0.875rem",
			color: "var(--sea-ink-soft, #999)",
		}),
		loadingMessage: (base) => ({
			...base,
			fontSize: "0.875rem",
			color: "var(--sea-ink-soft, #999)",
		}),
	}
}

export default function Select({
	value,
	onChange,
	options,
	placeholder = "Select...",
	required,
	disabled,
	isClearable = false,
	isSearchable = true,
	id,
	className,
	size = "default",
}: SelectProps) {
	const selectedOption = options.find((o) => o.value === value) ?? null
	const styles = getStyles(size)

	return (
		<ReactSelect<SelectOption, false>
			inputId={id}
			value={selectedOption}
			onChange={(option) => onChange(option?.value ?? "")}
			options={options}
			placeholder={placeholder}
			isDisabled={disabled}
			isClearable={isClearable}
			isSearchable={isSearchable}
			styles={styles}
			className={className}
			required={required}
			menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
			menuPosition="fixed"
		/>
	)
}
