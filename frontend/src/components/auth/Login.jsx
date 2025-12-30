import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaLock, FaSpinner, FaEye, FaEyeSlash } from "react-icons/fa";
import axiosInstance from "../../utils/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Note: this component does not require redux; it stores token/user in localStorage and optionally calls onLogin(user)


function Login({ onClose, isVisitor = false, onLogin }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUsers] = useState({ email: "", password: "" });
  const didLogRef = useRef(false);
  const emailRef = useRef(null);

  // autofocus email field on mount for better UX
  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  // Get redirect URL from query parameter if it exists
  const getRedirectUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const redirect = searchParams.get('redirect');
    console.log("Redirect URL from query param:", redirect);
    return redirect || null;
  };

  // Debug login context - only log once
  useEffect(() => {
    if (!didLogRef.current) {
      console.log("Login component mounted with:");
      console.log("- isVisitor:", isVisitor);
      console.log("- Current path:", location.pathname);
      console.log("- Redirect URL:", getRedirectUrl());
      console.log("- Has onClose handler:", !!onClose);
      didLogRef.current = true;
    }
  }, []);

  const handleChange = (e) => {
    setUsers({ ...user, [e.target.name]: e.target.value });
    setError("");
  };

  // Function to display toast with consistent configuration
  const showToast = (message, type = "info") => {
    const toastOptions = {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    };

    switch (type) {
      case "success":
        toast.success(message, toastOptions);
        break;
      case "error":
        toast.error(message, toastOptions);
        break;
      case "info":
        toast.info(message, toastOptions);
        break;
      default:
        toast(message, toastOptions);
    }
  };

 
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user.email || !user.password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    
    try {
      // First try to log in as a staff member
      const staffEndpoint = "/api/users/login";
      const staffPayload = {
        email: user.email,
        password: user.password
      };
      
      console.log(`Trying staff login first with email: ${user.email}`);
      
      let successfulLogin = false;
      let response;
      
      try {
        // Try staff login first
        response = await axiosInstance.post(staffEndpoint, staffPayload);
        console.log("Staff login successful:", response.data);
        
        // If we get here, staff login was successful
      if (response.data && response.data.accessToken) {
          // Store token
        localStorage.setItem("token", response.data.accessToken);
          
          // Store user data
          const userData = response.data.userInfo;
          if (!userData) {
            throw new Error("User data missing from response");
          }
          
          console.log("Staff user info:", userData);
          // Save to localStorage and notify parent if provided
          localStorage.setItem("user", JSON.stringify(userData));
          if (typeof onLogin === 'function') onLogin(userData);
          
          // Check if user is activated
          if (userData) {
            showToast("Login successful", "success");
            
            // Check if there's a redirect URL
            const redirectUrl = getRedirectUrl();
            if (redirectUrl) {
              console.log(`Redirecting to: ${redirectUrl}`);
              navigate(redirectUrl);
              return;
            }
            
            // Navigate based on role
            const role = (userData.role || "").toLowerCase();
            console.log("User role:", role);
            
            switch (role) {
            case "user":
              navigate("/user-dashboard");
              break;
            // default fallback routes for other roles
            default:
              navigate("/");
              break;
          }
        } else {
          navigate("/block");
        }
          
          successfulLogin = true;
        }
      } catch (staffError) {
        console.log("Staff login failed, attempting reviewer login then visitor login...");
        // Try reviewer login before visitor login
        try {
          const reviewerEndpoint = '/api/reviewers/login';
          const reviewerPayload = { email: user.email, password: user.password };
          console.log('Trying reviewer login with:', reviewerPayload);
          const rRes = await axiosInstance.post(reviewerEndpoint, reviewerPayload);
          console.log('Reviewer login response:', rRes.data);
          if (rRes.data && rRes.data.accessToken) {
            localStorage.setItem('token', rRes.data.accessToken);
            const reviewerData = rRes.data.reviewer;
            localStorage.setItem('user', JSON.stringify(reviewerData));
            if (typeof onLogin === 'function') onLogin(reviewerData);
            showToast('Login successful', 'success');
            const redirectUrl = getRedirectUrl();
            if (redirectUrl) {
              navigate(redirectUrl);
            } else {
              navigate('/reviewer-dashboard');
            }
            successfulLogin = true;
          }
        } catch (revErr) {
          console.log('Reviewer login failed, trying visitor login...');
        }
      }
      

      
      // If we get here and successfulLogin is still false, something went wrong
      if (!successfulLogin) {
        throw new Error("Login failed. Invalid credentials.");
      }
      
    } catch (error) {
      console.error(`Login error:`, error);
      
      // Check specific error conditions
      if (error.response) {
        console.log(`Login failed with status:`, error.response.status);
        console.log(`Login error data:`, error.response.data);
        
        // Detailed logging for 401 errors
        if (error.response.status === 401) {
          console.log("401 Unauthorized Error Details:");
          console.log("- Request URL:", error.config.url);
          console.log("- Request Method:", error.config.method);
          console.log("- Request Headers:", error.config.headers);
          console.log("- Response Headers:", error.response.headers);
          
          // Show specific response data structure
          console.log("- Error response structure:", Object.keys(error.response.data));
          
          setError("Invalid email or password. Please try again.");
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError("Login failed. Please check your credentials and try again.");
        }
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Login failed. Please try again.");
      }
      
      showToast(error.response?.data?.message || "Login failed. Please check your credentials.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your email and password to continue</p>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                ref={emailRef}
                type="email"
                name="email"
                aria-label="Email address"
                autoComplete="email"
                placeholder="you@example.com"
                value={user.email}
                onChange={handleChange}
                className="pl-10 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                aria-label="Password"
                autoComplete="current-password"
                placeholder="Password"
                value={user.password}
                onChange={handleChange}
                className="pl-10 pr-10 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-gray-50 placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center text-sm">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600" />
              <span className="ml-2 text-gray-700">Remember me</span>
            </label>
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-indigo-600 hover:underline">Forgot?</button>
          </div>

          <button
            type="submit"
            className={`w-full py-2 rounded-md text-white font-medium transition ${user.email && user.password && !isLoading ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-400/60 cursor-not-allowed'}`}
            disabled={!user.email || !user.password || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <FaSpinner className="animate-spin mr-2" />
                Signing in...
              </div>
            ) : (
              'Sign in'
            )}
          </button>

          <div className="pt-2 text-center text-sm text-gray-600">
            Don't have an account? <button onClick={() => navigate('/signup')} className="text-indigo-600 hover:underline">Sign up</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
