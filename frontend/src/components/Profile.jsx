import React, { useEffect, useState } from 'react'
import axiosInstance from '../utils/axiosInstance'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useNavigate } from 'react-router-dom'

function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState('profile')
  const [form, setForm] = useState({})
  const [pwd, setPwd] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) {
      navigate('/login')
      return
    }
    try {
      const u = JSON.parse(stored)
      setUser(u)
      fetchFull(u)
    } catch (e) {
      navigate('/login')
    }
  }, [])

  const fetchFull = async (u) => {
    setLoading(true)
    try {
      const id = u._id || u.id
      if (!id) return
      // determine reviewer role more reliably: prefer stored role, fall back to token
      let isReviewer = false
      if (u.role && String(u.role).toLowerCase() === 'reviewer') isReviewer = true
      else {
        try {
          const t = localStorage.getItem('token')
          if (t) {
            const p = JSON.parse(atob(t.split('.')[1]))
            if (p && p.role && String(p.role).toLowerCase() === 'reviewer') isReviewer = true
          }
        } catch (e) {
          // ignore decoding errors
        }
      }

      if (isReviewer || u.title) {
        const res = await axiosInstance.get(`/api/reviewers/${id}`)
        setForm(res.data || {})
        setUser(res.data || u)
      } else {
        const res = await axiosInstance.get(`/api/users/${id}`)
        setForm(res.data || {})
        setUser(res.data || u)
      }
    } catch (err) {
      console.error('Failed to load profile', err)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const saveProfile = async () => {
    if (!user) return
    setLoading(true)
    try {
      const id = user._id || user.id
      let res
      if (user.role === 'reviewer' || user.title) {
        res = await axiosInstance.put(`/api/reviewers/${id}`, form)
      } else {
        res = await axiosInstance.put(`/api/users/${id}`, form)
      }
      const updated = res.data
      // update localStorage user
      const stored = JSON.parse(localStorage.getItem('user') || '{}')
      const merged = { ...stored, ...updated }
      localStorage.setItem('user', JSON.stringify(merged))
      setUser(merged)
      toast.success('Profile updated')
      setEditing(false)
    } catch (err) {
      console.error('Failed to save profile', err)
      toast.error(err?.response?.data?.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async () => {
    if (!user) return
    if (!pwd.oldPassword || !pwd.newPassword || !pwd.confirmPassword) { toast.error('Fill all fields'); return }
    if (pwd.newPassword !== pwd.confirmPassword) { toast.error('New passwords do not match'); return }
    setLoading(true)
    try {
      const id = user._id || user.id
      let url
      if (user.role === 'reviewer' || user.title) url = `/api/reviewers/${id}/change-password`
      else url = `/api/users/${id}/change-password`
      await axiosInstance.post(url, pwd)
      toast.success('Password updated')
      setPwd({ oldPassword:'', newPassword:'', confirmPassword:'' })
    } catch (err) {
      console.error('Change password failed', err)
      toast.error(err?.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ToastContainer />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab('profile')} className={`px-3 py-2 rounded ${tab==='profile' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Profile</button>
          <button onClick={() => setTab('password')} className={`px-3 py-2 rounded ${tab==='password' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Change Password</button>
        </div>
      </div>

      {tab === 'profile' && (
        <div className="bg-white p-6 rounded shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">First name</label>
              <input value={form.firstName || ''} onChange={e => handleChange('firstName', e.target.value)} className="mt-1 w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm">Last name</label>
              <input value={form.lastName || ''} onChange={e => handleChange('lastName', e.target.value)} className="mt-1 w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm">Email</label>
              <input value={form.email || ''} onChange={e => handleChange('email', e.target.value)} className="mt-1 w-full border rounded p-2" />
            </div>
            {user.role !== 'reviewer' && (
              <>
                <div>
                  <label className="block text-sm">Organization</label>
                  <input value={form.organization || ''} onChange={e => handleChange('organization', e.target.value)} className="mt-1 w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm">Field of Study</label>
                  <input value={form.fieldOfStudy || ''} onChange={e => handleChange('fieldOfStudy', e.target.value)} className="mt-1 w-full border rounded p-2" />
                </div>
              </>
            )}
            {user.role === 'reviewer' && (
              <div>
                <label className="block text-sm">Title / Profession</label>
                <input value={form.title || ''} onChange={e => handleChange('title', e.target.value)} className="mt-1 w-full border rounded p-2" />
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="px-3 py-2 rounded bg-gray-200">Cancel</button>
            <button onClick={saveProfile} className="px-3 py-2 rounded bg-indigo-600 text-white">Save profile</button>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="bg-white p-6 rounded shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Old password</label>
              <input type="password" value={pwd.oldPassword} onChange={e => setPwd(p => ({ ...p, oldPassword: e.target.value }))} className="mt-1 w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm">New password</label>
              <input type="password" value={pwd.newPassword} onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))} className="mt-1 w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm">Confirm new password</label>
              <input type="password" value={pwd.confirmPassword} onChange={e => setPwd(p => ({ ...p, confirmPassword: e.target.value }))} className="mt-1 w-full border rounded p-2" />
            </div>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button onClick={() => setTab('profile')} className="px-3 py-2 rounded bg-gray-200">Cancel</button>
            <button onClick={changePassword} className="px-3 py-2 rounded bg-indigo-600 text-white">Change password</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile