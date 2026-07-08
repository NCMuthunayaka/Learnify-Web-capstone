import { useState, useEffect } from "react"
import { Paperclip, Send, Users, User, ArrowRight, CheckCircle2, AlertCircle, Clock, Sparkles, GraduationCap } from "lucide-react"
import Avatar from "../components/common/Avatar"
import Badge from "../components/common/Badge"
import Button from "../components/common/Button"
import helpImg from "../assets/images/help.png"
import profileImg from "../assets/icons/profile.png"
import { getHelpRequests, createHelpRequest, getAvailableMentors } from "../api/helpRequestsApi"
import { getSubjects } from "../api/subjectsApi"

function HelpPage() {
  const [requests, setRequests] = useState([])
  const [mentors, setMentors] = useState([])
  const [selectedMentor, setSelectedMentor] = useState("")
  const [subject, setSubject] = useState("Mathematics")
  const [requestType, setRequestType] = useState("Mentor") // "Mentor" or "Peer"
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("Medium") // "Low", "Medium", "High"
  const [successMsg, setSuccessMsg] = useState(false)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])

  // Load help requests, available mentors, and subjects on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const reqRes = await getHelpRequests()
        setRequests(reqRes.data.requests)

        const mentorRes = await getAvailableMentors()
        const mentorList = mentorRes.data.mentors
        setMentors(mentorList)
        if (mentorList.length > 0) {
          setSelectedMentor(mentorList[0].display)
        }

        const subRes = await getSubjects()
        const subjectList = subRes.data || []
        setSubjects(subjectList)
        if (subjectList.length > 0) {
          setSubject(subjectList[0].name)
        }
      } catch (err) {
        console.error("Failed to load help page data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Calculations for summary metrics
  const totalRequests = requests.length
  const resolvedRequests = requests.filter(r => r.status === "Resolved").length
  const inProgressRequests = totalRequests - resolvedRequests

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    const matchedMentor = mentors.find(m => m.display === selectedMentor)
    const assignedToId = matchedMentor ? matchedMentor.id : null

    try {
      await createHelpRequest({
        title: title,
        description: description,
        subject: subject,
        priority: priority.toLowerCase(),
        request_type: requestType.toLowerCase(),
        assigned_to: assignedToId
      })

      setTitle("")
      setDescription("")
      setSuccessMsg(true)
      setTimeout(() => setSuccessMsg(false), 3000)

      // Refresh list
      const reqRes = await getHelpRequests()
      setRequests(reqRes.data.requests)
    } catch (err) {
      console.error("Failed to submit help request:", err)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ── Top Row: Form & Help Graphic Card in Single Card Wrapper ── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Form (7/12 width) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📩</span>
                <h3 className="font-heading text-sm font-semibold text-[#0A1931]">Send a Help Request</h3>
              </div>

              <form onSubmit={handleSubmit} className="w-full space-y-5">
                {successMsg && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl font-body text-xs font-semibold border border-green-200">
                    ✓ Request submitted successfully!
                  </div>
                )}

                {/* Select Mentor */}
                <div>
                  <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                    Select Mentor
                  </label>
                  <select
                    value={selectedMentor}
                    onChange={(e) => setSelectedMentor(e.target.value)}
                    className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f]/30 transition-all cursor-pointer"
                  >
                    {mentors.length > 0 ? (
                      mentors.map(m => (
                        <option key={m.id} value={m.display}>{m.display}</option>
                      ))
                    ) : (
                      <option>No mentors available</option>
                    )}
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
                    className="w-full bg-[#f2f1ed] text-gray-800 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f]/30 transition-all cursor-pointer"
                  >
                    {subjects.length > 0 ? (
                      subjects.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          {sub.name}
                        </option>
                      ))
                    ) : (
                      <option>Loading subjects...</option>
                    )}
                  </select>
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
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-xs font-semibold transition-all border-none ${
                        requestType === "Mentor"
                          ? "bg-[#3b719f] text-white"
                          : "bg-[#e2edf7] text-[#3b719f] hover:bg-[#d4e3f0]"
                      }`}
                    >
                      <GraduationCap size={14} />
                      Mentor
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestType("Peer")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-xs font-semibold transition-all border-none ${
                        requestType === "Peer"
                          ? "bg-[#3b719f] text-white"
                          : "bg-[#e2edf7] text-[#3b719f] hover:bg-[#d4e3f0]"
                      }`}
                    >
                      <Users size={14} />
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
                    className="w-full bg-[#f2f1ed] text-gray-800 placeholder-gray-400 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f]/30 transition-all"
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
                    rows={4}
                    className="w-full bg-[#f2f1ed] text-gray-800 placeholder-gray-400 font-body text-xs px-4 py-3 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-[#3b719f]/30 transition-all resize-none pr-12"
                  />
                </div>

                {/* Priority Selector */}
                <div>
                  <label className="font-heading text-[10px] font-bold text-[#4A7FA7] uppercase tracking-wider block mb-1.5">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {[
                      { 
                        name: "Low", 
                        selectedClass: "bg-[#0da65f] text-white border-[#0da65f]",
                        unselectedClass: "bg-[#eaf7f1] text-[#0da65f] border-[#c6eedb]",
                        dotClass: "bg-[#0da65f]"
                      },
                      { 
                        name: "Medium", 
                        selectedClass: "bg-[#c87010] text-white border-[#c87010]",
                        unselectedClass: "bg-[#faf1e6] text-[#c87010] border-[#f3ddc2]",
                        dotClass: "bg-[#c87010]"
                      },
                      { 
                        name: "High", 
                        selectedClass: "bg-[#d62828] text-white border-[#d62828]",
                        unselectedClass: "bg-[#fdebed] text-[#d62828] border-[#f9c5c8]",
                        dotClass: "bg-[#d62828]"
                      }
                    ].map((item) => {
                      const isSelected = priority === item.name
                      const btnStyle = isSelected ? item.selectedClass : item.unselectedClass
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setPriority(item.name)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-xs font-semibold transition-all border ${btnStyle}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : item.dotClass}`} />
                          {item.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="w-full flex items-center justify-between pt-4">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-5 py-2.5 border border-[#3b719f] text-[#3b719f] bg-white hover:bg-[#e2edf7]/30 rounded-2xl font-body text-xs font-bold transition-all"
                  >
                    <Paperclip size={14} />
                    Attach File
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-[#3b719f] hover:bg-[#2e597c] text-white rounded-2xl font-body text-xs font-bold transition-all shadow-sm border-none cursor-pointer"
                  >
                    Submit Request →
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* Right Illustration Column (5/12 width) */}
          <div className="lg:col-span-5 flex">
            <img 
              src={helpImg} 
              alt="Need Help?" 
              className="w-full h-full object-cover rounded-3xl"
            />
          </div>

        </div>
      </div>

      {/* ── Row 2: Available Mentors & Peers ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
          <Users size={16} className="text-[#4A7FA7]" />
          <h3 className="font-heading text-sm font-semibold text-[#0A1931]">Available Mentors & Peers</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mentors.map((helper, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 bg-[#F6FAFD] rounded-2xl border border-gray-50">
              <div className="flex items-center gap-3">
                <Avatar 
                  src={helper.name === "Peer: Nayana" ? profileImg : null} 
                  name={helper.name} 
                  color="primary" 
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
          {loading ? (
            <div className="col-span-3 text-center py-8 text-gray-400 text-xs">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="col-span-3 text-center py-8 text-gray-400 text-xs">No previous requests found.</div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4">
                
                {/* Card Header badges */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-[#1A3D63] border border-blue-100/50 rounded-full font-body text-[10px] font-bold">
                    {req.subject}
                  </span>
                  
                  {/* Status Badge */}
                  <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-bold flex items-center gap-1.5 ${
                    req.status === "Accepted" || req.status === "In progress" || req.status === "In Progress"
                      ? "bg-blue-50 text-blue-600 border border-blue-100"
                      : req.status === "Resolved"
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      req.status === "Accepted" || req.status === "In progress" || req.status === "In Progress"
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

                {/* Mentor Reply block */}
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
            ))
          )}
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
