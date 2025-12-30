import React, { useState, useEffect } from 'react'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-6">
            <a href="/" className="text-lg font-semibold tracking-wide text-gray-900">RTDP</a>
            <div className="hidden md:flex items-center gap-6">
              <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>

            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <a href="/login" className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100">Sign in</a>
              <a href="/signup" className="px-3 py-1 rounded-md text-sm text-white bg-indigo-600 hover:bg-indigo-700">Sign up</a>
            </div>

            <button
              className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
              onClick={() => setIsOpen(v => !v)}
            >
              <span className="sr-only">Toggle menu</span>
              {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden px-4 pb-4`} id="mobile-menu">
        <div className="flex flex-col gap-2">
          <a href="/" className="py-2 text-gray-700">Home</a>
          <a href="#about" className="py-2 text-gray-700">About</a>
          <a href="#contact" className="py-2 text-gray-700">Contact</a>
          <div className="flex gap-2 mt-2">
            <a href="/login" className="flex-1 text-center px-3 py-2 rounded-md border border-gray-200">Sign in</a>
            <a href="/signup" className="flex-1 text-center px-3 py-2 rounded-md bg-indigo-600 text-white">Sign up</a>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar