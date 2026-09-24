import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Download, Award, CheckCircle } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function Certificate() {
  const [participant, setParticipant] = useState(null)
  const [setting, setSetting] = useState(null)
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const participantId = localStorage.getItem('participant_id')
    if (!participantId) {
      navigate('/')
      return
    }

    async function loadData() {
      // Fetch participant
      const { data: participantData } = await supabase
        .from('granddb')
        .select('*')
        .eq('id', participantId)
        .single()
      
      if (!participantData || !participantData.submitted) {
        navigate('/') // Only show certificate if submitted
        return
      }
      setParticipant(participantData)

      // Fetch settings for certificate config
      const { data: sData } = await supabase
        .from('granddb')
        .select('*')
        .eq('record_type', 'setting')
        .single()
      
      if (sData) setSetting(sData)
      setLoading(false)
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'] })
    }

    loadData()
  }, [navigate])

  useEffect(() => {
    if (!loading && setting && participant && canvasRef.current) {
      const certUrl = setting.question_text
      if (!certUrl) return

      const certX = setting.option_a ? Number(setting.option_a) : 50
      const certY = setting.option_b ? Number(setting.option_b) : 50
      const certFontSize = setting.option_c ? Number(setting.option_c) : 40
      const certColor = setting.option_d || '#000000'

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      const img = new Image()
      if (certUrl.startsWith('http')) {
        img.crossOrigin = "anonymous" 
      }
      img.src = certUrl
      
      img.onload = () => {
        // Set canvas dimensions to match image natively
        canvas.width = img.width
        canvas.height = img.height

        // Draw background
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Calculate absolute coordinates based on %
        const xPos = (certX / 100) * canvas.width
        const yPos = (certY / 100) * canvas.height

        // Draw Name
        ctx.font = `bold ${certFontSize}px sans-serif`
        ctx.fillStyle = certColor
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(participant.name, xPos, yPos)
      }
    }
  }, [loading, setting, participant])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `Certificate_${participant.name.replace(/\s+/g, '_')}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  if (loading) {
    return <div className="text-center mt-20 text-brand-green font-bold">Generating your certificate...</div>
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 flex flex-col items-center">
      
      <div className="text-center mb-8 animate-bounce-in">
        <CheckCircle className="w-16 h-16 text-brand-green mx-auto mb-4 animate-pulse" />
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-800 mb-2">Congratulations, {participant.name}!</h2>
        <p className="text-slate-500 text-lg">You have successfully completed the quiz. Here is your certificate.</p>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 w-full flex flex-col items-center">
        
        {setting?.question_text ? (
          <div className="w-full overflow-hidden rounded-xl border mb-6 flex justify-center bg-slate-50 relative group">
            {/* We scale the canvas down visually using CSS so it fits on screen, but it retains high resolution for download */}
            <canvas 
              ref={canvasRef} 
              className="w-full max-w-full h-auto object-contain"
            />
          </div>
        ) : (
          <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl mb-6 text-center text-slate-500">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p>Certificate template has not been configured by the admin yet.</p>
          </div>
        )}

        <div className="flex gap-4">
          <button 
            onClick={handleDownload}
            disabled={!setting?.question_text}
            className="bg-brand-green hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Download size={20} />
            Download Certificate
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('participant_id')
              navigate('/')
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-8 rounded-xl transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  )
}
