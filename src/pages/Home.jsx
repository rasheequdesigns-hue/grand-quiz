import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { User, Phone, ArrowRight, Eye, Medal } from 'lucide-react'

export default function Home() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [setting, setSetting] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchSettings() {
      const { data, error } = await supabase
        .from('granddb')
        .select('*')
        .eq('record_type', 'setting')
        .single()
      
      if (data) {
        setSetting(data)
      }
    }
    fetchSettings()
  }, [])

  const handleStart = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!name || !phone) {
      setError('Name and Phone are required')
      return
    }

    if (setting?.active_until && new Date() > new Date(setting.active_until)) {
      setError('The quiz deadline has expired.')
      return
    }

    setLoading(true)

    // Check if user already exists based on phone
    const { data: existingUser } = await supabase
      .from('granddb')
      .select('*')
      .eq('record_type', 'participant')
      .eq('phone', phone)
      .single()

    if (existingUser) {
      if (existingUser.submitted) {
        setError('You have already submitted the quiz.')
        setLoading(false)
        return
      }
      localStorage.setItem('participant_id', existingUser.id)
      navigate('/quiz')
      return
    }

    // Create new participant
    const { data, error: insertError } = await supabase
      .from('granddb')
      .insert({
        record_type: 'participant',
        name,
        phone,
        start_time: new Date().toISOString(),
        submitted: false
      })
      .select()
      .single()

    if (insertError) {
      console.error(insertError)
      setError('Error registering for quiz')
    } else {
      localStorage.setItem('participant_id', data.id)
      navigate('/quiz')
    }
    setLoading(false)
  }

  // Calculate if the quiz is active/configured
  const hasQuiz = setting?.name || setting?.active_until;
  const quizName = setting?.name || "The Grand Quiz..!";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 flex flex-col items-center">
      
      {/* 2. HERO SECTION & CALLIGRAPHY */}
      <div className="text-center w-full mb-10 flex flex-col items-center">
        {/* Arabic Calligraphy Bismillah */}
        <div className="text-3xl md:text-5xl font-arabic text-brand-green mb-4">
          بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ
        </div>
        
        {/* Sub-pill Badge */}
        <div className="inline-block bg-amber-100 text-amber-900 border border-amber-200 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
          🌙 ശൗഖെ റസൂൽ • TI MADRASA KOTTAKKAL
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Prophet Muhammad ﷺ Seerah Competition
        </h2>

        {/* Description Subtext */}
        <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto">
          Join TI MADRASA KOTTAKKAL's grand daily quiz celebrating the life, character, and legacy of Prophet Muhammad ﷺ. Build your student profile and earn badges!
        </p>
      </div>

      {/* 3. MAIN FORM CARD */}
      <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-10 mb-8 relative border border-slate-100">
        
        {/* Top Right Badge */}
        <div className="absolute top-6 right-6 bg-emerald-50 p-2 rounded-xl border border-emerald-100 hidden sm:block">
          <Medal className="w-6 h-6 text-brand-green" />
        </div>

        {/* Card Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-6 h-6 text-brand-green" />
            <h3 className="text-xl md:text-2xl font-bold text-slate-800">Participant Login & Profile Access</h3>
          </div>
          <p className="text-slate-500 text-sm md:text-base">Enter your details to attempt the quiz or view your profile.</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleStart}>
          {/* Input Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Left Input */}
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wide">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-blue-50/50 border border-slate-200 text-slate-800 rounded-xl block w-full pl-10 p-3.5 focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Right Input */}
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2 uppercase tracking-wide">
                Phone Number (Unique ID) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-blue-50/50 border border-slate-200 text-slate-800 rounded-xl block w-full pl-10 p-3.5 focus:ring-2 focus:ring-brand-green focus:border-transparent transition-all"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-green hover:bg-emerald-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? 'Processing...' : 'Attempt Selected Quiz →'}
            </button>
            <button
              type="button"
              className="flex-1 bg-amber-100/60 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <User className="w-5 h-5" />
              View My Full Profile
            </button>
          </div>
        </form>
      </div>

      {/* 4. FEATURED / GRAND QUIZ BANNER (Bottom Card) */}
      {hasQuiz && (
        <div className="w-full bg-slate-900 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border-2 border-brand-gold shadow-2xl relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-green/20 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 mb-6 md:mb-0 text-center md:text-left">
            {/* Top Badge */}
            <div className="inline-block border border-brand-gold text-brand-gold bg-black/30 px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
              👑 🏆 The Quiz Finale Grand Championship
            </div>
            
            {/* Headline */}
            <h4 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              {quizName}
            </h4>
            
            {/* Subtext */}
            {setting?.active_until && (
              <p className="text-slate-300 text-sm md:text-base">
                Event Deadline: {new Date(setting.active_until).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* CTA Button */}
          <div className="relative z-10 w-full md:w-auto">
            <button onClick={() => window.scrollTo(0, 0)} className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 transition-all transform hover:scale-105">
              <Eye className="w-5 h-5" />
              attent the grand quiz now
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
