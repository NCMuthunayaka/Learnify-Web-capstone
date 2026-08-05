import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class SentimentService:
    """
    Service for analyzing sentiment in user feedback.
    Uses OpenAI GPT for advanced sentiment analysis.
    """

    @staticmethod
    def analyze_sentiment(text: str) -> dict:
        """
        Analyze the sentiment of feedback using OpenAI.
        
        Args:
            text (str): The feedback text to analyze
            
        Returns:
            dict: {
                "sentiment": "positive" | "negative" | "neutral",
                "confidence": float (0.0 to 1.0),
                "polarity": float (-1.0 to 1.0)
            }
        """
        if not text or not isinstance(text, str):
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "polarity": 0.0
            }

        try:
            prompt = (
                "Analyze the sentiment of the following student feedback. "
                "Return only a JSON object with keys: "
                "sentiment (positive/negative/neutral), "
                "confidence (0.0 to 1.0 float), and "
                "polarity (-1.0 to 1.0 where -1 is most negative, 1 is most positive).\n\n"
                f"Feedback: {text}"
            )
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
            )
            result = json.loads(response.choices[0].message.content)
            
            # Normalize sentiment to lowercase
            if "sentiment" in result:
                result["sentiment"] = result["sentiment"].lower()
            
            return result
        except Exception as e:
            print(f"Sentiment analysis error: {str(e)}")
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "polarity": 0.0
            }

    @staticmethod
    def get_sentiment_color(sentiment):
        """
        Get color associated with sentiment.
        
        Args:
            sentiment (str): "positive", "negative", or "neutral"
            
        Returns:
            str: Color code (hex)
        """
        colors = {
            "positive": "#10b981",  # emerald
            "negative": "#ef4444",  # red
            "neutral": "#6b7280"    # gray
        }
        return colors.get(sentiment.lower(), "#6b7280")

    @staticmethod
    def get_sentiment_emoji(sentiment):
        """
        Get emoji associated with sentiment.
        
        Args:
            sentiment (str): "positive", "negative", or "neutral"
            
        Returns:
            str: Emoji character
        """
        emojis = {
            "positive": "😊",
            "negative": "😞",
            "neutral": "😐"
        }
        return emojis.get(sentiment.lower(), "😐")

    @staticmethod
    def categorize_feedback_type(text):
        """
        Auto-categorize feedback based on keywords.
        
        Args:
            text (str): The feedback text
            
        Returns:
            str: Category ("bug", "feature", "improvement", "other")
        """
        text_lower = text.lower()

        bug_keywords = ["bug", "broken", "error", "crash", "issue", "not working", "fail"]
        feature_keywords = ["feature", "add", "new", "would like", "wish", "request", "suggest"]
        improvement_keywords = ["improve", "better", "enhance", "optimize", "performance", "speed"]

        for keyword in bug_keywords:
            if keyword in text_lower:
                return "bug"

        for keyword in feature_keywords:
            if keyword in text_lower:
                return "feature"

        for keyword in improvement_keywords:
            if keyword in text_lower:
                return "improvement"

        return "other"


# Legacy function support
def analyze_sentiment_legacy(text: str) -> dict:
    """Legacy function wrapper for backward compatibility."""
    return SentimentService.analyze_sentiment(text)
