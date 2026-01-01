import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance'
import { FaSearch, FaCommentDots } from 'react-icons/fa'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function ReviewerDashboard() {
  const decodeHtml = (s) => {
    if (!s) return ''
    try {
      const txt = document.createElement('textarea')
      txt.innerHTML = s
      return txt.value
    } catch (e) {
      return s
    }
  }
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [reviews, setReviews] = useState([])
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out')
    navigate('/login')
  }

  useEffect(() => {
    fetchAssigned()
  }, [])

 const fetchAssigned = async () => {
    setLoading(true)
    try {
      // Resolve current user id from localStorage to request assigned projects
      const stored = localStorage.getItem('user')
      let userId = null
      if (stored) {
        try { userId = JSON.parse(stored)._id || JSON.parse(stored).id || JSON.parse(stored).userId || null } catch (e) { userId = null }
      }
      const query = userId ? `?assignedTo=${userId}` : '?assignedTo=me'
      const res = await axiosInstance.get(`/api/projects${query}`)
      console.log('GET /api/projects response (reviewer):', res.data)
      console.log('Project summaries (reviewer):', (res.data || []).map(d => d.summary))
      const data = res.data || []
      const normalized = data.map(p => ({ ...p, id: p._id || p.id }))
      setProjects(normalized)
    } catch (err) {
      console.error('Failed to load projects', err)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const openProject = async (p) => {
    setSelected(p)
    setComment('')
    try {
      const projectId = p.id || p._id
      const res = await axiosInstance.get(`/api/projects/${projectId}/reviews`)
      setReviews(res.data || [])
    } catch (err) {
      console.error('Failed to load reviews', err)
      setReviews([])
    }
  }

  const submitReview = async () => {
    if (!selected) return
    if (!comment.trim()) { toast.error('Please enter a comment'); return }
    setSubmitting(true)
    try {
      const projectId = selected.id || selected._id
      // include reviewer info if available
      let reviewerId = null, reviewerName = null
      try {
        const stored = localStorage.getItem('user')
        if (stored) {
          const u = JSON.parse(stored)
          reviewerId = u._id || u.id || null
          reviewerName = ((u.firstName || u.name || '') + ' ' + (u.lastName || '')).trim() || u.email || null
        }
      } catch (e) {}
      // POST review to server
      await axiosInstance.post(`/api/projects/${projectId}/reviews`, { comment, reviewerId, reviewerName })
      toast.success('Comment submitted')
      setComment('')
      // Refresh assigned projects to ensure fresh state (no local-only changes)
      fetchAssigned()
      // refresh reviews for the open project so the reviewer immediately sees the comment
      try {
        const res = await axiosInstance.get(`/api/projects/${projectId}/reviews`)
        setReviews(res.data || [])
      } catch (e) {
        console.error('Failed to refresh reviews after submit', e)
      }
    } catch (err) {
      console.error('Submit review failed', err)
      const msg = err?.response?.data?.message || 'Failed to submit comment. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Reviewer Dashboard</h1>
        <div className="flex items-center gap-2">
          <input className="border rounded-md px-3 py-2 bg-white" placeholder="Search projects..." />
          <button className="bg-indigo-600 text-white px-3 py-2 rounded-md"><FaSearch /></button>
          <button onClick={() => navigate('/profile')} className="px-3 py-2 rounded-md bg-white text-gray-800">Profile</button>
          <button onClick={logout} className="px-3 py-2 rounded-md bg-gray-100 text-gray-800">Logout</button>
        </div>
      </div>
      <ToastContainer />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && <div className="text-gray-500">Loading projects...</div>}
        {projects.map(p => (
          <div key={p.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium">{p.title}</h3>
                <p className="text-sm text-gray-500">{p.client} • {p.submittedAt}</p>
              </div>
              <div className="text-sm">
                <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'accepted' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{p.status}</span>
              </div>
            </div>
            <div className="mt-3 text-gray-700 flex-1" dangerouslySetInnerHTML={{ __html: decodeHtml(p.summary) }} />
            {p.document && (
              <div className="mt-2">
                <a href={p.document} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600">View attachment</a>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => openProject(p)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-50 text-indigo-700"> <FaCommentDots/> Review</button>
            </div>
          </div>
        ))}
      </div>

   {/* Drawer / Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="w-full md:w-2/3 bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{selected.title}</h2>
                <p className="text-sm text-gray-500">{selected.client} • {selected.submittedAt}</p>
                {selected.document && (
                  <div className="mt-1"><a href={selected.document} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600">Open attachment</a></div>
                )}
                {selected.document && (
                  <div className="mt-1"><a href={selected.document} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600">Open attachment</a></div>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500">Close</button>
            </div>
            <div className="mt-4 text-gray-700" dangerouslySetInnerHTML={{ __html: decodeHtml(selected.summary) }} />

           <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Comments</label>
              <div className="mt-2 space-y-3 max-h-40 overflow-auto border rounded p-2 bg-gray-50">
                {reviews.length === 0 && <div className="text-gray-500">No comments yet</div>}
                {reviews.map((c, i) => (
                  <div key={i} className="p-2 bg-white rounded border">
                    <div className="text-sm font-medium">{c.reviewerName || c.reviewer || 'Reviewer'}</div>
                    <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
                    <div className="mt-1 text-gray-700">{c.comment || c.text}</div>
                  </div>
                ))}
              </div>

              <label className="block text-sm font-medium text-gray-700 mt-4">Your comment</label>
            </div>

          <div className="mt-4 flex gap-2 justify-end">
              <button disabled={submitting} onClick={submitReview} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewerDashboard