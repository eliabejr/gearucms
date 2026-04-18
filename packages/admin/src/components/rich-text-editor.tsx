import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import {
	Bold,
	Italic,
	Strikethrough,
	Code,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	Quote,
	Minus,
	Link as LinkIcon,
	Undo,
	Redo,
	CodeSquare,
} from "lucide-react"
import { useCallback } from "react"

interface RichTextEditorProps {
	content: string
	onChange: (html: string) => void
	placeholder?: string
}

interface ToolbarButtonProps {
	onClick: () => void
	active?: boolean
	disabled?: boolean
	title: string
	children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
	return (
		<button
			type="button"
			onMouseDown={(e) => {
				e.preventDefault()
				onClick()
			}}
			disabled={disabled}
			title={title}
			className={`flex h-7 w-7 items-center justify-center rounded text-sm transition ${
				active
					? "bg-[var(--lagoon)] text-white"
					: "text-[var(--sea-ink-soft)] hover:bg-[var(--foam)] hover:text-[var(--sea-ink)]"
			} disabled:cursor-not-allowed disabled:opacity-30`}
		>
			{children}
		</button>
	)
}

function Divider() {
	return <span className="mx-1 h-5 w-px shrink-0 bg-[var(--line)]" />
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				codeBlock: { HTMLAttributes: { class: "rte-code-block" } },
			}),
			Image,
			Link.configure({ openOnClick: false, HTMLAttributes: { class: "rte-link" } }),
			Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
		],
		content,
		onUpdate: ({ editor }) => onChange(editor.getHTML()),
		editorProps: {
			attributes: {
				class: "rte-content focus:outline-none",
			},
		},
	})

	const setLink = useCallback(() => {
		if (!editor) return
		const prev = editor.getAttributes("link").href as string | undefined
		const url = window.prompt("URL", prev ?? "https://")
		if (url === null) return
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run()
			return
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
	}, [editor])

	if (!editor) return null

	return (
		<div className="rte-shell rounded-lg border border-[var(--line)] bg-[var(--foam)] focus-within:border-[var(--lagoon)]">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--line)] px-2 py-1.5">
				<ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
					<Undo size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
					<Redo size={14} />
				</ToolbarButton>
				<Divider />
				<ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
					<Heading1 size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
					<Heading2 size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
					<Heading3 size={14} />
				</ToolbarButton>
				<Divider />
				<ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
					<Bold size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
					<Italic size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
					<Strikethrough size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
					<Code size={14} />
				</ToolbarButton>
				<Divider />
				<ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
					<List size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
					<ListOrdered size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
					<Quote size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
					<CodeSquare size={14} />
				</ToolbarButton>
				<Divider />
				<ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
					<LinkIcon size={14} />
				</ToolbarButton>
				<ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
					<Minus size={14} />
				</ToolbarButton>
			</div>
			{/* Editor */}
			<EditorContent editor={editor} className="rte-editor-content" />
		</div>
	)
}
