import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ChevronLeft, ChevronRight, Grid, X, Clock, Send } from 'lucide-react'

export default function Quiz() {
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [setting, setSetting] = useState(null)
  const [participant, setParticipant] = useState(null)
  const [showGrid, setShowGrid] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const participantId = localStorage.getItem('participant_id')
    if (!participantId) {
      navigate('/')
      return
    }

    async function loadQuizData() {
      const { data: participantData } = await supabase
        .from('granddb')
        .select('*')
        .eq('id', participantId)
        .single()

      if (!participantData || participantData.submitted) {
        navigate('/')
        return
      }
      setParticipant(participantData)

      const { data: settingData } = await supabase
        .from('granddb')
        .select('*')
        .eq('record_type', 'setting')
        .single()
      setSetting(settingData)

      const { data: questionsData } = await supabase
        .from('granddb')
        .select('*')
        .eq('record_type', 'question')
        .order('id', { ascending: true })
      setQuestions(questionsData || [])

      const { data: answersData } = await supabase
        .from('granddb')
        .select('*')
        .eq('record_type', 'answer')
        .eq('participant_id', participantId)

      const loadedAnswers = {}
      answersData?.forEach(ans => {
        loadedAnswers[ans.question_id] = ans.selected_option
      })
      setAnswers(loadedAnswers)

      const startTime = new Date(participantData.start_time).getTime()
      const durationMs = (settingData?.duration_minutes || 30) * 60 * 1000
      const endTime = startTime + durationMs
      const activeUntilTime = settingData?.active_until
        ? new Date(settingData.active_until).getTime()
        : Infinity
      const earliestEndTime = Math.min(endTime, activeUntilTime)
      const now = new Date().getTime()

      if (now >= earliestEndTime) {
        handleAutoSubmit(participantId)
      } else {
        setTimeLeft(Math.floor((earliestEndTime - now) / 1000))
        setLoading(false)
      }
    }

    loadQuizData()
  }, [navigate])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit(participant?.id)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, participant])

  const handleAutoSubmit = async (pId) => {
    if (submitting) return
    setSubmitting(true)
    await supabase.from('granddb').update({ submitted: true, submit_time: new Date().toISOString() }).eq('id', pId)
    navigate('/certificate')
  }

  const handleManualSubmit = async () => {
    if (window.confirm('Are you sure you want to submit your quiz? You cannot change answers after this.')) {
      await handleAutoSubmit(participant.id)
    }
  }

  const handleOptionSelect = async (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))

    const { data: existingAnswer } = await supabase
      .from('granddb')
      .select('id')
      .eq('record_type', 'answer')
      .eq('participant_id', participant.id)
      .eq('question_id', questionId)
      .single()

    if (existingAnswer) {
      await supabase
        .from('granddb')
        .update({ selected_option: option, updated_at: new Date().toISOString() })
        .eq('id', existingAnswer.id)
    } else {
      await supabase.from('granddb').insert({
        record_type: 'answer',
        participant_id: participant.id,
        question_id: questionId,
        selected_option: option,
      })
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const answeredCount = Object.keys(answers).length
  const isUrgent = timeLeft !== null && timeLeft <= 60

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        <p className="text-brand-green font-bold text-lg">Loading Quiz...</p>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const optionLabels = { A: 'A', B: 'B', C: 'C', D: 'D' }

  return (
    <div className="w-full max-w-3xl mx-auto px-0 md:px-4 pb-28 md:pb-10">

      {/* ── Sticky top bar (mobile) ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 gap-3">

          {/* Progress pill */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide leading-none mb-1">
              Progress
            </span>
            <span className="text-sm font-bold text-slate-700">
              {answeredCount} / {questions.length} answered
            </span>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold text-base tabular-nums transition-colors ${
            isUrgent
              ? 'bg-red-100 text-red-600 animate-pulse'
              : 'bg-emerald-50 text-brand-green'
          }`}>
            <Clock size={15} />
            {formatTime(timeLeft)}
          </div>

          {/* Question grid toggle */}
          <button
            onClick={() => setShowGrid(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            aria-label="Open question grid"
          >
            <Grid size={15} />
            <span className="hidden sm:inline">Questions</span>
          </button>
        </div>

        {/* Thin progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-1 bg-brand-green transition-all duration-500"
            style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* ── Question card ── */}
      <div className="bg-white mx-0 md:mx-0 md:rounded-2xl md:shadow-lg md:border md:border-slate-100 md:mt-6 overflow-hidden">

        {/* Question header */}
        <div className="bg-brand-green px-5 py-4 md:px-8 md:py-5 flex items-center justify-between">
          <span className="text-white/80 text-sm font-semibold uppercase tracking-widest">
            Question
          </span>
          <span className="text-white font-bold text-lg">
            {currentQuestionIndex + 1}
            <span className="text-white/60 font-normal text-sm"> / {questions.length}</span>
          </span>
        </div>

        {currentQuestion ? (
          <div className="px-5 py-6 md:px-8 md:py-8">

            {/* Question text */}
            <p className="text-base md:text-xl font-semibold text-slate-800 leading-relaxed mb-6 whitespace-pre-wrap">
              {currentQuestion.question_text}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map(opt => {
                const isSelected = answers[currentQuestion.id] === opt
                return (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-all duration-150 active:scale-[0.98] ${
                      isSelected
                        ? 'border-brand-green bg-emerald-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-brand-gold hover:bg-amber-50'
                    }`}
                  >
                    {/* Option letter bubble */}
                    <span className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isSelected
                        ? 'bg-brand-green text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {optionLabels[opt]}
                    </span>
                    <span className={`text-sm md:text-base leading-snug ${
                      isSelected ? 'text-brand-green font-semibold' : 'text-slate-700'
                    }`}>
                      {currentQuestion[`option_${opt.toLowerCase()}`]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 py-20">No questions available.</div>
        )}
      </div>

      {/* ── Bottom navigation bar (fixed on mobile, inline on desktop) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 md:static md:border-none md:bg-transparent md:mt-6 md:px-0 md:py-0 md:shadow-none">

        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-slate-200 active:scale-95 transition-all"
        >
          <ChevronLeft size={18} />
          <span>Prev</span>
        </button>

        {/* Center: answered pill */}
        <div className="text-xs text-slate-500 font-semibold text-center hidden sm:block">
          {answeredCount} of {questions.length} done
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleManualSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-200"
          >
            <Send size={16} />
            <span>{submitting ? 'Submitting…' : 'Submit'}</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="flex items-center gap-2 px-5 py-3 bg-brand-green text-white rounded-xl font-semibold text-sm hover:bg-green-800 active:scale-95 transition-all"
          >
            <span>Next</span>
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* ── Question grid drawer / modal ── */}
      {showGrid && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowGrid(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md max-h-[80vh] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">All Questions</h3>
                <p className="text-xs text-slate-500 mt-0.5">{answeredCount} of {questions.length} answered</p>
              </div>
              <button
                onClick={() => setShowGrid(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Close"
              >
                <X size={16} className="text-slate-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {questions.map((q, idx) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx)
                      setShowGrid(false)
                    }}
                    className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-90 ${
                      currentQuestionIndex === idx
                        ? 'bg-brand-green text-white ring-2 ring-offset-1 ring-brand-green'
                        : answers[q.id]
                        ? 'bg-emerald-100 text-brand-green border border-brand-green/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-emerald-100 border border-brand-green/30 inline-block" />
                  Answered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-slate-100 inline-block" />
                  Unanswered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-brand-green inline-block" />
                  Current
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
