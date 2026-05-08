<script setup lang="ts">
/**
 * RichTextEditor: a small Tiptap-backed WYSIWYG.
 *
 * Public model is an HTML string so Shift.notes can stay a `string` and
 * roundtrip through localStorage / the JSON seed unchanged. Sanitize at the
 * render side via RichTextRenderer.
 *
 * Toolbar: bold, italic, h2, h3, bullet list, ordered list, link.
 *
 * Usage:
 *   <RichTextEditor v-model="values.notes" placeholder="..." />
 */

import { computed, onBeforeUnmount, watch, type HTMLAttributes } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Link2Off,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  placeholder?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Add details, requirements, anything the professional should know.',
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

// Tiptap editor instance. The autofocus / readOnly / extensions live here.
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      // The starter kit's bullet/ordered lists need explicit class config to
      // get default disc / decimal styling under Tailwind v4 reset.
      bulletList: { HTMLAttributes: { class: 'rte-bullet-list' } },
      orderedList: { HTMLAttributes: { class: 'rte-ordered-list' } },
    }),
    Placeholder.configure({ placeholder: () => props.placeholder }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      HTMLAttributes: { class: 'rte-link', rel: 'noopener noreferrer', target: '_blank' },
    }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    // Tiptap returns "<p></p>" for empty input. Normalize that to '' so the
    // form's emptiness checks (e.g. trim().length === 0) keep working.
    emit('update:modelValue', html === '<p></p>' ? '' : html)
  },
})

// External v-model writes (e.g. edit-mode pre-population) need to push into
// the editor without triggering an infinite update loop.
watch(
  () => props.modelValue,
  (next) => {
    if (!editor.value) return
    const current = editor.value.getHTML()
    if (current === next) return
    if (current === '<p></p>' && !next) return
    editor.value.commands.setContent(next || '', { emitUpdate: false })
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// Toolbar button helpers. Each button toggles a mark/node and shows an active
// state when the current selection has it.
const isActive = computed(() => ({
  bold: editor.value?.isActive('bold') ?? false,
  italic: editor.value?.isActive('italic') ?? false,
  h2: editor.value?.isActive('heading', { level: 2 }) ?? false,
  h3: editor.value?.isActive('heading', { level: 3 }) ?? false,
  bulletList: editor.value?.isActive('bulletList') ?? false,
  orderedList: editor.value?.isActive('orderedList') ?? false,
  link: editor.value?.isActive('link') ?? false,
}))

function toggleBold() {
  editor.value?.chain().focus().toggleBold().run()
}
function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run()
}
function toggleH2() {
  editor.value?.chain().focus().toggleHeading({ level: 2 }).run()
}
function toggleH3() {
  editor.value?.chain().focus().toggleHeading({ level: 3 }).run()
}
function toggleBulletList() {
  editor.value?.chain().focus().toggleBulletList().run()
}
function toggleOrderedList() {
  editor.value?.chain().focus().toggleOrderedList().run()
}

// Link toggle: prompt for URL when adding, just unset when removing.
function toggleLink() {
  if (!editor.value) return
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  const url = window.prompt('URL')
  if (url === null) return
  if (url === '') {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

interface ToolbarButton {
  label: string
  icon: typeof Bold
  active: boolean
  action: () => void
}

const buttons = computed<ToolbarButton[]>(() => [
  { label: 'Bold', icon: Bold, active: isActive.value.bold, action: toggleBold },
  { label: 'Italic', icon: Italic, active: isActive.value.italic, action: toggleItalic },
  { label: 'Heading', icon: Heading2, active: isActive.value.h2, action: toggleH2 },
  { label: 'Subheading', icon: Heading3, active: isActive.value.h3, action: toggleH3 },
  { label: 'Bullet list', icon: List, active: isActive.value.bulletList, action: toggleBulletList },
  { label: 'Numbered list', icon: ListOrdered, active: isActive.value.orderedList, action: toggleOrderedList },
  {
    label: isActive.value.link ? 'Remove link' : 'Add link',
    icon: isActive.value.link ? Link2Off : Link2,
    active: isActive.value.link,
    action: toggleLink,
  },
])
</script>

<template>
  <div :class="cn('rich-text-editor flex flex-col overflow-hidden rounded-xl border border-mist bg-bone', props.class)">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-0.5 border-b border-mist/70 bg-cream/55 px-2 py-1.5">
      <button
        v-for="btn in buttons"
        :key="btn.label"
        type="button"
        :title="btn.label"
        :aria-label="btn.label"
        :aria-pressed="btn.active"
        :class="[
          'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors',
          btn.active
            ? 'bg-ink text-cream'
            : 'text-ink/65 hover:bg-mist/60 hover:text-ink',
        ]"
        @click="btn.action"
      >
        <component :is="btn.icon" class="h-4 w-4" />
      </button>
    </div>

    <!-- Editor body -->
    <EditorContent :editor="editor" class="rte-content min-h-[140px] px-4 py-3 text-[15px] leading-relaxed" />
  </div>
</template>

<style>
/* Global ProseMirror + content styles. Scoped via .rte-content / .ProseMirror
 * selectors so only the editor and renderer are affected. */

.rte-content .ProseMirror {
  outline: none;
  min-height: 100px;
}

.rte-content .ProseMirror p,
.rte-prose p {
  margin: 0 0 0.6em;
  color: var(--ink);
}

.rte-content .ProseMirror p:last-child,
.rte-prose p:last-child {
  margin-bottom: 0;
}

.rte-content .ProseMirror h2,
.rte-prose h2 {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.35em;
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0.4em 0 0.4em;
  color: var(--ink);
}

.rte-content .ProseMirror h3,
.rte-prose h3 {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1.15em;
  line-height: 1.25;
  letter-spacing: -0.005em;
  margin: 0.5em 0 0.3em;
  color: var(--ink);
}

.rte-content .ProseMirror ul.rte-bullet-list,
.rte-prose ul {
  list-style: disc;
  padding-left: 1.25em;
  margin: 0 0 0.6em;
}

.rte-content .ProseMirror ol.rte-ordered-list,
.rte-prose ol {
  list-style: decimal;
  padding-left: 1.5em;
  margin: 0 0 0.6em;
}

.rte-content .ProseMirror li,
.rte-prose li {
  margin: 0.15em 0;
}

.rte-content .ProseMirror strong,
.rte-prose strong {
  font-weight: 600;
}

.rte-content .ProseMirror em,
.rte-prose em {
  font-style: italic;
}

.rte-content .ProseMirror a.rte-link,
.rte-prose a {
  color: var(--forest);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.rte-content .ProseMirror a.rte-link:hover,
.rte-prose a:hover {
  color: var(--ink);
}

/* Placeholder shown when the editor is empty. */
.rte-content .ProseMirror p.is-editor-empty:first-child::before {
  color: rgb(26 26 26 / 0.45);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
