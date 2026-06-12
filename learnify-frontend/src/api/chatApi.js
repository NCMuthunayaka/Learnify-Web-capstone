import api from "./axiosInstance"

// ── Session Management ────────────────────────────────────────────────────────

/** Create a new chat session. Returns { session, greeting } */
export const createChatSession = (title = "New Chat") =>
  api.post("/chat/sessions", { title })

/** List all chat sessions for the current user */
export const getChatSessions = () =>
  api.get("/chat/sessions")

/** Get all messages in a specific session */
export const getChatMessages = (sessionId) =>
  api.get(`/chat/sessions/${sessionId}/messages`)

// ── Messaging ─────────────────────────────────────────────────────────────────

/** Send a text message and get the AI reply */
export const sendChatMessage = (sessionId, content) =>
  api.post(`/chat/sessions/${sessionId}/messages`, { content })

// ── File Upload ───────────────────────────────────────────────────────────────

/**
 * Upload a file (PDF or image) to the chat.
 * @param {number} sessionId
 * @param {File}   file       - the File object from an input element
 * @param {string} caption    - optional user caption/question about the file
 */
export const uploadChatFile = (sessionId, file, caption = "") => {
  const formData = new FormData()
  formData.append("file", file)
  if (caption) formData.append("caption", caption)

  return api.post(`/chat/sessions/${sessionId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
}
