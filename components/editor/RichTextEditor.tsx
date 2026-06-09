"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import {
  BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon,
  CodeIcon, Heading2Icon, LinkIcon, ImageIcon,
  UndoIcon, RedoIcon,
} from "lucide-react"
import { useEffect } from "react"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  editable?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  editable = true,
}: RichTextEditorProps) {

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: "rounded-lg max-w-full mt-2",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:pointer-events-none before:absolute before:opacity-50",
      }),
    ],
    content: value,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  function ToolbarButton({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded hover:bg-muted transition-colors ${
          active ? "bg-muted text-foreground" : "text-muted-foreground"
        }`}
      >
        {children}
      </button>
    )
  }

  return (
    <div className={`rounded-lg border ${editable ? "focus-within:ring-1 focus-within:ring-ring" : "bg-muted/30"}`}>

      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b">

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <BoldIcon className="size-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <ItalicIcon className="size-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading"
          >
            <Heading2Icon className="size-3.5" />
          </ToolbarButton>

          <div className="w-px h-4 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <ListIcon className="size-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Numbered list"
          >
            <ListOrderedIcon className="size-3.5" />
          </ToolbarButton>

          <div className="w-px h-4 bg-border mx-1" />

          {/* code block — not inline code */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code block"
          >
            <CodeIcon className="size-3.5" />
          </ToolbarButton>

          {/* link — toggles on/off */}
          <ToolbarButton
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run()
              } else {
                const url = window.prompt("Paste a URL")
                if (url && url.trim()) {
                  editor.chain().focus()
                    .setLink({ href: url.trim(), target: "_blank" })
                    .run()
                }
              }
            }}
            active={editor.isActive("link")}
            title={editor.isActive("link") ? "Remove link" : "Add link"}
          >
            <LinkIcon className="size-3.5" />
          </ToolbarButton>

          {/* image by URL — file upload comes later with Convex storage */}
          <ToolbarButton
            onClick={() => {
              const url = window.prompt("Paste image URL")
              if (url && url.trim()) {
                editor.chain().focus().setImage({ src: url.trim() }).run()
              }
            }}
            title="Insert image by URL"
          >
            <ImageIcon className="size-3.5" />
          </ToolbarButton>

          <div className="w-px h-4 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Undo"
          >
            <UndoIcon className="size-3.5" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Redo"
          >
            <RedoIcon className="size-3.5" />
          </ToolbarButton>

        </div>
      )}

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-[120px]
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_p]:my-1
          [&_.ProseMirror_h2]:text-base
          [&_.ProseMirror_h2]:font-semibold
          [&_.ProseMirror_h2]:mt-3
          [&_.ProseMirror_ul]:list-disc
          [&_.ProseMirror_ul]:pl-4
          [&_.ProseMirror_ol]:list-decimal
          [&_.ProseMirror_ol]:pl-4
          [&_.ProseMirror_pre]:bg-muted
          [&_.ProseMirror_pre]:p-3
          [&_.ProseMirror_pre]:rounded-md
          [&_.ProseMirror_pre]:text-xs
          [&_.ProseMirror_pre]:font-mono
          [&_.ProseMirror_code:not(pre_code)]:bg-muted
          [&_.ProseMirror_code:not(pre_code)]:px-1
          [&_.ProseMirror_code:not(pre_code)]:rounded
          [&_.ProseMirror_code:not(pre_code)]:text-xs"
      />
    </div>
  )
}