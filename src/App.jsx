import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Admin from './pages/Admin'
import { User } from 'lucide-react'

import Certificate from './pages/Certificate'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        {/* Header & Top Navigation */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
            
            {/* Left Side */}
            <Link to="/" className="flex items-center gap-3">
              {/* Logo Icon */}
              <div className="bg-brand-green w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md">
                {/* SVG for Mosque Silhouette */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                  <path d="M12 2C12 2 10 4 10 6C10 8 12 10 12 10C12 10 14 8 14 6C14 4 12 2 12 2ZM4 10C4 10 2 12 2 14C2 16 4 18 4 18H20C20 18 22 16 22 14C22 12 20 10 20 10C20 10 18 12 18 14H6C6 12 4 10 4 10ZM12 11C9 11 7 13.5 7 17V22H17V17C17 13.5 15 11 12 11ZM11 18V22H13V18H11ZM6 22H2V18H6V22ZM22 22H18V18H22V22Z" />
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-xl md:text-2xl font-bold text-brand-green leading-tight">TI MADRASA KOTTAKKAL</h1>
                <div className="mt-1 inline-flex">
                  <span className="font-malayalam bg-amber-100 text-amber-900 text-xs md:text-sm px-3 py-0.5 rounded-full font-semibold shadow-sm">
                    ശൗഖെ റസൂൽ
                  </span>
                </div>
              </div>
            </Link>

            {/* Right Side */}
            <div>
              <Link 
                to="/admin" 
                className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2 px-4 rounded-full flex items-center gap-2 transition-colors shadow-sm"
              >
                <User size={16} />
                <span className="hidden sm:inline">Admin Access</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/certificate" element={<Certificate />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
