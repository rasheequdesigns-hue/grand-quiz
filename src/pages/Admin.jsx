import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  Trash2, Plus, Settings as SettingsIcon, BookOpen,
  Trophy, Medal, Star, Upload, Image as ImageIcon, Edit,
  ChevronDown, ChevronUp, Users, X, CheckCircle, XCircle, Clock as ClockIcon
} from 'lucide-react'

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  const [activeTab, setActiveTab] = useState('leaderboard')

  const [setting, setSetting] = useState(null)
  const [duration, setDuration] = useState(30)
  const [activeUntil, setActiveUntil] = useState('')
  const [quizName, setQuizName] = useState('')
  const [quickHours, setQuickHours] = useState(24)

  const [certUrl, setCertUrl] = useState('')
  const [certX, setCertX] = useState(50)
  const [certY, setCertY] = useState(50)
  const [certFontSize, setCertFontSize] = useState(40)
  const [certColor, setCertColor] = useState('#000000')

  const [questions, setQuestions] = useState([])
  const [newQuestion, setNewQuestion] = useState({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' })
  const [editingId, setEditingId] = useState(null)
  const [bulkJson, setBulkJson] = useState('')
  const [showBulk, setShowBulk] = useState(false)

  const [participants, setParticipants] = useState([])
  const [answers, setAnswers] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const [inspecting, setInspecting] = useState(null) // participant object being inspected

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === 'Uvais8893') {
      setIsAuthenticated(true)
      // loadData is triggered via useEffect below when isAuthenticated becomes true
    } else {
      alert('Incorrect password')
    }
  }

  // Trigger data load once authenticated
  useEffect(() => {
    if (isAuthenticated) loadData()
  }, [isAuthenticated])

  const loadData = async () => {
    setDataLoading(true)
    try {
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

      const { data: qData, error: qErr } = await supabase.from('granddb').select('*').eq('record_type', 'question').order('id', { ascending: true })
      if (qErr) console.error('Questions fetch error:', qErr)
      setQuestions(qData || [])

      const { data: pData, error: pErr } = await supabase.from('granddb').select('*').eq('record_type', 'participant').order('start_time', { ascending: false })
      if (pErr) console.error('Participants fetch error:', pErr)
      setParticipants(pData || [])

      const { data: aData, error: aErr } = await supabase.from('granddb').select('*').eq('record_type', 'answer')
      if (aErr) console.error('Answers fetch error:', aErr)
      setAnswers(aData || [])
    } finally {
      setDataLoading(false)
    }
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
      if (error) { alert('Failed to save: ' + error.message); return }
      alert('Settings saved!')
      loadData()
    } catch (err) {
      alert('Failed to save settings. Check console.')
      console.error(err)
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
    reader.onload = (event) => setCertUrl(event.target.result)
    reader.readAsDataURL(file)
  }

  const handleBulkImport = async () => {
    try {
      const parsed = JSON.parse(bulkJson)
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of questions')
      const insertData = parsed.map(q => {
        const option_a = q.option_a || q.optionA || q.options?.[0] || ''
        const option_b = q.option_b || q.optionB || q.options?.[1] || ''
        const option_c = q.option_c || q.optionC || q.options?.[2] || ''
        const option_d = q.option_d || q.optionD || q.options?.[3] || ''
        let correct_option = 'A'
        if (q.correct_option) {
          correct_option = q.correct_option.toUpperCase()
        } else if (q.answer) {
          const ansText = q.answer.toString().trim().toLowerCase()
          if (ansText === option_a.toLowerCase()) correct_option = 'A'
          else if (ansText === option_b.toLowerCase()) correct_option = 'B'
          else if (ansText === option_c.toLowerCase()) correct_option = 'C'
          else if (ansText === option_d.toLowerCase()) correct_option = 'D'
          else if (['a', 'b', 'c', 'd'].includes(ansText)) correct_option = ansText.toUpperCase()
        }
        return { record_type: 'question', question_text: q.question_text || q.question || '', option_a, option_b, option_c, option_d, correct_option }
      })
      for (const item of insertData) {
        if (!item.question_text || !item.option_a) throw new Error('Some questions are missing required fields.')
        if (!['A', 'B', 'C', 'D'].includes(item.correct_option)) throw new Error(`Invalid correct_option for: "${item.question_text}"`)
      }
      await supabase.from('granddb').insert(insertData)
      alert(`Successfully imported ${insertData.length} questions!`)
      setBulkJson('')
      setShowBulk(false)
      loadData()
    } catch (err) {
      alert(`Error: ${err.message}`)
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

  const formatTimeTaken = (p) => {
    if (!p.submit_time || !p.start_time) return 'N/A'
    const ms = new Date(p.submit_time).getTime() - new Date(p.start_time).getTime()
    if (ms <= 0) return 'N/A'
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return m + 'm ' + s + 's'
  }

    const calculateScore = (pId) => {
    const pAnswers = answers.filter(a => a.participant_id === pId)
    let score = 0
    pAnswers.forEach(ans => {
      const q = questions.find(q => q.id === ans.question_id)
      if (q && q.correct_option === ans.selected_option) score++
    })
    return score
  }

  const getLeaderboard = () => {
    const lb = participants.map(p => {
      const score = calculateScore(p.id)
      const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
      return { ...p, score, accuracy, quizzes: 1 }
    })
    lb.sort((a, b) => b.score - a.score || new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    return lb
  }

  /* ─── Login screen ─── */
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-sm mx-auto mt-16 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="flex items-center justify-center w-14 h-14 bg-brand-green rounded-2xl mx-auto mb-5">
            <SettingsIcon size={26} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-1">Admin Panel</h2>
          <p className="text-center text-slate-400 text-sm mb-6">Enter your password to continue</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-green outline-none text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full bg-brand-green text-white p-4 rounded-xl font-bold text-base shadow-lg shadow-emerald-200 active:scale-95 transition-transform">
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  const leaderboard = getLeaderboard()
  const top3 = leaderboard.slice(0, 3)

  /* ─── Tab config ─── */
  const tabs = [
    { id: 'leaderboard', label: 'Ranks',      icon: <Trophy size={20} /> },
    { id: 'questions',   label: 'Questions',  icon: <BookOpen size={20} /> },
    { id: 'settings',    label: 'Settings',   icon: <SettingsIcon size={20} /> },
    { id: 'certificate', label: 'Cert',       icon: <ImageIcon size={20} /> },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 md:pb-10">

      {/* ── Desktop top tabs (hidden on mobile) ── */}
      <div className="hidden md:flex gap-3 mb-8 border-b pb-4 px-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === t.id
                ? 'bg-brand-green text-white shadow-lg shadow-emerald-200'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.icon} {t.label === 'Ranks' ? 'Leaderboard' : t.label === 'Cert' ? 'Certificate Config' : t.label}
          </button>
        ))}
      </div>

      {/* ── Mobile sticky page title ── */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2">
        <div className="text-brand-green">{tabs.find(t => t.id === activeTab)?.icon}</div>
        <h1 className="font-bold text-slate-800 text-base">
          {{ leaderboard: 'Leaderboard', questions: 'Questions', settings: 'Settings', certificate: 'Certificate Config' }[activeTab]}
        </h1>
        <span className="ml-auto bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">
          {participants.length} users · {questions.length} Qs
        </span>
      </div>

      {/* ── Tab content ── */}
      <div className="px-3 md:px-4 pt-4 w-full">

        {/* ════════════════ LEADERBOARD ════════════════ */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-5">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Participants', value: participants.length, color: 'text-brand-green' },
                { label: 'Questions', value: questions.length, color: 'text-brand-gold' },
                { label: 'Submitted', value: participants.filter(p => p.submitted).length, color: 'text-slate-700' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
                  <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Top 3 podium — horizontal scroll on mobile */}
            {top3.length > 0 && (
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Top Winners</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                  {[
                    { data: top3[0], bg: 'bg-[#b45309]', badge: '🥇 Gold',    accent: 'text-amber-200' },
                    { data: top3[1], bg: 'bg-slate-800',  badge: '🥈 Silver',  accent: 'text-slate-300' },
                    { data: top3[2], bg: 'bg-[#78350f]',  badge: '🥉 Bronze',  accent: 'text-amber-200' },
                  ].filter(c => c.data).map((card, i) => (
                    <div key={i} className={`${card.bg} rounded-2xl p-4 text-white shadow-lg flex-shrink-0 w-52 snap-start`}>
                      <span className={`text-xs font-bold ${card.accent}`}>{card.badge}</span>
                      <p className="font-extrabold text-base mt-2 truncate">{card.data.name}</p>
                      <p className={`text-xs ${card.accent} opacity-70 truncate`}>{card.data.phone}</p>
                      <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
                        <div>
                          <p className={`text-xs ${card.accent} opacity-70`}>Score</p>
                          <p className="font-bold">{card.data.score} pts</p>
                        </div>
                        <div>
                          <p className={`text-xs ${card.accent} opacity-70`}>Accuracy</p>
                          <p className="font-bold">{card.data.accuracy}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full leaderboard — cards on mobile, table on desktop */}
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">All Participants</h2>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {leaderboard.map((p, index) => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50">
                      <span className={`text-lg font-extrabold w-8 text-center ${index < 3 ? 'text-brand-gold' : 'text-slate-400'}`}>
                        #{index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-brand-green text-base">{p.score} pts</p>
                        <p className="text-xs text-slate-500">{p.accuracy}% acc</p>
                      </div>
                    </div>
                    <div className="flex px-4 py-2 gap-2">
                      <button
                        onClick={() => setInspecting(p)}
                        className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-brand-green border border-emerald-100 active:bg-emerald-100 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteParticipant(p.id)}
                        className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-50 text-red-500 border border-red-100 active:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {leaderboard.length === 0 && (
                  <div className="text-center text-slate-400 py-16 font-semibold">No participants yet.</div>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-brand-green" size={22} />
                    <h3 className="text-lg font-bold text-slate-800">Complete Leaderboard</h3>
                  </div>
                  <span className="text-slate-500 font-semibold bg-slate-100 px-4 py-1.5 rounded-full text-sm">
                    {participants.length} Participants
                  </span>
                </div>
                <div className="overflow-x-auto p-4">
                  <table className="w-full min-w-[700px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                        <th className="py-4 px-5 text-left">Rank</th>
                        <th className="py-4 px-5 text-left">Name</th>
                        <th className="py-4 px-5 text-left">Phone</th>
                        <th className="py-4 px-5 text-left">Score</th>
                        <th className="py-4 px-5 text-left">Accuracy</th>
                        <th className="py-4 px-5 text-left">Time Taken</th>
                        <th className="py-4 px-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((p, index) => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-5">
                            <span className={`font-bold ${index < 3 ? 'text-brand-gold text-lg' : 'text-slate-600'}`}>#{index + 1}</span>
                          </td>
                          <td className="py-4 px-5 font-bold text-slate-800">{p.name}</td>
                          <td className="py-4 px-5 text-slate-500 text-sm">{p.phone}</td>
                          <td className="py-4 px-5 font-extrabold text-brand-green">{p.score} pts</td>
                          <td className="py-4 px-5 font-bold text-slate-700">{p.accuracy}%</td>
                          <td className="py-4 px-5 text-sm font-semibold text-slate-500">{formatTimeTaken(p)}</td>
                          <td className="py-4 px-5 text-center flex gap-2 justify-center">
                            <button
                              onClick={() => setInspecting(p)}
                              className="bg-emerald-50 text-brand-green hover:bg-emerald-100 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteParticipant(p.id)}
                              className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {leaderboard.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-10 text-center text-slate-400">No participants yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ QUESTIONS ════════════════ */}
        {activeTab === 'questions' && (
          <div className="space-y-5">

            {/* Bulk import — collapsible */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
              <button
                onClick={() => setShowBulk(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-white"
              >
                <div className="flex items-center gap-2 font-bold">
                  <Upload size={18} /> Bulk Import (JSON)
                </div>
                {showBulk ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              {showBulk && (
                <div className="px-5 pb-5 space-y-3">
                  <p className="text-slate-400 text-xs">Paste an array of question objects. Supports auto-mapping.</p>
                  <textarea
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl font-mono text-xs text-slate-200 focus:ring-2 focus:ring-brand-green outline-none resize-none"
                    rows="7"
                    value={bulkJson}
                    onChange={e => setBulkJson(e.target.value)}
                    placeholder={`[\n  {\n    "question": "...",\n    "options": ["A","B","C","D"],\n    "answer": "A"\n  }\n]`}
                  />
                  <button onClick={handleBulkImport} className="w-full bg-brand-green text-white py-3 rounded-xl font-bold active:scale-95 transition-transform">
                    Import Questions
                  </button>
                </div>
              )}
            </div>

            {/* Add / Edit form */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className={`px-5 py-4 border-b border-slate-100 flex items-center gap-2 ${editingId ? 'bg-amber-50' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${editingId ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                  {editingId ? <Edit size={16} className="text-amber-700" /> : <Plus size={16} className="text-brand-green" />}
                </div>
                <h4 className="font-bold text-slate-800">{editingId ? 'Edit Question' : 'Add New Question'}</h4>
              </div>
              <form onSubmit={saveQuestion} className="p-4 space-y-4">
                <textarea
                  placeholder="Question text…"
                  required
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand-green outline-none text-sm resize-none"
                  value={newQuestion.question_text}
                  onChange={e => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  {['a', 'b', 'c', 'd'].map(opt => (
                    <div key={opt} className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-brand-gold uppercase">{opt}</span>
                      <input
                        placeholder={`Option ${opt.toUpperCase()}`}
                        required
                        className="w-full bg-slate-50 border border-slate-200 pl-7 pr-3 py-3 rounded-xl focus:ring-2 focus:ring-brand-green outline-none text-sm"
                        value={newQuestion[`option_${opt}`]}
                        onChange={e => setNewQuestion({ ...newQuestion, [`option_${opt}`]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-600">Correct:</span>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setNewQuestion({ ...newQuestion, correct_option: opt })}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                          newQuestion.correct_option === opt
                            ? 'bg-brand-green text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-brand-green text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-100"
                  >
                    {editingId ? <Edit size={16} /> : <Plus size={16} />}
                    {editingId ? 'Update' : 'Add Question'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={cancelEdit} className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Questions list */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">{questions.length} Questions</p>
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 flex items-start gap-3">
                    <span className="text-xs font-extrabold text-brand-gold mt-0.5 flex-shrink-0">Q{idx + 1}</span>
                    <p className="text-sm font-semibold text-slate-800 leading-snug flex-1">{q.question_text}</p>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button onClick={() => startEditQuestion(q)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 active:bg-blue-100 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => deleteQuestion(q.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400 active:bg-red-100 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-slate-100">
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <div
                        key={opt}
                        className={`px-3 py-2 text-xs ${
                          q.correct_option === opt
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'bg-white text-slate-500'
                        }`}
                      >
                        <span className="font-extrabold mr-1 text-brand-gold">{opt}.</span>
                        {q[`option_${opt.toLowerCase()}`]}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ SETTINGS ════════════════ */}
        {activeTab === 'settings' && (
          <div className="space-y-5 max-w-lg">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5">
              <h3 className="font-bold text-slate-800 text-base">Quiz Configuration</h3>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Event Title</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand-green outline-none text-sm"
                  value={quizName}
                  onChange={e => setQuizName(e.target.value)}
                  placeholder="e.g. The Grand Quiz!"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand-green outline-none text-sm"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                />
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Global Expiry Deadline</h4>

                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-500">Quick set — hours from now</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="flex-1 border border-slate-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-green text-sm"
                      value={quickHours}
                      onChange={e => setQuickHours(e.target.value)}
                    />
                    <button
                      onClick={setDeadlineByHours}
                      type="button"
                      className="bg-slate-800 text-white px-4 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                    >
                      Set
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Or pick date & time</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-brand-green outline-none text-sm"
                    value={activeUntil}
                    onChange={e => setActiveUntil(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="w-full bg-brand-gold text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-amber-200 active:scale-95 transition-transform"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* ════════════════ CERTIFICATE ════════════════ */}
        {activeTab === 'certificate' && (
          <div className="space-y-5 max-w-lg">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5">
              <h3 className="font-bold text-slate-800 text-base">Certificate Template</h3>
              <p className="text-xs text-slate-400">Upload a certificate background image, then position the participant name using the sliders.</p>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Background Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-green file:text-white"
                  onChange={handleImageUpload}
                />
                {certUrl && <p className="text-xs text-brand-green font-bold mt-1">✓ Image loaded</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">X Position: {certX}%</label>
                  <input type="range" min="0" max="100" value={certX} onChange={e => setCertX(e.target.value)} className="w-full accent-brand-green" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Y Position: {certY}%</label>
                  <input type="range" min="0" max="100" value={certY} onChange={e => setCertY(e.target.value)} className="w-full accent-brand-green" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Font Size (px)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-green outline-none"
                    value={certFontSize}
                    onChange={e => setCertFontSize(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">Font Color</label>
                  <input
                    type="color"
                    className="w-full h-12 rounded-xl cursor-pointer border border-slate-200"
                    value={certColor}
                    onChange={e => setCertColor(e.target.value)}
                  />
                </div>
              </div>

              {/* Live preview */}
              <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                <p className="text-xs font-bold text-slate-400 text-center pt-3">Preview</p>
                <div className="relative aspect-[1.414/1] bg-white m-3 rounded shadow flex items-center justify-center overflow-hidden border">
                  {certUrl ? (
                    <>
                      <img src={certUrl} alt="Certificate" className="absolute inset-0 w-full h-full object-contain" />
                      <div
                        className="absolute font-bold whitespace-nowrap transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${certX}%`, top: `${certY}%`, fontSize: `${certFontSize}px`, color: certColor }}
                      >
                        John Doe
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-400 text-sm">No image uploaded</span>
                  )}
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="w-full bg-brand-green text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-100 active:scale-95 transition-transform"
              >
                Save Certificate Config
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Inspect participant modal ── */}
      {inspecting && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setInspecting(null)} />
          <div className="relative bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{inspecting.name}</h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-slate-400">{inspecting.phone}</span>
                  <span className="text-xs font-bold text-brand-green bg-emerald-50 px-2 py-0.5 rounded-full">
                    {calculateScore(inspecting.id)} / {questions.length} correct
                  </span>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ClockIcon size={10} /> {formatTimeTaken(inspecting)}
                  </span>
                  {inspecting.submitted
                    ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Submitted</span>
                    : <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">In Progress</span>
                  }
                </div>
              </div>
              <button onClick={() => setInspecting(null)} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 flex-shrink-0 ml-3">
                <X size={16} className="text-slate-600" />
              </button>
            </div>
            {/* Answer list */}
            <div className="overflow-y-auto p-4 space-y-3">
              {questions.map((q, idx) => {
                const pAnswer = answers.find(a => a.participant_id === inspecting.id && a.question_id === q.id)
                const selected = pAnswer?.selected_option
                const isCorrect = selected === q.correct_option
                const notAnswered = !selected
                return (
                  <div key={q.id} className={"rounded-2xl border overflow-hidden " + (notAnswered ? 'border-slate-200' : isCorrect ? 'border-emerald-200' : 'border-red-200')}>
                    <div className={"px-4 py-3 flex items-start gap-3 " + (notAnswered ? 'bg-slate-50' : isCorrect ? 'bg-emerald-50' : 'bg-red-50')}>
                      <span className="text-xs font-extrabold text-brand-gold mt-0.5 flex-shrink-0">Q{idx + 1}</span>
                      <p className="text-sm font-semibold text-slate-800 flex-1 leading-snug">{q.question_text}</p>
                      {notAnswered
                        ? <span className="text-xs font-bold text-slate-400 flex-shrink-0">—</span>
                        : isCorrect
                        ? <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        : <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                      }
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-slate-100">
                      {['A','B','C','D'].map(opt => (
                        <div key={opt} className={"px-3 py-2 text-xs " + (opt === q.correct_option ? 'bg-emerald-100 text-emerald-800 font-bold' : opt === selected && !isCorrect ? 'bg-red-100 text-red-700 font-bold' : 'bg-white text-slate-500')}>
                          <span className="font-extrabold mr-1 text-brand-gold">{opt}.</span>
                          {q['option_' + opt.toLowerCase()]}
                          {opt === q.correct_option && <span className="ml-1 text-emerald-600">✓</span>}
                          {opt === selected && !isCorrect && <span className="ml-1 text-red-500">✗</span>}
                        </div>
                      ))}
                    </div>
                    {notAnswered && (
                      <div className="px-4 py-2 bg-white text-xs text-slate-400 italic">Not answered</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

            {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              activeTab === t.id ? 'text-brand-green' : 'text-slate-400'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${activeTab === t.id ? 'bg-emerald-50' : ''}`}>
              {t.icon}
            </div>
            <span className="text-[10px] font-bold">{t.label}</span>
          </button>
        ))}
      </div>

    </div>
  )
}
