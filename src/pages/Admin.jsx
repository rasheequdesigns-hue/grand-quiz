import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Trash2, Plus, Users, Settings as SettingsIcon, BookOpen, Filter, Trophy, Medal, Star, Upload, Image as ImageIcon, Edit } from 'lucide-react'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  
  const [activeTab, setActiveTab] = useState('leaderboard')
  
  const [setting, setSetting] = useState(null)
  const [duration, setDuration] = useState(30)
  const [activeUntil, setActiveUntil] = useState('')
  const [quizName, setQuizName] = useState('')
  const [quickHours, setQuickHours] = useState(24)

  // Certificate Config State
  const [certUrl, setCertUrl] = useState('')
  const [certX, setCertX] = useState(50)
  const [certY, setCertY] = useState(50)
  const [certFontSize, setCertFontSize] = useState(40)
  const [certColor, setCertColor] = useState('#000000')
  
  const [questions, setQuestions] = useState([])
  const [newQuestion, setNewQuestion] = useState({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' })
  const [editingId, setEditingId] = useState(null)
  const [bulkJson, setBulkJson] = useState('')
  
  const [participants, setParticipants] = useState([])
  const [answers, setAnswers] = useState([])

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === 'admin123') { 
      setIsAuthenticated(true)
      loadData()
    } else {
      alert('Incorrect password')
    }
  }

  const loadData = async () => {
    // Load Settings
    const { data: sData } = await supabase.from('granddb').select('*').eq('record_type', 'setting').single()
    if (sData) {
      setSetting(sData)
      setDuration(sData.duration_minutes || 30)
      setQuizName(sData.name || '')
      setCertUrl(sData.question_text || '')
      setCertX(sData.option_a ? Number(sData.option_a) : 50)
      setCertY(sData.option_b ? Number(sData.option_b) : 50)
      setCertFontSize(sData.option_c ? Number(sData.option_c) : 40)
      setCertColor(sData.option_d || '#000000')

      if (sData.active_until) {
        const date = new Date(sData.active_until)
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
        setActiveUntil(date.toISOString().slice(0, 16))
      }
    }

    // Load Questions
    const { data: qData } = await supabase.from('granddb').select('*').eq('record_type', 'question').order('id', { ascending: true })
    setQuestions(qData || [])

    // Load Participants
    const { data: pData } = await supabase.from('granddb').select('*').eq('record_type', 'participant').order('start_time', { ascending: false })
    setParticipants(pData || [])

    // Load Answers
    const { data: aData } = await supabase.from('granddb').select('*').eq('record_type', 'answer')
    setAnswers(aData || [])
  }

  const setDeadlineByHours = () => {
    const hours = parseFloat(quickHours)
    if (isNaN(hours) || hours <= 0) return alert('Please enter a valid number of hours')
    const d = new Date()
    d.setHours(d.getHours() + hours)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    setActiveUntil(d.toISOString().slice(0, 16))
  }

  const saveSettings = async () => {
    try {
      const payload = {
        record_type: 'setting', 
        duration_minutes: duration, 
        active_until: activeUntil ? new Date(activeUntil).toISOString() : null,
        name: quizName,
        question_text: certUrl,
        option_a: certX.toString(),
        option_b: certY.toString(),
        option_c: certFontSize.toString(),
        option_d: certColor
      }

      let error = null
      if (setting) {
        const res = await supabase.from('granddb').update(payload).eq('id', setting.id)
        error = res.error
      } else {
        const res = await supabase.from('granddb').insert(payload)
        error = res.error
      }

      if (error) {
        console.error("Save settings error:", error)
        alert('Failed to save settings! Error: ' + error.message)
        return
      }

      alert('Settings saved successfully!')
      loadData()
    } catch (err) {
      console.error(err)
      alert('Failed to save settings! Check console.')
    }
  }

  const saveQuestion = async (e) => {
    e.preventDefault()
    if (editingId) {
      await supabase.from('granddb').update({
        question_text: newQuestion.question_text,
        option_a: newQuestion.option_a,
        option_b: newQuestion.option_b,
        option_c: newQuestion.option_c,
        option_d: newQuestion.option_d,
        correct_option: newQuestion.correct_option
      }).eq('id', editingId)
      setEditingId(null)
      alert('Question updated!')
    } else {
      await supabase.from('granddb').insert({ record_type: 'question', ...newQuestion })
      alert('Question added!')
    }
    setNewQuestion({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' })
    loadData()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNewQuestion({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' })
  }

  const startEditQuestion = (q) => {
    setNewQuestion({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option
    })
    setEditingId(q.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setCertUrl(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(bulkJson)
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of questions')
      
      const insertData = parsed.map(q => {
        // Ensure options exist
        const option_a = q.option_a || q.optionA || q.options?.[0] || ''
        const option_b = q.option_b || q.optionB || q.options?.[1] || ''
        const option_c = q.option_c || q.optionC || q.options?.[2] || ''
        const option_d = q.option_d || q.optionD || q.options?.[3] || ''
        
        let correct_option = 'A'
        if (q.correct_option) {
          correct_option = q.correct_option.toUpperCase()
        } else if (q.answer) {
          // If the answer is text, figure out which option it matches
          const ansText = q.answer.toString().trim().toLowerCase()
          if (ansText === option_a.toLowerCase()) correct_option = 'A'
          else if (ansText === option_b.toLowerCase()) correct_option = 'B'
          else if (ansText === option_c.toLowerCase()) correct_option = 'C'
          else if (ansText === option_d.toLowerCase()) correct_option = 'D'
          // If answer is letter
          else if (['a', 'b', 'c', 'd'].includes(ansText)) correct_option = ansText.toUpperCase()
        }
        
        return {
          record_type: 'question',
          question_text: q.question_text || q.question || '',
          option_a,
          option_b,
          option_c,
          option_d,
          correct_option
        }
      })

      // Simple validation
      for (const item of insertData) {
        if (!item.question_text || !item.option_a) {
          throw new Error('Some questions are missing required fields (question_text or options).')
        }
        if (!['A', 'B', 'C', 'D'].includes(item.correct_option)) {
          throw new Error(`Invalid correct_option for question: "${item.question_text}". Must be A, B, C, or D.`)
        }
      }

      await supabase.from('granddb').insert(insertData)
      alert(`Successfully imported ${insertData.length} questions!`)
      setBulkJson('')
      loadData()
    } catch (err) {
      alert(`Error parsing JSON: ${err.message}`)
    }
  }

  const deleteQuestion = async (id) => {
    if (window.confirm('Delete this question?')) {
      await supabase.from('granddb').delete().eq('id', id)
      loadData()
    }
  }

  const deleteParticipant = async (id) => {
    if (window.confirm('Delete this participant and all their answers?')) {
      await supabase.from('granddb').delete().eq('record_type', 'answer').eq('participant_id', id)
      await supabase.from('granddb').delete().eq('id', id)
      loadData()
    }
  }

  const calculateScore = (pId) => {
    const pAnswers = answers.filter(a => a.participant_id === pId)
    let score = 0
    pAnswers.forEach(ans => {
      const q = questions.find(q => q.id === ans.question_id)
      if (q && q.correct_option === ans.selected_option) {
        score++
      }
    })
    return score
  }

  const getLeaderboard = () => {
    const leaderboard = participants.map(p => {
      const score = calculateScore(p.id)
      const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
      return { ...p, score, accuracy, quizzes: 1 }
    })
    leaderboard.sort((a, b) => b.score - a.score || new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    return leaderboard
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto mt-20 bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Admin Panel</h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter password"
            className="w-full border border-slate-200 p-3 rounded-xl mb-4 bg-slate-50 focus:ring-2 focus:ring-brand-green outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-brand-green text-white p-3 rounded-xl font-bold shadow-lg shadow-emerald-200">Login</button>
        </form>
      </div>
    )
  }

  const leaderboard = getLeaderboard()
  const top3 = leaderboard.slice(0, 3)

  return (
    <div className="bg-slate-50 min-h-[80vh] w-full max-w-7xl mx-auto py-8">
      
      {/* Top Nav Tabs */}
      <div className="flex gap-4 mb-8 border-b pb-4 overflow-x-auto px-4">
        <button onClick={() => setActiveTab('leaderboard')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-brand-green text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
          <Trophy size={20} /> Leaderboard
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-brand-green text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
          <SettingsIcon size={20} /> Quiz Settings
        </button>
        <button onClick={() => setActiveTab('certificate')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'certificate' ? 'bg-brand-green text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
          <ImageIcon size={20} /> Certificate Config
        </button>
        <button onClick={() => setActiveTab('questions')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'questions' ? 'bg-brand-green text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
          <BookOpen size={20} /> Questions
        </button>
      </div>

      {/* Main Content */}
      <div className="px-4 w-full">
        
        {activeTab === 'certificate' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-8 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Certificate Template</h3>
              <p className="text-sm text-slate-500 mb-4">Upload an image for the certificate background and use the sliders to position the participant's name.</p>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Certificate Image</label>
                <div className="flex flex-col gap-2">
                  <input type="file" accept="image/*" className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-brand-green outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-brand-green file:text-white hover:file:bg-emerald-600 cursor-pointer" onChange={handleImageUpload} />
                  {certUrl && <span className="text-xs text-brand-green font-bold">Image loaded successfully</span>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">X Position (Horizontal %): {certX}%</label>
                <input type="range" min="0" max="100" value={certX} onChange={e => setCertX(e.target.value)} className="w-full" />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Y Position (Vertical %): {certY}%</label>
                <input type="range" min="0" max="100" value={certY} onChange={e => setCertY(e.target.value)} className="w-full" />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Font Size (px)</label>
                  <input type="number" className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full" value={certFontSize} onChange={e => setCertFontSize(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Font Color</label>
                  <input type="color" className="h-[50px] w-full rounded-xl cursor-pointer" value={certColor} onChange={e => setCertColor(e.target.value)} />
                </div>
              </div>

              <button onClick={saveSettings} className="w-full bg-brand-green text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-transform">Save Certificate Config</button>
            </div>

            <div className="flex-1 bg-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-200 overflow-hidden">
              <h4 className="font-bold text-slate-600 mb-4">Live Preview</h4>
              <div className="relative w-full max-w-lg aspect-[1.414/1] bg-white shadow-md rounded flex items-center justify-center overflow-hidden border">
                {certUrl ? (
                  <>
                    <img src={certUrl} alt="Certificate Background" className="absolute inset-0 w-full h-full object-contain" />
                    <div 
                      className="absolute font-bold whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2"
                      style={{ 
                        left: `${certX}%`, 
                        top: `${certY}%`,
                        fontSize: `${certFontSize}px`,
                        color: certColor
                      }}
                    >
                      John Doe
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400">No Image Provided</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-xl">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Quiz Configuration</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Quiz Event Title (Shown on Banner)</label>
                <input type="text" className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-brand-green outline-none" value={quizName} onChange={e => setQuizName(e.target.value)} placeholder="e.g. The Grand Quiz..!" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Duration per participant (minutes)</label>
                <input type="number" className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full focus:ring-2 focus:ring-brand-green outline-none" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              
              <div className="border-t border-slate-100 pt-6">
                <label className="block text-sm font-bold text-slate-700 mb-4">Global Expiry Deadline</label>
                
                {/* Hours Quick Set */}
                <div className="flex gap-2 items-end mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Quick Set: Add Hours From Now</label>
                    <input type="number" className="border border-slate-300 p-2 rounded-lg w-full outline-none focus:ring-2 focus:ring-brand-green" value={quickHours} onChange={e => setQuickHours(e.target.value)} />
                  </div>
                  <button onClick={setDeadlineByHours} type="button" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
                    Set Date
                  </button>
                </div>
                
                {/* Specific Date input */}
                <label className="block text-xs font-bold text-slate-500 mb-1">Or Pick Specific Date & Time</label>
                <input type="datetime-local" className="bg-white border border-slate-300 p-3 rounded-xl w-full focus:ring-2 focus:ring-brand-green outline-none" value={activeUntil} onChange={e => setActiveUntil(e.target.value)} />
              </div>
              
              <button onClick={saveSettings} className="w-full bg-brand-gold text-white px-4 py-3 rounded-xl font-bold hover:bg-yellow-600 shadow-lg shadow-amber-200 transition-transform hover:-translate-y-0.5">Save Settings</button>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div>
            {/* Bulk Import */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-900/20 border border-slate-800 mb-8 text-white">
              <h4 className="font-bold text-xl mb-2 flex items-center gap-2"><Upload size={20} /> Bulk Import Questions (JSON)</h4>
              <p className="text-slate-400 text-sm mb-4">Paste an array of questions. Supports auto-mapping of correct answers.</p>
              <textarea 
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl font-mono text-sm focus:ring-2 focus:ring-brand-green outline-none resize-y mb-4" 
                rows="6" 
                value={bulkJson} 
                onChange={e => setBulkJson(e.target.value)} 
                placeholder={`[
  {
    "question": "What is the capital of France?",
    "options": ["Paris", "London", "Berlin", "Madrid"],
    "answer": "Paris" 
  }
]`} 
              />
              <button onClick={handleBulkImport} className="bg-brand-green hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full sm:w-auto">Import JSON</button>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
              <h4 className="font-bold text-xl text-slate-800 mb-6">{editingId ? 'Edit Question' : 'Add Single Question'}</h4>
              <form onSubmit={saveQuestion} className="space-y-6">
                <textarea placeholder="Question Text" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-brand-green outline-none resize-none" rows="3" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Option A" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand-green outline-none" value={newQuestion.option_a} onChange={e => setNewQuestion({...newQuestion, option_a: e.target.value})} />
                  <input placeholder="Option B" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand-green outline-none" value={newQuestion.option_b} onChange={e => setNewQuestion({...newQuestion, option_b: e.target.value})} />
                  <input placeholder="Option C" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand-green outline-none" value={newQuestion.option_c} onChange={e => setNewQuestion({...newQuestion, option_c: e.target.value})} />
                  <input placeholder="Option D" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand-green outline-none" value={newQuestion.option_d} onChange={e => setNewQuestion({...newQuestion, option_d: e.target.value})} />
                </div>
                <div className="flex items-center gap-4">
                  <label className="font-bold text-slate-700">Correct Option:</label>
                  <select className="bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-brand-green outline-none" value={newQuestion.correct_option} onChange={e => setNewQuestion({...newQuestion, correct_option: e.target.value})}>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="bg-brand-green text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-200 w-full md:w-auto">
                    {editingId ? <Edit size={20} /> : <Plus size={20} />} 
                    {editingId ? 'Update Question' : 'Add Question'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={cancelEdit} className="bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold shadow-sm w-full md:w-auto">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="border border-slate-100 p-6 rounded-2xl flex justify-between items-start bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-full">
                    <p className="font-bold text-lg text-slate-800 mb-3">Q{idx + 1}. {q.question_text}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className={`p-3 rounded-xl border ${q.correct_option === 'A' ? 'bg-emerald-50 border-emerald-200 font-bold text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>A: {q.option_a}</div>
                      <div className={`p-3 rounded-xl border ${q.correct_option === 'B' ? 'bg-emerald-50 border-emerald-200 font-bold text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>B: {q.option_b}</div>
                      <div className={`p-3 rounded-xl border ${q.correct_option === 'C' ? 'bg-emerald-50 border-emerald-200 font-bold text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>C: {q.option_c}</div>
                      <div className={`p-3 rounded-xl border ${q.correct_option === 'D' ? 'bg-emerald-50 border-emerald-200 font-bold text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>D: {q.option_d}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button onClick={() => startEditQuestion(q)} className="text-blue-400 hover:text-blue-600 p-3 hover:bg-blue-50 rounded-xl transition-colors"><Edit size={24}/></button>
                    <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-600 p-3 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="w-full">
            
            {/* FILTER BAR */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-col sm:flex-row justify-between items-center px-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-0">
                <Filter className="text-slate-400" size={20} />
                <span className="font-bold text-slate-800 text-sm tracking-wide">FILTER RANKINGS BY:</span>
              </div>
              <select className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-brand-green font-semibold cursor-pointer">
                <option>All-Time Cumulative</option>
                <option>Today's Event</option>
                <option>This Week</option>
              </select>
            </div>

            {/* TOP 3 WINNERS PODIUM CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {/* Card 1: GOLD */}
              {top3[0] && (
                <div className="bg-[#b45309] rounded-3xl p-6 text-white shadow-xl shadow-amber-900/20 relative overflow-hidden transform md:-translate-y-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-white/30 backdrop-blur-sm">GOLD MEDALIST 🥇</span>
                    <Trophy className="text-amber-300" size={28} />
                  </div>
                  <div className="mb-8 relative z-10">
                    <h3 className="text-2xl font-extrabold truncate">{top3[0].name}</h3>
                    <p className="text-amber-200/80 text-sm mt-1">{top3[0].phone}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4 relative z-10">
                    <div>
                      <p className="text-xs text-amber-200/70 font-bold mb-1">SCORE</p>
                      <p className="text-2xl font-bold">{top3[0].score} pts</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-200/70 font-bold mb-1">ACCURACY</p>
                      <p className="text-2xl font-bold">{top3[0].accuracy}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 2: SILVER */}
              {top3[1] && (
                <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-white/20 backdrop-blur-sm">SILVER MEDALIST 🥈</span>
                    <Star className="text-slate-300" size={28} />
                  </div>
                  <div className="mb-8 relative z-10">
                    <h3 className="text-xl font-extrabold truncate">{top3[1].name}</h3>
                    <p className="text-slate-400 text-sm mt-1">{top3[1].phone}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 relative z-10">
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">SCORE</p>
                      <p className="text-xl font-bold">{top3[1].score} pts</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">ACCURACY</p>
                      <p className="text-xl font-bold">{top3[1].accuracy}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: BRONZE */}
              {top3[2] && (
                <div className="bg-[#78350f] rounded-3xl p-6 text-white shadow-xl shadow-amber-900/20 relative overflow-hidden mt-4 md:mt-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-white/20 backdrop-blur-sm">BRONZE MEDALIST 🥉</span>
                    <Medal className="text-amber-500" size={28} />
                  </div>
                  <div className="mb-8 relative z-10">
                    <h3 className="text-xl font-extrabold truncate">{top3[2].name}</h3>
                    <p className="text-amber-200/60 text-sm mt-1">{top3[2].phone}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 relative z-10">
                    <div>
                      <p className="text-xs text-amber-200/60 font-bold mb-1">SCORE</p>
                      <p className="text-xl font-bold">{top3[2].score} pts</p>
                    </div>
                    <div>
                      <p className="text-xs text-amber-200/60 font-bold mb-1">ACCURACY</p>
                      <p className="text-xl font-bold">{top3[2].accuracy}%</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* COMPLETE LEADERBOARD TABLE CARD */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Trophy className="text-brand-green" size={24} />
                  <h3 className="text-xl font-bold text-slate-800">Complete Leaderboard (Ranked Top to Bottom)</h3>
                </div>
                <div className="hidden sm:block text-slate-500 font-semibold bg-slate-100 px-4 py-1.5 rounded-full text-sm">
                  {participants.length} Participants
                </div>
              </div>

              <div className="overflow-x-auto p-4 md:p-6">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold rounded-t-xl">
                      <th className="py-4 px-6 text-left rounded-tl-xl">RANK</th>
                      <th className="py-4 px-6 text-left">NAME</th>
                      <th className="py-4 px-6 text-left">PHONE</th>
                      <th className="py-4 px-6 text-left">SCORE</th>
                      <th className="py-4 px-6 text-left">ACCURACY</th>
                      <th className="py-4 px-6 text-center">QUIZZES</th>
                      <th className="py-4 px-6 text-center rounded-tr-xl">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((p, index) => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <span className={`font-bold ${index < 3 ? 'text-brand-gold text-lg' : 'text-slate-700'}`}>#{index + 1}</span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">{p.name}</td>
                        <td className="py-4 px-6 text-slate-500 text-sm font-medium">{p.phone}</td>
                        <td className="py-4 px-6 font-extrabold text-brand-green">{p.score} pts</td>
                        <td className="py-4 px-6 font-bold text-slate-700">{p.accuracy}%</td>
                        <td className="py-4 px-6 text-center font-semibold text-slate-600">{p.quizzes}</td>
                        <td className="py-4 px-6 text-center">
                          <button className="bg-emerald-50 text-brand-green hover:bg-emerald-100 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold transition-colors mr-2" onClick={() => {}}>
                            Inspect
                          </button>
                          <button onClick={() => deleteParticipant(p.id)} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-1.5 rounded-full text-xs font-bold transition-colors">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-10 text-center text-slate-500">No participants yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
