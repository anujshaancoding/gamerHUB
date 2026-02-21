"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Minus,
} from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onJsonChange?: (json: Record<string, unknown>) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-md transition-colors",
        active
          ? "bg-primary/20 text-primary"
          : "text-text-muted hover:text-text hover:bg-surface-lighter",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-border mx-1" />;
}

export function RichTextEditor({
  content,
  onChange,
  onJsonChange,
  placeholder = "Start writing your post...",
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      TiptapImage.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full mx-auto" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      onJsonChange?.(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-lg max-w-none min-h-[400px] px-6 py-4 focus:outline-none " +
          "prose-headings:text-text prose-p:text-text-secondary " +
          "prose-a:text-primary prose-strong:text-text " +
          "prose-ul:text-text-secondary prose-ol:text-text-secondary " +
          "prose-blockquote:border-primary/50 prose-blockquote:text-text-muted " +
          "prose-code:text-primary prose-pre:bg-surface-light",
      },
    },
    immediatelyRender: false,
  });

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl("");
    setShowImageInput(false);
  }, [editor, imageUrl]);

  if (!editor) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-surface-light">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Lists & blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Media & links */}
        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          active={editor.isActive("link")}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowImageInput(!showImageInput)}
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Undo / Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Link input popup */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-light border-b border-border">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-1.5 text-sm bg-surface border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <button
            type="button"
            onClick={addLink}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Add
          </button>
          {editor.isActive("link") && (
            <button
              type="button"
              onClick={removeLink}
              className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="px-2 py-1.5 text-sm text-text-muted hover:text-text"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Image input popup */}
      {showImageInput && (
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-light border-b border-border">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL here..."
            className="flex-1 px-3 py-1.5 text-sm bg-surface border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => e.key === "Enter" && addImage()}
          />
          <button
            type="button"
            onClick={addImage}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowImageInput(false)}
            className="px-2 py-1.5 text-sm text-text-muted hover:text-text"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor content area */}
      <EditorContent editor={editor} />
    </div>
  );
}
