import React, { useEffect, useRef, useState } from 'react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance'
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

  // Edit states
  const [editingProject, setEditingProject] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    fetchMyProjects()
  }, [])

  const fetchMyProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axiosInstance.get('/api/projects')
      setProjects(res.data.map(p => ({ ...p, id: p._id })))
    } catch (err) {
      setError('Failed to load projects')
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

    if (!file) {
      toast.error('Document attachment is required')
      return
    }

    setSubmitting(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('summary', summary)
      formData.append('document', file)

      const res = await axiosInstance.post('/api/projects', formData, {
        onUploadProgress: (e) => {
          if (e.total) {
            setUploadProgress(Math.round((e.loaded * 100) / e.total))
          }
        },
      })

      setProjects(prev => [{ ...res.data, id: res.data._id }, ...prev])

      setTitle('')
      setSummary('')
      setFile(null)
      setUploadProgress(0)
      fileRef.current.value = ''

      toast.success('Project submitted successfully')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit project')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditProject = (p) => {
    if (p.assignedReviewers?.length > 0) {
      toast.error('Project is under review and cannot be edited')
      return
    }
    setEditingProject(p)
    setEditTitle(p.title)
    setEditSummary(p.summary)
  }

  const saveEditProject = async () => {
    setEditLoading(true)
    try {
      const payload = { title: editTitle, summary: editSummary }
      const res = await axiosInstance.put(`/api/projects/${editingProject.id}`, payload)

      setProjects(ps =>
        ps.map(x =>
          x.id === res.data._id ? { ...res.data, id: res.data._id } : x
        )
      )

      toast.success('Project updated')
      setEditingProject(null)
    } catch (err) {
      toast.error('Failed to update project')
    } finally {
      setEditLoading(false)
    }
  }

  const deleteProject = async (id) => {
    const p = projects.find(x => x.id === id)
    if (p?.assignedReviewers?.length > 0) {
      toast.error('Project is under review and cannot be deleted')
      return
    }

    if (!window.confirm('Delete this project?')) return

    setDeletingProjectId(id)
    try {
      await axiosInstance.delete(`/api/projects/${id}`)
      setProjects(ps => ps.filter(p => p.id !== id))
      toast.success('Project deleted')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeletingProjectId(null)
    }
  }

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="max-w-5xl mx-auto p-6">

       <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">Reviewer Dashboard</h1>
              <div className="flex items-center gap-2">

                <button onClick={() => navigate('/profile')} className="px-3 py-2 rounded-md bg-white text-gray-800">Profile</button>
                <button onClick={logout} className="px-3 py-2 rounded-md bg-gray-100 text-gray-800">Logout</button>
              </div>
            </div>
      <ToastContainer />

      {/* Submit form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Submit Project</h2>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border p-2 w-full mb-3"
          placeholder="Project title"
        />

        <CKEditor
          editor={ClassicEditor}
          data={summary}
          onChange={(e, editor) => setSummary(editor.getData())}
        />

        <input ref={fileRef} type="file" onChange={handleFile} className="mt-3" />

        <button
          disabled={submitting}
          className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {/* Projects Table */}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {projects.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Title</th>
                <th className="px-4 py-2 border">Summary</th>
                <th className="px-4 py-2 border">Attachment</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-2 border font-semibold">{p.title}</td>
                  <td className="px-4 py-2 border text-sm text-gray-700">
                    <div dangerouslySetInnerHTML={{ __html: p.summary }} />
                  </td>
                  <td className="px-4 py-2 border">
                    <a href={typeof p.document === 'string' ? p.document : p.document?.url || '#'} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm">
                      Attachment
                    </a>
                  </td>
                  <td className="px-4 py-2 border">
                    <button onClick={() => openEditProject(p)} className="text-sm bg-yellow-100 px-2 py-1 rounded mr-2">
                      Edit
                    </button>
                    <button
                      onClick={() => deleteProject(p.id)}
                      disabled={deletingProjectId === p.id}
                      className="text-sm bg-red-100 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-full max-w-lg">
            <h3 className="font-semibold mb-3">Edit Project</h3>

            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="border p-2 w-full mb-3"
            />

            <CKEditor
              editor={ClassicEditor}
              data={editSummary}
              onChange={(e, editor) => setEditSummary(editor.getData())}
            />

            <div className="flex gap-2 mt-3">
              <button onClick={saveEditProject} className="bg-indigo-600 text-white px-3 py-2 rounded">
                Save
              </button>
              <button onClick={() => setEditingProject(null)} className="bg-gray-200 px-3 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDashboard
