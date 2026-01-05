import React, { useState } from 'react'
import axiosInstance from '../utils/axiosInstance'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please fill all fields')
      return
    }
    setSubmitting(true)
    try {
      // try posting to backend contact endpoint (create one if missing)
      const res = await axiosInstance.post('/api/contact', form)
      toast.success(res?.data?.message || 'Message sent — thank you!')
      setForm({ name: '', email: '', message: '' })
    } catch (err) {
      console.error('Contact send failed', err)
      const serverMsg = err?.response?.data?.message
      if (serverMsg) {
        toast.error(serverMsg)
      } else {
        // fallback: open user's email client with mailto
        toast.info('Opening your email client as fallback')
        const mailto = `mailto:info@rtdp.example?subject=${encodeURIComponent('Contact from '+form.name)}&body=${encodeURIComponent(form.message + '\n\nFrom: '+form.email)}`
        window.location.href = mailto
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-4">Contact Us</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Name</label>
          <input value={form.name} onChange={e => handleChange('name', e.target.value)} className="mt-1 w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input value={form.email} onChange={e => handleChange('email', e.target.value)} className="mt-1 w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm">Message</label>
          <textarea value={form.message} onChange={e => handleChange('message', e.target.value)} className="mt-1 w-full border rounded p-2 h-32" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded">
            {submitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Contact
