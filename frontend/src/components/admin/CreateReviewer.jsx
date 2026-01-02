import React, { useState } from 'react'
import axiosInstance from '../../utils/axiosInstance'
import { useNavigate } from 'react-router-dom'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function CreateReviewer() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error('First name, last name and email are required')
      return
    }
    setSubmitting(true)
    try {
      await axiosInstance.post('/api/reviewers', { firstName, lastName, email, title })
      toast.success('Reviewer created')
      navigate('/admin-dashboard')
    } catch (err) {
      console.error('Create reviewer failed', err)
      const msg = err?.response?.data?.message || err?.message || 'Failed to create reviewer'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-4">Create Reviewer</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">First Name</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border rounded w-full px-2 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="border rounded w-full px-2 py-1" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Title / Profession</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="border rounded w-full px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="border rounded w-full px-2 py-1" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="px-3 py-2 bg-indigo-600 text-white rounded">
            {submitting ? 'Creating...' : 'Create Reviewer'}
          </button>
          <button type="button" onClick={() => navigate('/admin-dashboard')} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default CreateReviewer
