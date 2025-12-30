import React from 'react'

function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-gray-50 border-t border-gray-200 text-gray-700 text-sm" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="font-semibold tracking-wide">RTDP</div>
        <nav className="flex gap-4" aria-label="Footer navigation">
          <a className="text-gray-600 hover:text-gray-900" href="/">Home</a>
          <a className="text-gray-600 hover:text-gray-900" href="/about">About</a>
          <a className="text-gray-600 hover:text-gray-900" href="/contact">Contact</a>
        </nav>
        <div className="text-gray-500">©{year} Research Technology Development Project. All rights reserved.</div>
      </div>
    </footer>
  )
}

export default Footer