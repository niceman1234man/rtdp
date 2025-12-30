import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Password from "../Password";
import { FaUser } from "react-icons/fa";
import { FaLock } from "react-icons/fa";
import axiosInstance from '../../utils/axiosInstance'
import { toast, ToastContainer } from 'react-toastify'; // Import toast & container
import 'react-toastify/dist/ReactToastify.css'; // Import toast CSS

function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initialUser = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    fieldOfStudy: "",
  };
  const [user, setUser] = useState(initialUser);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleUser = async(e) => {
    e.preventDefault();
    setError('')
    if (!user.firstName || !user.lastName || !user.email || !user.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (user.password !== user.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/users', {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          organization: user.organization,
          fieldOfStudy: user.fieldOfStudy,
          role:"user",
          password: user.password,
      });

      console.log(response); // Log response data for debugging

      if (response && response.data) {
          if (response.data.accessToken) {
            localStorage.setItem("token", response.data.accessToken);
          }
          toast.success("User Registered Successfully!");
          navigate('/login');
      }
  } catch (err) {
      console.error("Error during signup:", err); // Log error details
      const msg = err?.response?.data?.message || "An unexpected error occurred. Please try again.";
      setError(msg);
      toast.error(msg);
  } finally {
      setLoading(false); // Reset loading state
  }
    
    setUser(initialUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <ToastContainer />
        <h1 className="text-2xl font-semibold mb-1 text-center">Create your account</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Sign up to access reviewer tools</p>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <form onSubmit={handleUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              className="px-3 py-2 border rounded w-full"
              value={user.firstName}
              onChange={handleChange}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="px-3 py-2 border rounded w-full"
              value={user.lastName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="sr-only">Email</label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="px-3 py-2 border rounded w-full"
              value={user.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <Password
              placeholder="Password"
              value={user.password}
              handleChange={handleChange}
            />
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="px-3 py-2 border rounded w-full"
              value={user.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <input
              type="text"
              name="organization"
              placeholder="Organization (optional)"
              className="px-3 py-2 border rounded w-full"
              value={user.organization}
              onChange={handleChange}
            />
          </div>

          <div>
            <input
              type="text"
              name="fieldOfStudy"
              placeholder="Field of Study (optional)"
              className="px-3 py-2 border rounded w-full"
              value={user.fieldOfStudy}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={!user.firstName || !user.lastName || !user.email || !user.password || user.password !== user.confirmPassword}
            className={`w-full py-2 px-3 rounded text-white font-semibold ${user.firstName && user.lastName && user.email && user.password && user.password === user.confirmPassword ? 'bg-blue-600' : 'bg-gray-300'}`}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account? <button onClick={() => navigate('/login')} className="text-purple-600 font-medium">Login</button>
        </div>
      </div>
    </div>
  );
}

export default Signup;
