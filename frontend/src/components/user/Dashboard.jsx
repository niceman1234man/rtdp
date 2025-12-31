import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance'
import { FaUpload, FaPlus } from 'react-icons/fa'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function UserDashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [file, setFile] = useState(null)
  const fileRef = useRef(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Edit/delete project states
  const [editingProject, setEditingProject] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState(null)  

 useEffect(() => {
    fetchMyProjects()
  }, [])

 const fetchMyProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axiosInstance.get('/api/projects')
      const data = res.data || []
      // normalize _id -> id for convenience in the UI
      const normalized = data.map(p => ({ ...p, id: p._id || p.id }))
      setProjects(normalized)
    } catch (err) {
      console.error('Could not fetch projects', err)
      setError('Failed to load projects from the server')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

 const handleFile = (e) => {
    setFile(e.target.files[0] || null)
  }

const handleSubmit = async (e) => {
  e.preventDefault()

  if (!title.trim() || !summary.trim()) {
    toast.error('Title and summary are required')
    return
  }

  setSubmitting(true)
  setUploadProgress(0)

  try {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('summary', summary)
    if (file) formData.append('file', file)

    const res = await axiosInstance.post('/api/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          setUploadProgress(Math.round((e.loaded * 100) / e.total))
        }
      },
      timeout: 120000,
    })

    setProjects((prev) => [
      { ...res.data, id: res.data._id },
      ...prev,
    ])

    setTitle('')
    setSummary('')
    setFile(null)
    setUploadProgress(0)
    if (fileRef.current) fileRef.current.value = ''

    toast.success('Project submitted successfully')
  } catch (err) {
    const msg =
      err?.response?.data?.message || 'Failed to submit project'
    toast.error(msg)
  } finally {
    setSubmitting(false)
  }
}


  const openEditProject = (p) => {
    setEditingProject(p)
    setEditTitle(p.title || '')
    setEditSummary(p.summary || '')
  }

  const saveEditProject = async () => {
    if (!editingProject) return
    setEditLoading(true)
    try {
      const payload = { title: editTitle, summary: editSummary }
      const res = await axiosInstance.put(`/api/projects/${editingProject.id}`, payload)
      const updated = res.data || { ...editingProject, ...payload }
      setProjects(ps => ps.map(x => x.id === (updated._id || updated.id) ? { ...x, ...updated, id: updated._id || updated.id } : x))
      toast.success('Project updated')
      setEditingProject(null)
    } catch (err) {
      console.error('Update project failed', err)
      const msg = err?.response?.data?.message || 'Failed to update project'
      setError(msg)
      toast.error(msg)
    } finally {
      setEditLoading(false)
    }
  }

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return
    setDeletingProjectId(id)
    try {
      await axiosInstance.delete(`/api/projects/${id}`)
      setProjects(ps => ps.filter(p => p.id !== id))
      toast.success('Project deleted')
    } catch (err) {
      console.error('Delete project failed', err)
      const msg = err?.response?.data?.message || 'Failed to delete project'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingProjectId(null)
    }
  }

  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <ToastContainer />
      <div className="flex justify-end mb-4">
        <button onClick={() => navigate('/profile')} className="px-3 py-2 rounded-md bg-white text-gray-800 mr-2">Profile</button>
        <button onClick={logout} className="px-3 py-2 rounded-md bg-gray-100 text-gray-800">Logout</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Submit a Project</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-md p-2 border border-gray-200" placeholder="Project title" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Summary</label>
              <textarea value={summary} onChange={e => setSummary(e.target.value)} className="mt-1 w-full rounded-md p-2 border border-gray-200" rows={4} placeholder="Short summary or requirements" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Attach file (optional)</label>
              <div className="mt-1 flex items-center gap-3">
                <input ref={fileRef} type="file" onChange={handleFile} className="text-sm" />
                {file && <span className="text-sm text-gray-600">{file.name}</span>}
                {uploadProgress > 0 && <span className="text-sm text-gray-600 ml-2">{uploadProgress}% uploaded</span>}
              </div>
            </div>
            <button disabled={submitting} type="submit" className={`w-full py-2 rounded-md text-white ${submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {submitting ? 'Submitting...' : 'Submit Project'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Your Projects</h2>
          <div className="space-y-4">
            {loading && <div className="text-gray-500">Loading...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && projects.length === 0 && <div className="text-gray-500">No projects yet</div>}
            {projects.map(p => (
              <div key={p.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-medium">{p.title}</h3>
                  <p className="text-sm text-gray-600">{p.summary}</p>
                  {p.fileUrl && <div className="text-sm mt-1"><a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600">Attachment</a></div>}
                </div>
                <div className="mt-3 md:mt-0 flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'accepted' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{p.status}</span>
                  <div className="text-sm text-gray-500">{new Date(p.submittedAt).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditProject(p)} className="px-2 py-1 text-sm bg-yellow-100 text-yellow-800 rounded">Edit</button>
                    <button onClick={() => deleteProject(p.id)} disabled={deletingProjectId===p.id} className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded">{deletingProjectId===p.id ? 'Deleting...' : 'Delete'}</button>
                  </div>
                </div> 
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit project modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-lg p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Edit Project</h3>
              <button onClick={() => setEditingProject(null)} className="text-gray-500">Close</button>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border rounded w-full px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Summary</label>
                <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} className="border rounded w-full px-2 py-1" />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={saveEditProject} disabled={editLoading} className="px-3 py-2 bg-indigo-600 text-white rounded">{editLoading ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setEditingProject(null)} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDashboard