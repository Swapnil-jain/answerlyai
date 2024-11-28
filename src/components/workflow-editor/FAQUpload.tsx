'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Loader2, Save, Trash2 } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/provider'

interface FAQ {
  id?: string
  question: string
  answer: string
  user_id?: string
}

export default function FAQUpload() {
  const { supabase } = useSupabase()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch existing FAQs on component mount
  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setFaqs(data || [])
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      alert('Failed to load FAQs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const rows = text.split('\n')
        
        try {
          setIsSaving(true)
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          const parsedFaqs = rows.slice(1).map(row => {
            const [question, answer] = row.split(',')
            return { 
              question, 
              answer,
              user_id: user.id
            }
          })

          const { error } = await supabase
            .from('faqs')
            .insert(parsedFaqs)

          if (error) throw error
          fetchFAQs()
        } catch (error) {
          console.error('Error saving FAQs:', error)
          alert('Failed to save FAQs')
        } finally {
          setIsSaving(false)
        }
      }
      reader.readAsText(file)
    }
  }

  const addNewFAQ = () => {
    setFaqs([...faqs, { id: crypto.randomUUID(), question: '', answer: '' }])
  }

  const deleteFAQ = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchFAQs()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      alert('Failed to delete FAQ')
    }
  }

  const saveFAQs = async () => {
    try {
      setIsSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // Filter out empty FAQs and add user_id
      const validFaqs = faqs
        .filter(faq => faq.question.trim() !== '' && faq.answer.trim() !== '')
        .map(faq => ({
          ...faq,
          user_id: user.id
        }))

      // Upsert FAQs
      const { error } = await supabase
        .from('faqs')
        .upsert(validFaqs, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (error) throw error
      fetchFAQs()
      alert('FAQs saved successfully!')
    } catch (error) {
      console.error('Error saving FAQs:', error)
      alert('Failed to save FAQs')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 max-w-6xl mx-auto p-8 pt-20">
      <div className="space-y-8">
        {/* Description Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">FAQ Management</h2>
          <p className="text-gray-600 mb-4">
            Add FAQs to your chatbot either by uploading a CSV file or manually entering them below. 
            These FAQs will be used to train your chatbot to answer common questions.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-2">Example CSV format:</h3>
            <code className="block text-sm text-gray-600">
              question,answer<br/>
              What are your business hours?,We are open Monday to Friday, 9 AM to 5 PM<br/>
              How do I reset my password?,Click on the "Forgot Password" link on the login page
            </code>
          </div>
        </div>

        {/* Upload and Manual Entry Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Manage FAQs</h2>
            <div className="flex gap-3">
              <Input 
                type="file" 
                accept=".csv"
                onChange={handleFileUpload}
                className="w-[200px]"
              />
              <Button
                onClick={addNewFAQ}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add FAQ
              </Button>
              <Button
                onClick={saveFAQs}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save All'}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {faqs.map((faq, index) => (
                  <tr key={faq.id || index}>
                    <td className="px-6 py-4">
                      <Input
                        className="w-full"
                        value={faq.question}
                        onChange={(e) => {
                          const newFaqs = [...faqs]
                          newFaqs[index].question = e.target.value
                          setFaqs(newFaqs)
                        }}
                        placeholder="Enter question..."
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        className="w-full"
                        value={faq.answer}
                        onChange={(e) => {
                          const newFaqs = [...faqs]
                          newFaqs[index].answer = e.target.value
                          setFaqs(newFaqs)
                        }}
                        placeholder="Enter answer..."
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFAQ(faq.id || '')}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 