import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosInstance from '../../utils/axiosInstance';
import { FaLock, FaKey, FaArrowLeft, FaCheck } from 'react-icons/fa';

function ResetPassword() {
  const navigate = useNavigate();
  const { id, token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: '',
    color: 'gray-300'
  });

  // Check password strength
  const checkPasswordStrength = (password) => {
    let score = 0;
    let message = 'Very weak';
    let color = 'red-400';

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score >= 5) {
      message = 'Very strong';
      color = 'green-500';
    } else if (score >= 4) {
      message = 'Strong';
      color = 'green-400';
    } else if (score >= 3) {
      message = 'Medium';
      color = 'yellow-500';
    } else if (score >= 2) {
      message = 'Weak';
      color = 'orange-400';
    }

    setPasswordStrength({ score, message, color });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    // Form validation
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(`api/users/reset-password/${id}/${token}`, { password });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        toast.error(response.data.message || 'Error changing password. Please try again.');
      }
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMessage = error.response?.data?.message || 'Error changing password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
    
      
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
            <p className="text-gray-600 mt-2">Create a new secure password for your account</p>
          </div>
          
          <form onSubmit={onSubmitHandler} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    checkPasswordStrength(e.target.value);
                  }}
                  type="password"
                  placeholder="Enter new password"
                  className="block w-full pl-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                  minLength={8}
                />
              </div>
              {/* Password strength indicator */}
              {password && (
                <div className="mt-1">
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-${passwordStrength.color}`} 
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <p className={`text-xs mt-1 text-${passwordStrength.color}`}>
                    {passwordStrength.message}
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaKey className="text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="Confirm new password"
                  className="block w-full pl-10 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
              {/* Password match indicator */}
              {confirmPassword && (
                <p className={`text-xs mt-1 ${
                  password === confirmPassword ? 'text-green-500' : 'text-red-500'
                }`}>
                  {password === confirmPassword ? (
                    <span className="flex items-center">
                      <FaCheck className="mr-1" /> Passwords match
                    </span>
                  ) : 'Passwords do not match'}
                </p>
              )}
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>Reset Password</>
                )}
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center text-sm text-teal-600 hover:text-teal-800 font-medium"
              >
                <FaArrowLeft className="mr-2" /> Back to Login
              </button>
            </div>
          </form>
        </div>
      </main>
      
     
      
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}

export default ResetPassword;
