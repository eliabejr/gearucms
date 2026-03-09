interface FieldData {
	field: { name: string; slug: string; type: string }
	value: string | null
}

export default function ContentRenderer({ fields }: { fields: FieldData[] }) {
	return (
		<div className="prose prose-lg max-w-none dark:prose-invert">
			{fields.map((item, index) => (
				<FieldRenderer key={index} field={item.field} value={item.value} />
			))}
		</div>
	)
}

function FieldRenderer({
	field,
	value,
}: {
	field: { name: string; slug: string; type: string }
	value: string | null
}) {
	if (!value) return null
	switch (field.type) {
		case "richtext":
			return <div dangerouslySetInnerHTML={{ __html: value }} className="prose-content" />
		case "image":
			return (
				<figure className="my-6">
					<img src={value} alt={field.name} className="rounded-lg" />
				</figure>
			)
		case "boolean":
			return null
		case "number":
			return (
				<p>
					<strong>{field.name}:</strong> {value}
				</p>
			)
		case "date":
			return (
				<p>
					<strong>{field.name}:</strong> {new Date(value).toLocaleDateString()}
				</p>
			)
		case "text":
		default:
			if (field.slug === "title" || field.slug === "heading" || field.slug === "name") {
				return <h2>{value}</h2>
			}
			return <p>{value}</p>
	}
}
