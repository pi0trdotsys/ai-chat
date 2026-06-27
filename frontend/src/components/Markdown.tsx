import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

// Blok kodu z paskiem nagłówka: nazwa języka + przycisk kopiowania
function PreBlock({ node, ...props }: ComponentPropsWithoutRef<'pre'> & { node?: unknown }) {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const [lang, setLang] = useState('')

  useEffect(() => {
    const code = ref.current?.querySelector('code')
    const match = code?.className.match(/language-([\w-]+)/)
    setLang(match ? match[1] : '')
  }, [])

  const copy = async () => {
    const text = ref.current?.querySelector('code')?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // brak dostępu do schowka (np. nie-HTTPS) - ignorujemy
    }
  }

  return (
    <div className="code-block">
      <div className="code-block-bar">
        <span className="code-lang">{lang || 'kod'}</span>
        <button type="button" onClick={copy} className="code-copy">
          {copied ? '✓ skopiowano' : '⧉ kopiuj'}
        </button>
      </div>
      <pre ref={ref} {...props} />
    </div>
  )
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{ pre: PreBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
