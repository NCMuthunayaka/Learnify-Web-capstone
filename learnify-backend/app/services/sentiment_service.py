import os
import json

_client = None


def _get_client():
    global _client
    if _client is None:
        from openai import OpenAI
        _client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _client


def analyze_sentiment(text: str) -> dict:
    """Analyze sentiment of feedback text. Falls back to Neutral on any error."""
    try:
        client = _get_client()
        prompt = (
            "Analyze the sentiment of the following student feedback. "
            "Return only a JSON object with keys: "
            "sentiment (Positive/Neutral/Negative) and confidence (0.0 to 1.0).\n\n"
            f"Feedback: {text}"
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"[sentiment_service] analyze_sentiment failed: {e}")
        return {"sentiment": "Neutral", "confidence": 0.5}
