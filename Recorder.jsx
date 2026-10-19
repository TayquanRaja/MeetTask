import { useEffect, useRef, useState } from 'react'
import { Mic, RotateCcw, Square, Upload } from 'lucide-react'
import { Btn } from './ui'

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function Recorder({ onRecorded, disabled }) {
  const [state, setState] = useState('idle') // idle | recording | review
  const [secs, setSecs] = useState(0)
  const [url, setUrl] = useState(null)
  const [err, setErr] = useState('')
  const rec = useRef(null)
  const chunks = useRef([])
  const stream = useRef(null)
  const timer = useRef(null)
  const blob = useRef(null)

  useEffect(
    () => () => {
      clearInterval(timer.current)
      stream.current?.getTracks().forEach((t) => t.stop())
    },
    []
  )

  const start = async () => {
    setErr('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      return setErr('Recording is not supported in this browser. Try Chrome, Edge or Firefox.')
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = s
      const mime = ['audio/webm;codecs=opus', 'audio/webm'].find((m) => MediaRecorder.isTypeSupported(m))
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined)
      chunks.current = []
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      r.onstop = () => {
        blob.current = new Blob(chunks.current, { type: r.mimeType || 'audio/webm' })
        setUrl(URL.createObjectURL(blob.current))
        setState('review')
        s.getTracks().forEach((t) => t.stop())
      }
      r.start(1000)
      rec.current = r
      setSecs(0)
      setState('recording')
      timer.current = setInterval(() => setSecs((x) => x + 1), 1000)
    } catch {
      setErr('Microphone access was blocked or no microphone was found.')
    }
  }

  const stop = () => {
    clearInterval(timer.current)
    rec.current?.stop()
  }

  const discard = () => {
    if (url) URL.revokeObjectURL(url)
    setUrl(null)
    blob.current = null
    setSecs(0)
    setState('idle')
  }

  const use = () => {
    const file = new File([blob.current], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
    onRecorded(file)
    discard()
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      {state === 'idle' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Record the meeting directly from your microphone.</p>
          <Btn onClick={start} disabled={disabled}><Mic size={16} /> Start recording</Btn>
        </div>
      )}
      {state === 'recording' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-600" />
            <span className="font-mono text-lg text-navy-900">{fmt(secs)}</span>
            <span className="text-sm text-slate-500">Recording...</span>
          </div>
          <Btn variant="danger" onClick={stop}><Square size={16} /> Stop</Btn>
        </div>
      )}
      {state === 'review' && (
        <div className="space-y-3">
          <audio controls src={url} className="w-full" />
          <div className="flex flex-wrap justify-end gap-2">
            <Btn variant="secondary" onClick={discard}><RotateCcw size={16} /> Discard</Btn>
            <Btn onClick={use} disabled={disabled}><Upload size={16} /> Use this recording</Btn>
          </div>
        </div>
      )}
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
    </div>
  )
}