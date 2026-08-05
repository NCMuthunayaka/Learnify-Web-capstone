import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_sentiment(text: str) -> dict:
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
