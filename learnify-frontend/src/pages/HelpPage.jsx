import { useState } from "react"
import { Paperclip, Send, Users, User, ArrowRight, CheckCircle2, AlertCircle, Clock, Sparkles } from "lucide-react"
import Avatar from "../components/common/Avatar"
import Badge from "../components/common/Badge"
import Button from "../components/common/Button"
import helpImg from "../assets/images/help.png"
import profileImg from "../assets/icons/profile.png"

const availableHelpers = [
  {
    name: "Mr. Kavindu",
    role: "Mentor",
    time: "Mon, Wed • 9AM-12PM",
    initials: "KK",
    color: "primary",
    avatar: null
  },
  {
    name: "Miss. Shalu",
    role: "Mentor",
    time: "Tue, Thu • 2PM-5PM",
    initials: "SS",
    color: "accent",
    avatar: null
  },
  {
    name: "Peer: Nayana",
    role: "Student",
    time: "Fri • 10AM-1PM",
    initials: "NC",
    color: "green",
    avatar: null
  }
]

const initialRequests = [
  {
    id: 1,
    subject: "Mathematics",
    status: "Accepted",
    title: "Help with Integration Formulas",
    desc: "I'm struggling with integration by parts for the exam. Specifically Chapter 5, Exercise 3B in the...",
    helperName: "Mr. Kavindu",
    helperRole: "Mentor",
    helperInitials: "KK",
    helperColor: "primary",
    date: "Apr 18, 2026",
    badgeColor: "success"
  },
  {
    id: 2,
    subject: "Physics",
    status: "Pending",
    title: "Newton's Laws Confusion",
    desc: "I can't understand the difference between Newton's 2nd and 3rd law when applied to real-...",
    helperName: "Miss. Shalu",
    helperRole: "Mentor",
    helperInitials: "SS",
    helperColor: "accent",
    date: "Apr 19, 2026",
    badgeColor: "warning"
  },
  {
    id: 3,
    subject: "Chemistry",
    status: "Resolved",
    title: "Balancing Chemical Equations",
    desc: "Needed help with redox reactions and how to balance them step by step. Got full clarity now!",
    helperName: "Peer: Nayana",
    helperRole: "Student",
    helperInitials: "NC",
    helperColor: "green",
    date: "Apr 15, 2026",
    badgeColor: "success",
    reply: "Great question! Start by assigning oxidation numbers to each element, then identify what's oxidized and reduced. Check Chapter 9 notes I uploaded for a step-by-step guide."
  }
]

function HelpPage() {
  const [requests, setRequests] = useState(initialRequests)
  const [selectedMentor, setSelectedMentor] = useState("Mr. Ashan — Mon, Wed (9AM-12PM)")
  const [subject, setSubject] = useState("Mathematics")
  const [requestType, setRequestType] = useState("Mentor") // "Mentor" or "Peer"
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("Medium") // "Low", "Medium", "High"
  const [successMsg, setSuccessMsg] = useState(false)

  // Calculations for summary metrics
  const totalRequests = requests.length + 5 // Static baseline offset to match screenshot summary (8 total)
  const resolvedRequests = requests.filter(r => r.status === "Resolved").length + 4 // offset to match screenshot (5 resolved)
  const inProgressRequests = totalRequests - resolvedRequests

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    const newRequest = {
      id: Date.now(),
      subject: subject,
      status: "Pending",
      title: title,
      desc: description,
      helperName: requestType === "Mentor" ? selectedMentor.split(" —")[0] : "Peer: Nayana",
      helperRole: requestType,
      helperInitials: requestType === "Mentor" ? "MA" : "NC",
      helperColor: requestType === "Mentor" ? "accent" : "green",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      badgeColor: "warning"
    }

    setRequests([newRequest, ...requests])
    setTitle("")
    setDescription("")
    setSuccessMsg(true)
    setTimeout(() => setSuccessMsg(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ── Top Row: Form & Help Graphic Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form Card (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
            <span className="text-lg">📩</span>
            <h3 className="font-heading text-sm font-semibold text-[#0A1931]">Send a Help Request</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-700 rounded-xl font-body text-xs font-semibold border border-green-200">
                ✓ Request submitted successfully!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Mentor */}
              <div>
                <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                  Select Mentor
                </label>
                <select
                  value={selectedMentor}
                  onChange={(e) => setSelectedMentor(e.target.value)}
                  className="w-full bg-[#F6FAFD] text-gray-700 font-body text-xs px-3 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:border-[#4A7FA7] transition-all"
                >
                  <option>Mr. Ashan — Mon, Wed (9AM-12PM)</option>
                  <option>Mr. Kavindu — Mon, Wed (9AM-12PM)</option>
                  <option>Miss. Shalu — Tue, Thu (2PM-5PM)</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-[#F6FAFD] text-gray-700 font-body text-xs px-3 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:border-[#4A7FA7] transition-all"
                >
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Chemistry</option>
                  <option>Biology</option>
                </select>
              </div>
            </div>

            {/* Request Type Toggle */}
            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                Request Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRequestType("Mentor")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-xs font-semibold transition-all border ${
                    requestType === "Mentor"
                      ? "bg-[#4A7FA7] text-white border-[#4A7FA7]"
                      : "bg-[#F6FAFD] text-gray-500 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <Users size={14} />
                  Mentor
                </button>
                <button
                  type="button"
                  onClick={() => setRequestType("Peer")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-xs font-semibold transition-all border ${
                    requestType === "Peer"
                      ? "bg-[#4A7FA7] text-white border-[#4A7FA7]"
                      : "bg-[#F6FAFD] text-gray-500 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <User size={14} />
                  Peer
                </button>
              </div>
            </div>

            {/* Topic / Title */}
            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                Topic / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Help understanding Integration by Parts"
                required
                className="w-full bg-[#F6FAFD] text-gray-700 placeholder-gray-300 font-body text-xs px-3 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:border-[#4A7FA7] transition-all"
              />
            </div>

            {/* Description */}
            <div className="relative">
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem in detail — include the chapter, what you've tried, and where you're stuck..."
                required
                rows={3}
                className="w-full bg-[#F6FAFD] text-gray-700 placeholder-gray-300 font-body text-xs px-3 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:border-[#4A7FA7] transition-all resize-none"
              />
              <button 
                type="button" 
                className="absolute right-3.5 bottom-3.5 w-6 h-6 rounded-full bg-[#EAF0F6] text-[#1A3D63] hover:bg-[#CBDDF0] flex items-center justify-center font-bold transition-all text-xs border-none"
              >
                +
              </button>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                Priority
              </label>
              <div className="flex gap-2">
                {[
                  { name: "Low", color: "bg-green-50 text-green-600 border-green-200 select-color bg-green-500 text-white" },
                  { name: "Medium", color: "bg-amber-50 text-amber-600 border-amber-200 select-color bg-amber-500 text-white" },
                  { name: "High", color: "bg-red-50 text-red-600 border-red-200 select-color bg-red-500 text-white" }
                ].map((item) => {
                  const isSelected = priority === item.name
                  let btnStyle = ""
                  if (item.name === "Low") {
                    btnStyle = isSelected ? "bg-green-500 border-green-500 text-white" : "bg-green-50/50 text-green-600 border-green-100"
                  } else if (item.name === "Medium") {
                    btnStyle = isSelected ? "bg-amber-500 border-amber-500 text-white" : "bg-amber-50/50 text-amber-600 border-amber-100"
                  } else {
                    btnStyle = isSelected ? "bg-red-500 border-red-500 text-white" : "bg-red-50/50 text-red-600 border-red-100"
                  }
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setPriority(item.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-semibold transition-all border ${btnStyle}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : item.name === "Low" ? "bg-green-500" : item.name === "Medium" ? "bg-amber-500" : "bg-red-500"}`} />
                      {item.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 border border-[#4A7FA7] text-[#4A7FA7] bg-white hover:bg-[#F6FAFD] rounded-xl font-body text-xs font-bold transition-all"
              >
                <Paperclip size={14} />
                Attach File
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-[#4A7FA7] hover:bg-[#1A3D63] text-white rounded-xl font-body text-xs font-bold transition-all shadow-md border-none"
              >
                Submit Request →
              </button>
            </div>

          </form>
        </div>

        {/* Right Help Graphic Card (1/3 width) */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-1 shadow-sm border border-gray-100 relative h-full min-h-[380px] overflow-hidden">
          <img 
            src={helpImg} 
            alt="Need Help?" 
            className="w-full h-full object-cover rounded-2xl"
          />
          {/* Card footer overlay overlayed directly over help.png design */}
          <div className="absolute bottom-5 inset-x-5 text-center text-white z-10 space-y-1">
            <h4 className="font-heading font-bold text-sm leading-tight text-white drop-shadow-md">
              Need help? We've got you covered!
            </h4>
            <p className="font-body text-[10px] text-gray-200 drop-shadow-sm">
              Connect with mentors & peers instantly
            </p>
          </div>
          {/* Subtle gradient shield to protect text overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none rounded-b-2xl" />
        </div>

      </div>

      {/* ── Row 2: Available Mentors & Peers ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
          <Users size={16} className="text-[#4A7FA7]" />
          <h3 className="font-heading text-sm font-semibold text-[#0A1931]">Available Mentors & Peers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableHelpers.map((helper, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 bg-[#F6FAFD] rounded-2xl border border-gray-50">
              <div className="flex items-center gap-3">
                <Avatar 
                  src={helper.name === "Peer: Nayana" ? profileImg : helper.avatar} 
                  name={helper.name} 
                  color={helper.color} 
                  size="sm" 
                />
                <div>
                  <h4 className="font-heading text-xs font-bold text-[#0A1931]">{helper.name}</h4>
                  <p className="font-body text-[10px] text-gray-400 mt-0.5">{helper.time}</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 3: My Previous Requests ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-bold text-[#0A1931]">My Previous Requests</h3>
          <button className="font-body text-xs font-semibold text-[#4A7FA7] hover:text-[#1A3D63] flex items-center gap-1 transition-colors border-none bg-transparent">
            View All
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4">
              
              {/* Card Header badges */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-blue-50 text-[#1A3D63] border border-blue-100/50 rounded-full font-body text-[10px] font-bold">
                  {req.subject}
                </span>
                
                {/* Status Badge */}
                <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-bold flex items-center gap-1.5 ${
                  req.status === "Accepted"
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : req.status === "Resolved"
                      ? "bg-green-50 text-green-600 border border-green-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    req.status === "Accepted"
                      ? "bg-blue-500"
                      : req.status === "Resolved"
                        ? "bg-green-500"
                        : "bg-amber-500"
                  }`} />
                  {req.status}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="font-heading text-xs font-bold text-[#0A1931] leading-tight">
                  {req.title}
                </h4>
                <p className="font-body text-[11px] text-gray-500 leading-relaxed">
                  {req.desc}
                </p>
              </div>

              {/* Mentor Reply block (Only for resolved chemistry card in initial list) */}
              {req.reply && (
                <div className="bg-[#F6FAFD] border-l-4 border-[#4A7FA7] p-3 rounded-r-xl space-y-1">
                  <h5 className="font-heading text-[9px] font-bold text-[#1A3D63] flex items-center gap-1 uppercase tracking-wider">
                    💬 Mentor Reply
                  </h5>
                  <p className="font-body text-[10px] text-gray-600 leading-relaxed">
                    {req.reply}
                  </p>
                </div>
              )}

              {/* Helper Profile Footer */}
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Avatar 
                    src={req.helperName === "Peer: Nayana" ? profileImg : null} 
                    name={req.helperName} 
                    color={req.helperColor} 
                    size="xs" 
                  />
                  <div className="min-w-0">
                    <p className="font-heading font-semibold text-gray-600 truncate max-w-[100px] leading-tight">
                      {req.helperName}
                    </p>
                    <p className="font-body text-[9px] text-gray-400">
                      {req.helperRole}
                    </p>
                  </div>
                </div>
                <span className="font-body text-[10px] text-gray-300">
                  {req.date}
                </span>
              </div>

              {/* View details action */}
              <button className="font-body text-[10px] font-bold text-[#4A7FA7] hover:text-[#1A3D63] text-left mt-2 flex items-center gap-1 transition-colors border-none bg-transparent">
                View Details
                <ArrowRight size={12} />
              </button>

            </div>
          ))}
        </div>
      </div>

      {/* ── Row 4: Summary & Tips Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Request Summary Widget (2/5 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
            <span className="text-sm">📊</span>
            <h3 className="font-heading text-sm font-semibold text-[#0A1931]">Your Request Summary</h3>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center py-2">
            <div className="bg-[#F6FAFD] rounded-xl p-3 border border-gray-50">
              <span className="font-heading text-xl font-bold text-[#1A3D63] block">
                {totalRequests}
              </span>
              <span className="font-body text-[9px] text-gray-400 mt-1 block">
                Total Requests
              </span>
            </div>
            <div className="bg-[#F6FAFD] rounded-xl p-3 border border-gray-50">
              <span className="font-heading text-xl font-bold text-amber-600 block">
                {inProgressRequests}
              </span>
              <span className="font-body text-[9px] text-gray-400 mt-1 block">
                In Progress
              </span>
            </div>
            <div className="bg-[#F6FAFD] rounded-xl p-3 border border-gray-50">
              <span className="font-heading text-xl font-bold text-green-600 block">
                {resolvedRequests}
              </span>
              <span className="font-body text-[9px] text-gray-400 mt-1 block">
                Resolved
              </span>
            </div>
          </div>
        </div>

        {/* Tips for Better Requests (3/5 width) */}
        <div className="lg:col-span-3 bg-[#EAF0F6] rounded-2xl p-5 shadow-sm border border-[#B3CFE5]/30 flex flex-col justify-between">
          <div className="flex items-center gap-2 border-b border-[#B3CFE5]/30 pb-3 mb-3">
            <span className="text-sm">💡</span>
            <h3 className="font-heading text-sm font-semibold text-[#1A3D63]">Tips for Better Requests</h3>
          </div>

          <ul className="space-y-2.5 font-body text-xs text-[#4A6880] leading-normal pl-1">
            <li className="flex gap-2.5 items-start">
              <span className="w-4 h-4 rounded-full bg-[#1A3D63] text-white flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">✓</span>
              <span>Be specific about the topic — mention the chapter, exercise number, and exactly where you're stuck.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="w-4 h-4 rounded-full bg-[#1A3D63] text-white flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">✓</span>
              <span>Mention which module the problem is from so mentors can prepare the right resources for you.</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="w-4 h-4 rounded-full bg-[#1A3D63] text-white flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0">✓</span>
              <span>Set the correct priority level so mentors can respond faster to urgent exam-related queries.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  )
}

export default HelpPage
