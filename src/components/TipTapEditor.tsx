import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import {
	Bold,
	Italic,
	Strikethrough,
	Code,
	List,
	ListOrdered,
	Quote,
	Heading1,
	Heading2,
	Heading3,
	Link as LinkIcon,
	ImageIcon,
	Undo2,
	Redo2,
	RemoveFormatting,
} from "lucide-react"

interface TipTapEditorProps {
	content: string
	onChange: (html: string) => void
	placeholder?: string
}

export default function TipTapEditor({
	content,
	onChange,
	placeholder = "Start writing...",
}: TipTapEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Image,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-[var(--lagoon)] underline",
				},
			}),
			Placeholder.configure({
				placeholder,
			}),
		],
		content,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML())
		},
	})

	if (!editor) return null

	const addLink = () => {
		const url = window.prompt("URL:")
		if (url) {
			editor.chain().focus().setMark("link", { href: url }).run()
		}
	}

	const addImage = () => {
		const url = window.prompt("Image URL:")
		if (url) {
			editor.chain().focus().setImage({ src: url }).run()
		}
	}

	const btnClass = (active: boolean) =>
		`rounded p-1.5 transition ${
			active
				? "bg-[var(--lagoon)] text-white"
				: "text-[var(--sea-ink-soft)] hover:bg-[var(--foam)] hover:text-[var(--sea-ink)]"
		}`

	return (
		<div className="rounded-lg border border-[var(--line)] bg-[var(--foam)] overflow-hidden">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--line)] bg-[var(--sand)] px-2 py-1.5">
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={btnClass(editor.isActive("bold"))}
					title="Bold"
				>
					<Bold size={15} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={btnClass(editor.isActive("italic"))}
					title="Italic"
				>
					<Italic size={15} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleStrike().run()}
					className={btnClass(editor.isActive("strike"))}
					title="Strikethrough"
				>
					<Strikethrough size={15} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleCode().run()}
					className={btnClass(editor.isActive("code"))}
					title="Inline Code"
				>
					<Code size={15} />
				</button>

				<div className="mx-1 h-5 w-px bg-[var(--line)]" />

				<button
					type="button"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 1 }).run()
					}
					className={btnClass(editor.isActive("heading", { level: 1 }))}
					title="Heading 1"
				>
					<Heading1 size={15} />
				</button>
				<button
					type="button"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					className={btnClass(editor.isActive("heading", { level: 2 }))}
					title="Heading 2"
				>
					<Heading2 size={15} />
				</button>
				<button
					type="button"
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
					className={btnClass(editor.isActive("heading", { level: 3 }))}
					title="Heading 3"
				>
					<Heading3 size={15} />
				</button>

				<div className="mx-1 h-5 w-px bg-[var(--line)]" />

				<button
					type="button"
					onClick={() =>
						editor.chain().focus().toggleBulletList().run()
					}
					className={btnClass(editor.isActive("bulletList"))}
					title="Bullet List"
				>
					<List size={15} />
				</button>
				<button
					type="button"
					onClick={() =>
						editor.chain().focus().toggleOrderedList().run()
					}
					className={btnClass(editor.isActive("orderedList"))}
					title="Ordered List"
				>
					<ListOrdered size={15} />
				</button>
				<button
					type="button"
					onClick={() =>
						editor.chain().focus().toggleBlockquote().run()
					}
					className={btnClass(editor.isActive("blockquote"))}
					title="Blockquote"
				>
					<Quote size={15} />
				</button>

				<div className="mx-1 h-5 w-px bg-[var(--line)]" />

				<button
					type="button"
					onClick={addLink}
					className={btnClass(editor.isActive("link"))}
					title="Add Link"
				>
					<LinkIcon size={15} />
				</button>
				<button
					type="button"
					onClick={addImage}
					className={btnClass(false)}
					title="Add Image"
				>
					<ImageIcon size={15} />
				</button>

				<div className="mx-1 h-5 w-px bg-[var(--line)]" />

				<button
					type="button"
					onClick={() =>
						editor.chain().focus().clearNodes().unsetAllMarks().run()
					}
					className={btnClass(false)}
					title="Clear Formatting"
				>
					<RemoveFormatting size={15} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
					className={`${btnClass(false)} disabled:opacity-30`}
					title="Undo"
				>
					<Undo2 size={15} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
					className={`${btnClass(false)} disabled:opacity-30`}
					title="Redo"
				>
					<Redo2 size={15} />
				</button>
			</div>

			{/* Bubble menu for text selection */}
			<BubbleMenu
				editor={editor}
				tippyOptions={{ duration: 150 }}
				className="flex items-center gap-0.5 rounded-lg border border-[var(--line)] bg-white p-1 shadow-lg"
			>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={btnClass(editor.isActive("bold"))}
				>
					<Bold size={14} />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={btnClass(editor.isActive("italic"))}
				>
					<Italic size={14} />
				</button>
				<button
					type="button"
					onClick={addLink}
					className={btnClass(editor.isActive("link"))}
				>
					<LinkIcon size={14} />
				</button>
			</BubbleMenu>

			{/* Editor content */}
			<EditorContent
				editor={editor}
				className="tiptap-editor prose prose-sm max-w-none px-3 py-2 text-[var(--sea-ink)] focus-within:outline-none [&_.tiptap]:min-h-[150px] [&_.tiptap]:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-[var(--sea-ink-soft)] [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:h-0"
			/>
		</div>
	)
}
