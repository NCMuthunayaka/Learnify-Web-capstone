import { useState, useRef, useEffect, useCallback } from "react"
import {
  Send, Sparkles, Settings, RefreshCw, Bot,
  Mic, MicOff, FileText, ChevronRight, Paperclip, X, FileImage, AlertCircle
} from "lucide-react"
import Avatar from "../components/common/Avatar"
import Badge from "../components/common/Badge"
import profileImg from "../assets/icons/profile.png"
import aiIcon from "../assets/icons/AI.png"
import { createChatSession, getChatMessages, sendChatMessage, uploadChatFile } from "../api/chatApi"

// ── Suggested prompts ─────────────────────────────────────────────────────────
const suggestedPrompts = [
  { text: "Create exam study plan",    icon: "📅" },
  { text: "Explain a difficult concept", icon: "💡" },
  { text: "Summarize lecture notes",   icon: "📝" },
  { text: "Generate practice quiz",   icon: "🧠" },
]

const quickActions = [
  "Make New Timetable",
  "Optimize My Week",
  "Catch-Me-Up",
  "Generate Revision Plan",
  "Help Me Focus",
]

const aiTips = [
  {
    icon: "🧠",
    title: "Active Recall Tip",
    text: "Try explaining what you learned to the assistant to lock in your understanding.",
  },
  {
    icon: "⏱️",
    title: "Optimal Session Length",
    text: "Your average focus drops after 45 mins. Ask AI to segment your sessions!",
  },
  {
    icon: "📎",
    title: "File Analysis",
    text: "Upload a PDF or image — Gemini AI will read and summarise it for you.",
  },
]

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"]
const MAX_MB        = 10

