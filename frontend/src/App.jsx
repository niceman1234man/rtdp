import React from 'react'
import { Routes, Route } from "react-router-dom";
import Home from './pages/Home.jsx'
import ForgotPassword from './components/auth/ForgotPassword.jsx';
import Signup from './components/auth/Signup.jsx';
import Login from './components/auth/Login.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Dashboard from './components/reviewer/Dashboard.jsx';
import AdminDashboard from './components/admin/Dashboard.jsx';
import CreateReviewer from './components/admin/CreateReviewer.jsx';
import Profile from './components/Profile.jsx';
import UserDashboard from './components/user/Dashboard.jsx';
import ResetPassword from './components/auth/ResetPassword.jsx';
 

function App() {
  return (
    <div>
     
       
      <Routes>
        <Route path="/" element={
<Home />} />
           
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
        <Route path="/reviewer-dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/create-reviewer" element={<CreateReviewer />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Routes>
      
    </div>
  )
}

export default App 