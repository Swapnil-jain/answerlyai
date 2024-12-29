import Image from 'next/image'
import { urlFor } from '../sanity'
import type { PortableTextComponents } from '@portabletext/react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'

export const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset) {
        return null
      }

      return (
        <figure className="my-8">
          <div className="relative">
            <Image
              src={urlFor(value.asset)
                .auto('format')
                .width(1920)
                .fit('clip')
                .url()}
              alt={value.alt || ''}
              width={1920}
              height={1080}
              className="w-full h-auto rounded-lg"
              priority
            />
          </div>
          {value.caption && (
            <figcaption className="mt-2 text-center text-sm text-gray-500">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    myCodeField: ({ value }) => (
      <SyntaxHighlighter language={value.language || 'javascript'} style={dracula}>
        {value.code}
      </SyntaxHighlighter>
    ),
    table: ({ value }) => (
      <table className="my-8 w-full border-collapse">
        <tbody>
          {value.rows.map((row: { cells: string[] }, rowIndex: number) => (
            <tr key={rowIndex}>
              {row.cells.map((cell: string, cellIndex: number) => (
                <td key={cellIndex} className="border p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  },
  block: {
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mt-12 mb-6">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-bold mt-8 mb-4">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="mb-6 leading-relaxed">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic my-6">
        {children}
      </blockquote>
    )
  },
  marks: {
    link: ({ children, value }) => {
      const rel = !value.href.startsWith('/') ? 'noreferrer noopener' : undefined
      return (
        <a
          href={value.href}
          rel={rel}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {children}
        </a>
      )
    }
  }
} 