// ── Component ─────────────────────────────────────────────────────────────────
function AIChatPage() {
  const [sessionId,   setSessionId]   = useState(null)
  const [messages,    setMessages]    = useState([])
  const [inputValue,  setInputValue]  = useState("")
  const [isTyping,    setIsTyping]    = useState(false)
  const [isLoading,   setIsLoading]   = useState(true)
  const [error,       setError]       = useState(null)

  // File upload state
  const [pendingFile,     setPendingFile]     = useState(null)   // { file, preview, type }
  const [fileCaption,     setFileCaption]     = useState("")
  const [isUploading,     setIsUploading]     = useState(false)
  const fileInputRef = useRef(null)

  // Voice input state
  const [isListening,     setIsListening]     = useState(false)
  const [voiceSupported,  setVoiceSupported]  = useState(false)
  const recognitionRef = useRef(null)

  const chatEndRef = useRef(null)

  // ── Scroll to latest message ───────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // ── Init: create or restore session ───────────────────────────────────────
  useEffect(() => {
    async function initSession() {
      try {
        setIsLoading(true)
        const res      = await createChatSession("Study Session")
        const data     = res.data?.data
        const sid      = data?.session?.id
        const greeting = data?.greeting

        setSessionId(sid)
        if (greeting) {
          setMessages([greeting])
        }
      } catch (err) {
        setError("Could not connect to AI. Please refresh the page.")
      } finally {
        setIsLoading(false)
      }
    }
    initSession()
  }, [])

  // ── Voice recognition setup ────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setVoiceSupported(true)
      const recognition = new SpeechRecognition()
      recognition.lang        = "en-US"
      recognition.continuous  = false
      recognition.interimResults = false

      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        setIsListening(false)
        setInputValue(transcript)
        // Auto-send voice input
        handleSend(transcript)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend   = () => setIsListening(false)

      recognitionRef.current = recognition
    }
  }, [])

  // ── Send text message ──────────────────────────────────────────────────────
  const handleSend = useCallback(async (textOverride) => {
    const text = (textOverride || inputValue).trim()
    if (!text || !sessionId || isTyping) return
    setInputValue("")

    // Optimistically add user message
    const tempUser = {
      id:         Date.now(),
      role:       "user",
      content:    text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempUser])
    setIsTyping(true)
    setError(null)

    try {
      const res = await sendChatMessage(sessionId, text)
      const { user_message, ai_message } = res.data?.data || {}

      // Replace temp with real + append AI reply
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUser.id),
        user_message,
        ai_message,
      ])
    } catch (err) {
      setError("AI failed to respond. Please try again.")
      setMessages(prev => prev.filter(m => m.id !== tempUser.id))
    } finally {
      setIsTyping(false)
    }
  }, [inputValue, sessionId, isTyping])

  // ── File picker ────────────────────────────────────────────────────────────
  function handleFilePick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""   // reset so same file can be re-picked

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF, PNG, JPG, GIF, and WEBP files are supported.")
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB} MB.`)
      return
    }

    const isImage   = file.type.startsWith("image/")
    const preview   = isImage ? URL.createObjectURL(file) : null
    setPendingFile({ file, preview, type: isImage ? "image" : "pdf" })
    setError(null)
  }

  // ── Send file to backend ───────────────────────────────────────────────────
  async function handleFileSend() {
    if (!pendingFile || !sessionId) return
    setIsUploading(true)
    setError(null)

    // Show user's file bubble immediately
    const tempUser = {
      id:         Date.now(),
      role:       "user",
      content:    fileCaption || `Analyse this ${pendingFile.type}`,
      file_name:  pendingFile.file.name,
      file_type:  pendingFile.type,
      created_at: new Date().toISOString(),
      _preview:   pendingFile.preview,
    }
    setMessages(prev => [...prev, tempUser])
    setIsTyping(true)

    try {
      const res = await uploadChatFile(sessionId, pendingFile.file, fileCaption)
      const { user_message, ai_message } = res.data?.data || {}
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUser.id),
        user_message,
        ai_message,
      ])
    } catch (err) {
      setError("File upload failed. Please try again.")
      setMessages(prev => prev.filter(m => m.id !== tempUser.id))
    } finally {
      setIsTyping(false)
      setIsUploading(false)
      setPendingFile(null)
      setFileCaption("")
    }
  }

  // ── Voice toggle ───────────────────────────────────────────────────────────
  function toggleVoice() {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  // ── Reset chat ─────────────────────────────────────────────────────────────
  async function handleReset() {
    try {
      setIsLoading(true)
      const res      = await createChatSession("Study Session")
      const data     = res.data?.data
      setSessionId(data?.session?.id)
      setMessages(data?.greeting ? [data.greeting] : [])
      setPendingFile(null)
      setFileCaption("")
      setError(null)
    } catch {
      setError("Could not reset chat.")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Header Card ── */}
      <div className="bg-gradient-to-br from-[#1A3D63] to-[#0A1931] text-white rounded-2xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-[-10%] top-[-30%] w-96 h-96 bg-[#4A7FA7] opacity-25 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm" className="bg-green-500/20 text-green-400 border border-green-500/30">
                ● AI ACTIVE
              </Badge>
              <span className="text-[10px] text-white/40 font-body">Powered by Gemini 1.5 Flash</span>
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">AI Assistant Center</h2>
            <p className="font-body text-sm text-[#B3CFE5] max-w-2xl leading-relaxed">
              Your intelligent academic partner — handles study planning, instant subject help,
              file analysis, and personalized guidance so you can focus on learning.
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-[#B3CFE5]/80 font-body">
              <span>💬 Real-time AI responses</span>
              <span>📎 PDF & image analysis</span>
              <span>🎤 Voice input</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#0A1931] hover:bg-[#F6FAFD] rounded-xl font-body text-xs font-bold transition-all shadow-md"
            >
              <RefreshCw size={14} />
              New Chat
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Sidebar ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Suggested Topics */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
              <Sparkles size={16} className="text-[#4A7FA7]" />
              <h3 className="font-heading text-sm font-semibold text-[#0A1931]">Suggested Study Topics</h3>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt.text}
                  onClick={() => handleSend(prompt.text)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-[#4A7FA7]/30 hover:bg-gray-50/50 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{prompt.icon}</span>
                    <span className="font-body text-xs font-semibold text-gray-600 group-hover:text-[#1A3D63]">
                      {prompt.text}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-[#4A7FA7] transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Tips */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
              <Bot size={16} className="text-[#4A7FA7]" />
              <h3 className="font-heading text-sm font-semibold text-[#0A1931]">AI Assistant Insights</h3>
            </div>
            <div className="space-y-4">
              {aiTips.map((tip, idx) => (
                <div key={idx} className="flex gap-3 items-start p-3 bg-[#F6FAFD] rounded-xl border border-gray-50">
                  <span className="text-xl mt-0.5">{tip.icon}</span>
                  <div>
                    <h4 className="font-heading text-xs font-bold text-[#1A3D63]">{tip.title}</h4>
                    <p className="font-body text-[11px] text-gray-500 mt-1 leading-relaxed">{tip.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Chat Window ── */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[640px]">

          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F6FAFD]">
            <div className="flex items-center gap-3">
              <Avatar src={aiIcon} name="AI" color="primary" size="md" />
              <div>
                <h3 className="font-heading text-sm font-bold text-[#0A1931]">Ask AI</h3>
                <p className="font-body text-[10px] text-green-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  {isLoading ? "Connecting..." : "Gemini AI is online"}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-[#4A7FA7]/10 text-[#4A7FA7] rounded font-body text-[10px] font-bold">
              Gemini 1.5 Flash
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <span className="font-body text-xs text-red-600">{error}</span>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">

            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-[#4A7FA7] border-t-transparent rounded-full animate-spin" />
                  <p className="font-body text-xs text-gray-400">Connecting to Gemini AI...</p>
                </div>
              </div>
            )}

            {!isLoading && messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <Avatar
                  src={msg.role === "user" ? profileImg : aiIcon}
                  name={msg.role === "user" ? "User" : "AI"}
                  color={msg.role === "user" ? "accent" : "primary"}
                  size="sm"
                />
                <div>
                  {/* File preview bubble */}
                  {msg.file_name && (
                    <div className={`mb-1.5 rounded-xl px-3 py-2 border inline-flex items-center gap-2 ${
                      msg.role === "user"
                        ? "bg-[#1A3D63]/10 border-[#1A3D63]/20"
                        : "bg-gray-100 border-gray-200"
                    }`}>
                      {msg.file_type === "image" ? (
                        <FileImage size={14} className="text-[#4A7FA7]" />
                      ) : (
                        <FileText size={14} className="text-red-500" />
                      )}
                      <span className="font-body text-[11px] text-gray-600 max-w-[160px] truncate">
                        {msg.file_name}
                      </span>
                    </div>
                  )}
                  {/* Image preview */}
                  {msg._preview && (
                    <img
                      src={msg._preview}
                      alt="upload preview"
                      className="max-w-[200px] rounded-xl mb-1.5 border border-gray-100"
                    />
                  )}
                  <div className={`rounded-2xl px-4 py-3 shadow-sm font-body text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#1A3D63] text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  }`}>
                    {msg.content}
                  </div>
                  <span className={`block font-body text-[9px] text-gray-400 mt-1 ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {/* AI typing indicator */}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                <Avatar src={aiIcon} name="AI" color="primary" size="sm" />
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA7] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA7] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA7] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ── File pending preview bar ── */}
          {pendingFile && (
            <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex items-center gap-3">
              {pendingFile.type === "image" ? (
                <img src={pendingFile.preview} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-blue-200" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center border border-red-200">
                  <FileText size={18} className="text-red-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs font-semibold text-gray-700 truncate">{pendingFile.file.name}</p>
                <input
                  type="text"
                  placeholder="Add a question or caption (optional)..."
                  value={fileCaption}
                  onChange={(e) => setFileCaption(e.target.value)}
                  className="mt-1 w-full text-[11px] bg-transparent border-none outline-none text-gray-500 placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleFileSend}
                  disabled={isUploading}
                  className="px-3 py-1.5 bg-[#1A3D63] text-white text-[11px] font-bold rounded-lg hover:bg-[#4A7FA7] transition-colors disabled:opacity-50"
                >
                  {isUploading ? "Sending..." : "Send File"}
                </button>
                <button
                  onClick={() => { setPendingFile(null); setFileCaption("") }}
                  className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* ── Quick Action Chips ── */}
          <div className="px-5 pt-3 pb-2 bg-gray-50/50 border-t border-gray-100 flex flex-wrap gap-1.5 items-center">
            <span className="font-body text-[10px] text-gray-400 font-semibold mr-1">QUICK ACTIONS:</span>
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => handleSend(action)}
                className="font-body text-[10px] font-semibold px-2.5 py-1 bg-white hover:bg-[#F6FAFD] text-gray-500 hover:text-[#1A3D63] rounded-lg border border-gray-200 hover:border-[#4A7FA7]/30 shadow-sm transition-all"
              >
                {action}
              </button>
            ))}
          </div>

          {/* ── Input Panel ── */}
          <div className="p-4 border-t border-gray-100 bg-white">
            {/* Voice listening indicator */}
            {isListening && (
              <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-body text-xs text-red-600 font-semibold">Listening... speak now</span>
              </div>
            )}
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-[#4A7FA7]/50 focus-within:bg-white transition-all duration-200">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask anything — subject help, study planning, advice..."
                className="flex-1 bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none"
                disabled={isLoading || isListening}
              />
              <div className="flex items-center gap-1 flex-shrink-0">

                {/* File upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload PDF or image"
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-[#4A7FA7] transition-colors"
                >
                  <Paperclip size={15} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={handleFilePick}
                />

                {/* Voice input button */}
                {voiceSupported && (
                  <button
                    onClick={toggleVoice}
                    title={isListening ? "Stop listening" : "Voice input"}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isListening
                        ? "bg-red-100 text-red-500 animate-pulse"
                        : "hover:bg-gray-200 text-gray-400 hover:text-[#4A7FA7]"
                    }`}
                  >
                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                )}

                {/* Send button */}
                <button
                  onClick={() => handleSend()}
                  disabled={(!inputValue.trim() && !pendingFile) || isTyping || isLoading}
                  className={`p-1.5 rounded-lg text-white shadow-md transition-all ${
                    inputValue.trim() && !isTyping
                      ? "bg-[#1A3D63] hover:bg-[#4A7FA7]"
                      : "bg-gray-300 cursor-not-allowed shadow-none"
                  }`}
                >
                  <Send size={14} />
                </button>

              </div>
            </div>
            <p className="font-body text-[9px] text-gray-300 mt-1.5 text-center">
              Gemini 1.5 Flash · Responses may be inaccurate · For academic guidance only
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AIChatPage