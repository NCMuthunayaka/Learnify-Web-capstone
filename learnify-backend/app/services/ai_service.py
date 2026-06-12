"""
AI Service — Learnify
Primary  : Google Gemini 2.0 Flash (via google-genai SDK)
Fallback : OpenAI GPT-4  (only if OPENAI_API_KEY is set and Gemini fails)
"""
import os
import base64
import json
from typing import Optional

# ── Gemini (new SDK: google-genai) ────────────────────────────────────────────
from google import genai
from google.genai import types as genai_types

_gemini_key = os.getenv("GEMINI_API_KEY", "")
gemini_client = genai.Client(api_key=_gemini_key) if _gemini_key else None

GEMINI_MODEL = "gemini-2.0-flash"

# ── OpenAI (fallback) ─────────────────────────────────────────────────────────
_openai_key    = os.getenv("OPENAI_API_KEY", "")
_openai_client = None
if _openai_key and _openai_key != "your-openai-api-key-here":
    try:
        from openai import OpenAI
        _openai_client = OpenAI(api_key=_openai_key)
    except ImportError:
        pass

# ── System prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are Learnify's academic assistant. Help university students with "
    "study planning, coursework questions, scheduling advice, and productivity. "
    "Be concise, encouraging, and professional. "
    "When analysing uploaded files, extract key academic content and summarise clearly."
)


# ═════════════════════════════════════════════════════════════════════════════
# CHAT RESPONSE
# ═════════════════════════════════════════════════════════════════════════════

def get_ai_response(
    user_message: str,
    history: list,                       # list of {"role": ..., "content": ...}
    file_data: Optional[bytes] = None,   # raw bytes of uploaded file
    file_mime: Optional[str]   = None,   # e.g. "image/png", "application/pdf"
) -> str:
    """
    Returns AI reply string.
    Tries Gemini 2.0 Flash first; falls back to GPT-4 on any error.
    """
    try:
        return _gemini_chat(user_message, history, file_data, file_mime)
    except Exception as gemini_err:
        print(f"[ai_service] Gemini failed: {gemini_err}")
        if _openai_client:
            try:
                return _openai_chat(user_message, history)
            except Exception as openai_err:
                print(f"[ai_service] GPT-4 fallback also failed: {openai_err}")
        raise RuntimeError("All AI providers failed. Please try again later.")


# ── Gemini chat ───────────────────────────────────────────────────────────────
def _gemini_chat(
    user_message: str,
    history: list,
    file_data: Optional[bytes],
    file_mime: Optional[str],
) -> str:
    if not gemini_client:
        raise RuntimeError("Gemini client not configured (missing GEMINI_API_KEY)")

    # Build conversation history in Gemini SDK format
    gemini_history = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append(
            genai_types.Content(role=role, parts=[genai_types.Part.from_text(msg["content"])])
        )

    # Build current user turn parts
    parts = []

    if file_data and file_mime:
        if file_mime == "application/pdf":
            # Extract text from PDF and add as inline text
            pdf_text = _extract_pdf_text(file_data)
            parts.append(genai_types.Part.from_text(f"[Uploaded PDF content]:\n{pdf_text}\n\n"))
        else:
            # Image — pass as inline data
            parts.append(
                genai_types.Part.from_bytes(data=file_data, mime_type=file_mime)
            )

    parts.append(genai_types.Part.from_text(user_message))

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=gemini_history + [genai_types.Content(role="user", parts=parts)],
        config=genai_types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            max_output_tokens=1024,
            temperature=0.7,
        ),
    )
    return response.text


# ── OpenAI fallback chat ──────────────────────────────────────────────────────
def _openai_chat(user_message: str, history: list) -> str:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history[-20:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    response = _openai_client.chat.completions.create(
        model="gpt-4",
        messages=messages,
        max_tokens=1024,
        temperature=0.7,
    )
    return response.choices[0].message.content


# ═════════════════════════════════════════════════════════════════════════════
# TIMETABLE GENERATION
# ═════════════════════════════════════════════════════════════════════════════

def generate_timetable(
    intensity: str,
    focus_subject: str,
    exam_date: str,
    subjects: list,
) -> list:
    """
    Returns a list of session dicts:
      [{ "day": "Monday", "start_time": "08:00", "end_time": "10:00",
         "subject": "Mathematics", "session_type": "revision" }, ...]
    """
    prompt = _build_timetable_prompt(intensity, focus_subject, exam_date, subjects)
    try:
        return _gemini_timetable(prompt)
    except Exception as e:
        print(f"[ai_service] Gemini timetable failed: {e}")
        if _openai_client:
            return _openai_timetable(prompt)
        raise RuntimeError("Timetable generation failed. Please try again.")


def _build_timetable_prompt(intensity, focus_subject, exam_date, subjects):
    subjects_str = ", ".join(subjects) if subjects else "General Studies"
    return (
        f"Generate a weekly study timetable for a university student.\n"
        f"Study intensity: {intensity}\n"
        f"Focus subject: {focus_subject}\n"
        f"Exam date: {exam_date}\n"
        f"Subjects: {subjects_str}\n\n"
        f"Return ONLY a valid JSON array with NO markdown, NO code fences, NO explanation.\n"
        f'Each element must have exactly these keys: '
        f'"day" (Monday-Sunday), "start_time" (HH:MM 24h), "end_time" (HH:MM 24h), '
        f'"subject" (must match one of the listed subjects), '
        f'"session_type" (study|revision|practice|rest)'
    )


def _gemini_timetable(prompt: str) -> list:
    if not gemini_client:
        raise RuntimeError("Gemini client not configured")

    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            system_instruction="You are a study planning assistant. Return only valid JSON arrays with no extra text.",
            max_output_tokens=2048,
            temperature=0.4,
        ),
    )
    raw = response.text.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])
    return json.loads(raw)


def _openai_timetable(prompt: str) -> list:
    response = _openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a study planning assistant. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=2048,
        temperature=0.4,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1])
    return json.loads(raw)


# ═════════════════════════════════════════════════════════════════════════════
# UTILITIES
# ═════════════════════════════════════════════════════════════════════════════

def _extract_pdf_text(file_data: bytes) -> str:
    """Extract plain text from PDF bytes using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        doc  = fitz.open(stream=file_data, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text[:8000]   # cap at 8000 chars to stay within token limits
    except Exception as e:
        return f"[Could not extract PDF text: {e}]"
