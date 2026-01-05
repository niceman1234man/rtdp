import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance'
import { FaUserPlus, FaCheck, FaTimes, FaComments, FaEdit, FaTrash } from 'react-icons/fa' 
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function AdminDashboard() {
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
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [comments, setComments] = useState([])
  const [assigning, setAssigning] = useState(false)
  const [decisionLoading, setDecisionLoading] = useState(false)

  const [editingReviewer, setEditingReviewer] = useState(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out')
    navigate('/login')
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Ensure no stale modal state remains on mount and support Esc to close
  useEffect(() => {
    setSelectedProject(null)
    setEditingReviewer(null)
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSelectedProject(null)
        setEditingReviewer(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pRes, rRes] = await Promise.all([
        axiosInstance.get('/api/projects'),
        axiosInstance.get('/api/reviewers'),
      ])
      console.log('GET /api/projects response (admin):', pRes.data)
      console.log('Project summaries (admin):', (pRes.data || []).map(d => d.summary))
      // normalize ids for UI
      const projectsData = (pRes.data || []).map(p => ({
        ...p,
        id: p._id || p.id,
        assignedReviewers: (p.assignedReviewers || []).map(r => ({ ...r, id: r._id || r.id }))
      }))
      const reviewersData = (rRes.data || []).map(r => ({ ...r, id: r._id || r.id }))
      setProjects(projectsData)
      setReviewers(reviewersData)
    } catch (err) {
      console.error('Failed to fetch admin data', err)
      // fallback mock data
      setProjects([
              ])
      setReviewers([
      ])
    } finally {
      setLoading(false)
    }
  }

  const openComments = async (project) => {
    setSelectedProject(project)
    try {
      const projectId = project.id || project._id
      const res = await axiosInstance.get(`/api/projects/${projectId}/reviews`)
      setComments(res.data || [])
    } catch (err) {
      console.error('Failed to load comments', err)
      toast.error('Failed to load comments')
      setComments([])
    }
  }

  const assignReviewer = async (projectId, reviewerId) => {
    // guard: prevent assigning to finalized projects
    const proj = projects.find(x => (x.id === projectId || x._id === projectId))
    if (proj && (proj.status === 'accepted' || proj.status === 'rejected')) {
      toast.error('Cannot assign reviewers to accepted or rejected projects')
      return
    }
    setAssigning(true)
    try {
      // API: POST /api/projects/:id/assign { reviewerId }
      const res = await axiosInstance.post(`/api/projects/${projectId}/assign`, { reviewerId })
      const updated = res.data || null
      if (updated) {
        // normalize and replace project in state; ensure status reflects that it's now under review
        const normalized = {
          ...updated,
          id: updated._id || updated.id,
          status: updated.status || 'in-review',
          assignedReviewers: (updated.assignedReviewers||[]).map(r => ({ ...r, id: r._id || r.id }))
        }
        setProjects(ps => ps.map(p => (p.id === normalized.id ? normalized : p)))
      } else {
        // fallback to refetch if response isn't the updated project
        fetchData()
      }
      toast.success('Reviewer assigned')
    } catch (err) {
      console.error('Assign failed', err)
      toast.error('Failed to assign reviewer. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const unassignReviewer = async (projectId, reviewerId) => {
    // guard: prevent unassigning on finalized projects
    const proj = projects.find(x => (x.id === projectId || x._id === projectId))
    if (proj && (proj.status === 'accepted' || proj.status === 'rejected')) {
      toast.error('Cannot modify reviewers for accepted or rejected projects')
      return
    }
    setAssigning(true)
    try {
      const res = await axiosInstance.post(`/api/projects/${projectId}/unassign`, { reviewerId })
      const updated = res.data || null
      if (updated) {
        const normalized = { ...updated, id: updated._id || updated.id, assignedReviewers: (updated.assignedReviewers||[]).map(r => ({ ...r, id: r._id || r.id })) }
        setProjects(ps => ps.map(p => (p.id === normalized.id ? normalized : p)))
      } else {
        fetchData()
      }
      toast.success('Reviewer removed')
    } catch (err) {
      console.error('Unassign failed', err)
      toast.error('Failed to remove reviewer. Please try again.')
    } finally {
      setAssigning(false)
    }
  }

  const decideProject = async (projectId, decision) => {
    // client-side guard: prevent flips if already finalized
    const proj = projects.find(x => (x.id === projectId || x._id === projectId))
    if (proj && (proj.status === 'accepted' || proj.status === 'rejected')) {
      toast.error('Decision already finalized and cannot be changed')
      return
    }
    // client-side guard: ensure the project has assigned reviewers or at least one review/comment
    if (proj && ((proj.assignedReviewers || []).length === 0 && (proj.reviews || []).length === 0)) {
      toast.error('Cannot accept/reject: assign a reviewer or wait for a review/comment')
      return
    }

    setDecisionLoading(true)
    try {
      const res = await axiosInstance.post(`/api/projects/${projectId}/decision`, { decision })
      const updated = res.data || null
      if (updated) {
        const normalized = { ...updated, id: updated._id || updated.id, assignedReviewers: (updated.assignedReviewers||[]).map(r => ({ ...r, id: r._id || r.id })) }
        setProjects(ps => ps.map(p => (p.id === normalized.id ? normalized : p)))
        if (updated.emailSent) {
          toast.success('Project decision saved and notification sent to submitter')
        } else {
          toast.success(`Project ${decision === 'accept' ? 'accepted' : 'rejected'}`)
          // attempt to use submitter email automatically; if missing, show info
          if (!updated.clientEmail && !(updated.submittedBy && updated.submittedBy.email)) {
            toast.info('Decision saved but no submitter email available for notification')
          } else {
            toast.info('Decision saved but notification could not be sent')
          }
        }
      } else {
        fetchData()
        toast.success(`Project ${decision === 'accept' ? 'accepted' : 'rejected'}`)
      }
    } catch (err) {
        console.error('Decision failed', err)
        // surface server-side message when the decision was rejected due to missing reviewers/comments
        const serverMsg = err?.response?.data?.message
        const status = err?.response?.status
        if (serverMsg) {
          toast.error(serverMsg)
        } else if (status) {
          toast.error(`Request failed (${status}): ${err.message || 'Server error'}`)
        } else {
          toast.error(err?.message || 'Failed to apply decision. Please try again.')
        }
        // helpful debug traces
        if (err?.response) console.error('Decision response data:', err.response.data)
    } finally {
      setDecisionLoading(false)
    }
  }

  const openEditReviewer = (r) => {
    setEditingReviewer(r)
    // prefer explicit first/last fields, fall back to splitting a single `name` if present
    if (r.firstName || r.lastName) {
      setEditFirstName(r.firstName || '')
      setEditLastName(r.lastName || '')
    } else if (r.name) {
      const parts = String(r.name).trim().split(/\s+/)
      setEditFirstName(parts[0] || '')
      setEditLastName(parts.slice(1).join(' ') || '')
    } else {
      setEditFirstName('')
      setEditLastName('')
    }
    setEditEmail(r.email || '')
    setEditTitle(r.title || '')
  }

  const saveEditReviewer = async () => {
    if (!editingReviewer) return
    setEditLoading(true)
    try {
      const payload = { firstName: editFirstName, lastName: editLastName, email: editEmail, title: editTitle }
      const reviewerId = editingReviewer._id || editingReviewer.id
      const res = await axiosInstance.put(`/api/reviewers/${reviewerId}`, payload)
      const updated = res.data || { ...editingReviewer, ...payload }
      setReviewers(rs => rs.map(x => ((x._id || x.id) === (updated._id || updated.id) ? updated : x)))
      toast.success('Reviewer updated')
      setEditingReviewer(null)
    } catch (err) {
      console.error('Update failed', err)
      toast.error('Update failed. Please try again.')
      setEditingReviewer(null)
    } finally {
      setEditLoading(false)
    }
  }

  const deleteReviewer = async (id) => {
    if (!window.confirm('Delete this reviewer?')) return
    setDeletingId(id)
    try {
      await axiosInstance.delete(`/api/reviewers/${id}`)
      setReviewers(rs => rs.filter(r => (r._id || r.id) !== id))
      toast.success('Reviewer deleted')
    } catch (err) {
      console.error('Delete failed', err)
      toast.error('Failed to delete reviewer. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }




  // Defensive: hide stray global overlays (tailwind `bg-black/40`) that may persist
  useEffect(() => {
    const removeOverlays = () => {
      document.querySelectorAll('div').forEach(el => {
        try {
          if (!el.classList) return
          if (el.classList.contains('bg-black/40')) {
            // don't hide overlays that belong to this admin component
            if (!el.closest('#admin-root')) {
              el.style.display = 'none'
            }
          }
        } catch (e) {}
      })
    }
    // run once and watch for new nodes
    removeOverlays()
    const mo = new MutationObserver(removeOverlays)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])

  return (
    <div id="admin-root" className="max-w-6xl mx-auto p-6">
      <ToastContainer />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="flex gap-2 items-center">
          <button onClick={() => navigate('/admin/create-reviewer')} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white">
            <FaUserPlus /> Create Reviewer
          </button>
          <button onClick={() => navigate('/profile')} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white text-gray-800">Profile</button>
          <button onClick={logout} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 text-gray-800">Logout</button>
        </div>
      </div>

    {loading && <div className="text-gray-500">Loading...</div>}

      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Project</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Client</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Submitted</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reviewers</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 align-top">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-sm text-gray-600 mt-1" dangerouslySetInnerHTML={{ __html: (decodeHtml(p.summary) || '').slice(0, 160) + ((decodeHtml(p.summary)||'').length > 160 ? '...' : '') }} />
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-700">{p.client}</td>
                <td className="px-4 py-3 align-top text-sm text-gray-500">{p.submittedAt}</td>
                <td className="px-4 py-3 align-top">
                  <span className={`px-2 py-1 rounded-full text-xs ${p.status === 'accepted' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {(p.assignedReviewers || []).map(r => {
                        const isFinal = p.status === 'accepted' || p.status === 'rejected'
                        return (
                          <div key={(r._id || r.id)} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-sm">
                            <span>{`${(r.firstName || r.name || '')} ${(r.lastName || '').trim()}`.trim()}{r.title ? ` — ${r.title}` : ''}</span>
                            <button title="Remove reviewer" onClick={() => !isFinal && unassignReviewer(p.id, (r._id || r.id))} disabled={isFinal} className={`ml-2 ${isFinal ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}>×</button>
                          </div>
                        )
                      })}
                    </div>
                    <div>
                      {(() => {
                        const isFinal = p.status === 'accepted' || p.status === 'rejected'
                        return (
                          <select defaultValue="" onChange={(e) => !isFinal && assignReviewer(p.id, e.target.value)} disabled={isFinal} className={`border rounded px-2 py-1 text-sm ${isFinal ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}>
                            <option value="">Assign reviewer</option>
                            {reviewers.map(r => (
                              <option key={(r._id || r.id)} value={(r._id || r.id)}>{`${(r.firstName || r.name || '')} ${(r.lastName || '').trim()}`.trim()}{r.title ? ` — ${r.title}` : ''}</option>
                            ))}
                          </select>
                        )
                      })()}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openComments(p)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-50 text-indigo-700"> <FaComments/> </button>
                    {(() => {
                      const isFinal = p.status === 'accepted' || p.status === 'rejected'
                      const canDecide = !isFinal && (((p.assignedReviewers || []).length > 0) || ((p.reviews || []).length > 0))
                      return (
                        <>
                          <button disabled={decisionLoading || !canDecide} onClick={() => decideProject(p.id, 'accept')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-md ${canDecide ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}> <FaCheck/> </button>
                          <button disabled={decisionLoading || !canDecide} onClick={() => decideProject(p.id, 'reject')} className={`inline-flex items-center gap-2 px-3 py-2 rounded-md ${canDecide ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}> <FaTimes/> </button>
                        </>
                      )
                    })()}
                  </div>
                  {p.document && <div className="mt-2 text-right"><a href={p.document} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600">Attachment</a></div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

     {/* Reviewers list */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Reviewers</h2>
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {reviewers.map(r => (
                <tr key={(r._id || r.id)} className="hover:bg-gray-50">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{`${(r.firstName || r.name || '')} ${(r.lastName || '').trim()}`.trim()}</div>
                  </td>
                  <td className="px-4 py-3 align-top text-sm text-gray-700">{r.email}</td>
                  <td className="px-4 py-3 align-top text-sm text-gray-500">{r.title || '-'}</td>
                  <td className="px-4 py-3 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditReviewer(r)} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-100 text-yellow-800"><FaEdit/> Edit</button>
                      <button onClick={() => deleteReviewer(r._id || r.id)} disabled={deletingId===(r._id || r.id)} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-100 text-red-700">{deletingId===(r._id || r.id) ? 'Deleting...' : (<><FaTrash/> Delete</>)}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit reviewer modal */}
      {editingReviewer && (
        <div onClick={() => setEditingReviewer(null)} className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-lg p-6">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">Edit Reviewer</h3>
              <button onClick={() => setEditingReviewer(null)} className="text-gray-500">Close</button>
            </div>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">First Name</label>
                  <input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} className="border rounded w-full px-2 py-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Last Name</label>
                  <input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} className="border rounded w-full px-2 py-1" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Title / Profession</label>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border rounded w-full px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="border rounded w-full px-2 py-1" />
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={saveEditReviewer} disabled={editLoading} className="px-3 py-2 bg-indigo-600 text-white rounded">{editLoading ? 'Saving...' : 'Save'}</button>
                <button onClick={() => setEditingReviewer(null)} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}


     {/* Comments modal */}
      {selectedProject && (
        <div onClick={() => { setSelectedProject(null); setComments([]) }} className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Comments for {selectedProject.title}</h2>
                <p className="text-sm text-gray-500">{selectedProject.client} • {selectedProject.submittedAt}</p>
                {selectedProject.document && (
                  <div className="mt-1"><a href={selectedProject.document} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600">Open attachment</a></div>
                )}
              </div>
              <button onClick={() => { setSelectedProject(null); setComments([]) }} className="text-gray-500">Close</button>
            </div>
            <div className="mt-4 space-y-3 max-h-72 overflow-auto">
              {comments.length === 0 && <div className="text-gray-500">No comments yet</div>}
              {comments.map(c => (
                <div key={c.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{c.reviewerName || c.reviewer || c.reviewerName}</div>
                    <div className="text-xs text-gray-500">{c.decision || c.status || ''}</div>
                  </div>
                  <div className="mt-2 text-gray-700">{c.comment || c.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard