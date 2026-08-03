import api from "./axiosInstance"

// ── Get Community Summary Metrics ───────────────────────────
export async function getCommunitySummary() {
  const response = await api.get("/community/summary")
  return response.data
}

// ── Public Forum APIs ───────────────────────────────────────
export async function getPublicRequests(params = {}) {
  const response = await api.get("/community/public", { params })
  return response.data
}

export async function createPublicRequest(requestData) {
  const response = await api.post("/community/public", requestData)
  return response.data
}

export async function createPublicReply(requestId, replyData) {
  const response = await api.post(`/community/public/${requestId}/reply`, replyData)
  return response.data
}

export async function acceptPublicReply(requestId, replyId) {
  const response = await api.post(`/community/public/${requestId}/reply/${replyId}/accept`)
  return response.data
}

// ── Direct Requests APIs (1-on-1 Private Messaging) ─────────
export async function getDirectRequests(tab = "inbox") {
  const response = await api.get("/community/direct", { params: { tab } })
  return response.data
}

export async function createDirectRequest(directData) {
  const response = await api.post("/community/direct", directData)
  return response.data
}

export async function getDirectThread(threadId) {
  const response = await api.get(`/community/direct/${threadId}`)
  return response.data
}

export async function sendDirectMessage(threadId, messageData) {
  const response = await api.post(`/community/direct/${threadId}/messages`, messageData)
  return response.data
}

export async function updateDirectStatus(threadId, status) {
  const response = await api.patch(`/community/direct/${threadId}/status`, { status })
  return response.data
}

export async function escalateToDirect(publicRequestId, publicReplyId) {
  const response = await api.post("/community/direct/escalate", {
    public_request_id: publicRequestId,
    public_reply_id: publicReplyId
  })
  return response.data
}

// ── Voting APIs ─────────────────────────────────────────────

// Vote on a public question: voteType = 'up' | 'down'
// Calling with the same voteType again removes the vote (toggle)
export async function votePublicRequest(requestId, voteType) {
  const response = await api.post(`/community/public/${requestId}/vote`, { vote_type: voteType })
  return response.data
}

// Vote on a public reply/answer: voteType = 'up' | 'down'
export async function votePublicReply(requestId, replyId, voteType) {
  const response = await api.post(`/community/public/${requestId}/reply/${replyId}/vote`, { vote_type: voteType })
  return response.data
}
