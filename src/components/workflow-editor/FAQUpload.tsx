'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface FAQ {
  question: string
  answer: string
}

export default function FAQUpload() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const rows = text.split('\n')
        const parsedFaqs = rows.slice(1).map(row => {
          const [question, answer] = row.split(',')
          return { question, answer }
        })
        setFaqs(parsedFaqs)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Upload FAQs</h2>
      <Input 
        type="file" 
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-4"
      />
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Question</th>
              <th className="px-4 py-2">Answer</th>
            </tr>
          </thead>
          <tbody>
            {faqs.map((faq, index) => (
              <tr key={index}>
                <td className="border px-4 py-2">
                  <input
                    className="w-full"
                    value={faq.question}
                    onChange={(e) => {
                      const newFaqs = [...faqs]
                      newFaqs[index].question = e.target.value
                      setFaqs(newFaqs)
                    }}
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    className="w-full"
                    value={faq.answer}
                    onChange={(e) => {
                      const newFaqs = [...faqs]
                      newFaqs[index].answer = e.target.value
                      setFaqs(newFaqs)
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 