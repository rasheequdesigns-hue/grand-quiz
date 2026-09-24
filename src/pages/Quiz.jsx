import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Quiz() {
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [setting, setSetting] = useState(null)
  const [participant, setParticipant] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const participantId = localStorage.getItem('participant_id')
    if (!participantId) {
      navigate('/')
      return
    }

    async function loadQuizData() {
      // 1. Fetch participant
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

      // 2. Fetch settings
      const { data: settingData } = await supabase
        .from('granddb')
        .select('*')
        .eq('record_type', 'setting')
        .single()
      setSetting(settingData)

      // 3. Fetch questions
      const { data: questionsData } = await supabase
        .from('granddb')
        .select('*')
        .eq('record_type', 'question')
        .order('id', { ascending: true })
      setQuestions(questionsData || [])

      // 4. Fetch existing answers
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

      // 5. Calculate time left
      const startTime = new Date(participantData.start_time).getTime()
      const durationMs = (settingData?.duration_minutes || 30) * 60 * 1000
      const endTime = startTime + durationMs
      const activeUntilTime = settingData?.active_until ? new Date(settingData.active_until).getTime() : Infinity

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
    await supabase
      .from('granddb')
      .update({ submitted: true })
      .eq('id', pId)
    
    navigate('/certificate')
  }

  const handleManualSubmit = async () => {
    if (window.confirm("Are you sure you want to submit your quiz? You cannot change answers after this.")) {
      await handleAutoSubmit(participant.id)
    }
  }

  const handleOptionSelect = async (questionId, option) => {
    // Optimistic UI update
    setAnswers(prev => ({ ...prev, [questionId]: option }))

    // Upsert answer to DB
    // Since we don't have a unique constraint on (participant_id, question_id) natively handling upsert perfectly,
    // we first check if it exists, then update, else insert.
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
      await supabase
        .from('granddb')
        .insert({
          record_type: 'answer',
          participant_id: participant.id,
          question_id: questionId,
          selected_option: option
        })
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (loading) {
    return <div className="text-center mt-20 text-brand-green font-bold">Loading Quiz...</div>
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto">
      {/* Navigation Grid */}
      <div className="md:w-1/4 bg-white p-4 rounded-xl shadow-lg border-t-4 border-brand-green h-fit">
        <h3 className="font-bold text-gray-700 mb-4 text-center">Questions</h3>
        <div className="grid grid-cols-4 gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`py-2 px-1 rounded font-semibold text-sm transition-colors ${
                currentQuestionIndex === idx 
                  ? 'bg-brand-green text-white ring-2 ring-brand-gold' 
                  : answers[q.id] 
                    ? 'bg-green-100 text-brand-green border border-brand-green'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <div className="mt-8 text-center">
          <div className="text-sm text-gray-500 font-bold mb-1">Time Remaining</div>
          <div className="text-3xl font-mono font-bold text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="md:w-3/4 bg-white p-6 md:p-10 rounded-xl shadow-lg border-t-4 border-brand-green">
        {currentQuestion ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-brand-green">Question {currentQuestionIndex + 1} of {questions.length}</h2>
            </div>
            
            <p className="text-lg md:text-xl text-gray-800 mb-8 whitespace-pre-wrap">{currentQuestion.question_text}</p>
            
            <div className="space-y-4">
              {['A', 'B', 'C', 'D'].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    answers[currentQuestion.id] === opt
                      ? 'border-brand-green bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-brand-gold hover:bg-orange-50'
                  }`}
                >
                  <span className="font-bold text-brand-gold mr-3">{opt}.</span>
                  <span className="text-gray-700">{currentQuestion[`option_${opt.toLowerCase()}`]}</span>
                </button>
              ))}
            </div>

            <div className="mt-10 flex justify-between items-center border-t pt-6">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded font-semibold disabled:opacity-50 hover:bg-gray-300 transition"
              >
                Previous
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleManualSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 shadow-lg transition transform hover:scale-105"
                >
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-6 py-2 bg-brand-green text-white rounded font-semibold hover:bg-green-800 transition"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-20">No questions available.</div>
        )}
      </div>
    </div>
  )
}
