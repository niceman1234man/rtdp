import React from 'react'
import { Link } from 'react-router-dom'

function About() {
  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">About RTDP</h1>
          <p className="mt-2 text-gray-600">
            We connect clients, admins, and reviewers to streamline project submissions and
            feedback. Clients submit projects; admins assign reviewers; reviewers give
            constructive comments; admins accept or reject based on the reviews.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/submit" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Submit Your Project</Link>
            <Link to="/contact" className="inline-block bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">Contact Us</Link>
          </div>
        </div>
        <div className="w-36 h-36 rounded-md overflow-hidden border border-gray-100">
          <img className="w-full h-full object-cover" src="https://via.placeholder.com/280x280.png?text=Projects" alt="Projects illustration" />
        </div>
      </div>

      <h2 className="mt-8 text-xl font-medium text-gray-900">How it works</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-md border">
          <strong className="block text-gray-800">1. Submit</strong>
          <p className="text-gray-600">Clients create a clear project submission with files and details.</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-md border">
          <strong className="block text-gray-800">2. Assign</strong>
          <p className="text-gray-600">Admin assigns the project to one or more qualified reviewers.</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-md border">
          <strong className="block text-gray-800">3. Review</strong>
          <p className="text-gray-600">Reviewers leave structured comments and suggestions.</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-md border">
          <strong className="block text-gray-800">4. Decision</strong>
          <p className="text-gray-600">Admin accepts or rejects based on reviewer feedback.</p>
        </div>
      </div>

      <h2 className="mt-6 text-lg font-medium text-gray-900">Our values</h2>
      <p className="mt-2 text-gray-600">
        Clear communication, timely reviews, and actionable feedback — so your projects can
        move forward quickly.
      </p>
    </div>
  )
}

export default About