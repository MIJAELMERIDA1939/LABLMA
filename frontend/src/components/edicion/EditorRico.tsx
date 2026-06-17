"use client"
import { useCallback, useEffect, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Code,
} from "lucide-react"

interface EditorRicoProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function EditorRico({ content, onChange, placeholder = "Escribe aquí..." }: EditorRicoProps) {
  const [linkUrl, setLinkUrl] = useState("")
  const [showLinkInput, setShowLinkInput] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[500px] p-6 text-text",
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return
    editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
    setShowLinkInput(false)
    setLinkUrl("")
  }, [editor, linkUrl])

  if (!editor) return null

  const ToolButton = ({ onClick, active, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active ? "bg-primary/20 text-primary" : "text-muted hover:text-text hover:bg-surface/50"
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-[#1A1D27]">
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-surface/50">
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrita">
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Cursiva">
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Subrayado">
          <UnderlineIcon className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Tachado">
          <Strikethrough className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Título 1">
          <Heading1 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título 2">
          <Heading2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Título 3">
          <Heading3 className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Cita">
          <Quote className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Código">
          <Code className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Alinear izquierda">
          <AlignLeft className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centrar">
          <AlignCenter className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Alinear derecha">
          <AlignRight className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton onClick={() => setShowLinkInput(!showLinkInput)} active={editor.isActive("link")} title="Enlace">
          <LinkIcon className="w-4 h-4" />
        </ToolButton>

        <div className="flex-1" />

        <ToolButton onClick={() => editor.chain().focus().undo().run()} title="Deshacer">
          <Undo className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => editor.chain().focus().redo().run()} title="Rehacer">
          <Redo className="w-4 h-4" />
        </ToolButton>
      </div>

      {showLinkInput && (
        <div className="flex items-center gap-2 p-2 border-b border-border bg-surface/30">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 bg-surface border border-border rounded px-2 py-1 text-sm text-text focus:outline-none focus:border-primary"
            onKeyDown={(e) => e.key === "Enter" && setLink()}
          />
          <button
            type="button"
            onClick={setLink}
            className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/80"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false) }}
            className="text-xs text-muted hover:text-text px-2 py-1"
          >
            Quitar
          </button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
