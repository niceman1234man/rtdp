import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/photo_2026-01-01_20-18-47.jpg'

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
        <div className="w-100 h-50 rounded-md  border border-gray-100">
          <img className="w-full h-full object-cover" src={logo} alt="Projects illustration" />
        </div>
      </div>

      <h2 className="mt-8 text-xl font-medium text-gray-900">Why RTDP Matters</h2>
      <p className="mt-2 text-gray-600">RTDP helps teams make better decisions faster by connecting submitters with expert reviewers and giving admins the tools to act on high-quality feedback.</p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-md border shadow-sm">
          <strong className="block text-gray-800">Expert Feedback</strong>
          <p className="text-gray-600">Connects submissions with qualified reviewers so feedback is informed, actionable, and focused on impact.</p>
        </div>

        <div className="p-4 bg-white rounded-md border shadow-sm">
          <strong className="block text-gray-800">Faster Decisions</strong>
          <p className="text-gray-600">Structured reviews and assignment workflows reduce review cycles and speed up acceptance or rejection.</p>
        </div>

        <div className="p-4 bg-white rounded-md border shadow-sm">
          <strong className="block text-gray-800">Transparent Process</strong>
          <p className="text-gray-600">All comments, decisions, and assignments are recorded — creating an auditable trail for accountability.</p>
        </div>

        <div className="p-4 bg-white rounded-md border shadow-sm">
          <strong className="block text-gray-800">Better Outcomes</strong>
          <p className="text-gray-600">Higher-quality reviews lead to stronger submissions, improved stakeholder confidence, and better project outcomes.</p>
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