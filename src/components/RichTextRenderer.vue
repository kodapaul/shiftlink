<script setup lang="ts">
/**
 * RichTextRenderer: safely renders an HTML string produced by RichTextEditor.
 *
 * Sanitizes via DOMPurify before binding via v-html. Same content styles as
 * the editor body so editor output and rendered output look identical.
 *
 * Usage:
 *   <RichTextRenderer :html="shift.notes" />
 */

import { computed, type HTMLAttributes } from 'vue'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'

interface Props {
  html?: string
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), { html: '' })

// Allow only the tags Tiptap actually emits via the editor's extension set.
// Anything else (script, style, iframe, on* attributes, etc.) is stripped.
const ALLOWED_TAGS = [
  'p',
  'h2',
  'h3',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'a',
  'br',
]
const ALLOWED_ATTR = ['href', 'class', 'rel', 'target']

const safeHtml = computed(() =>
  DOMPurify.sanitize(props.html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  }),
)

const isEmpty = computed(() => !safeHtml.value || safeHtml.value === '<p></p>')
</script>

<template>
  <div v-if="!isEmpty" :class="cn('rte-prose text-[15px] leading-relaxed text-ink/85', props.class)" v-html="safeHtml" />
</template>
