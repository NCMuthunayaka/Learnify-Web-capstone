import os
import requests
from flask import current_app
from flask_mail import Message
from app.extensions import mail

def send_reset_password_email(recipient_email, recipient_name, reset_url):
    """
    Sends password reset email.
    Prefers HTTP API (Resend) if RESEND_API_KEY is configured on Railway,
    falling back to Flask-Mail SMTP.
    """
    resend_api_key = (
        os.environ.get("RESEND_API_KEY") or 
        os.environ.get("RESEND_KEY") or 
        os.environ.get("RESEND_TOKEN") or ""
    ).strip()
    sender_addr = os.environ.get("MAIL_DEFAULT_SENDER") or os.environ.get("MAIL_USERNAME", "onboarding@resend.dev")

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0A1931;">Reset Your Password</h2>
      <p style="color: #555;">Hi {recipient_name or 'there'},</p>
      <p style="color: #555;">
        You requested a password reset for your Learnify account.
        Click the button below to reset your password.
        This link expires in <strong>1 hour</strong>.
      </p>
      <a href="{reset_url}"
        style="display: inline-block; background: #1A3D63; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #999; font-size: 12px;">
        If you didn't request this, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee;" />
      <p style="color: #999; font-size: 11px;">
        © 2026 Learnify · Sabaragamuwa University of Sri Lanka
      </p>
    </div>
    """

    # Method 1: Resend HTTP API (HTTPS Port 443 — Never blocked on Railway)
    if resend_api_key:
        try:
            print(f"📧 Sending reset email via Resend API to {recipient_email}...")
            # Resend requires onboarding@resend.dev for unverified domains
            resend_from = os.environ.get("RESEND_FROM_EMAIL", "Learnify <onboarding@resend.dev>")

            resp = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": resend_from,
                    "to": [recipient_email],
                    "subject": "Reset Your Learnify Password",
                    "html": html_content,
                },
                timeout=10
            )
            if resp.status_code in (200, 201):
                print(f"✅ Email delivered successfully via Resend API: {resp.json()}")
                return True, resp.json()
            else:
                err_text = f"Resend API error ({resp.status_code}): {resp.text}"
                print(f"❌ {err_text}")
                raise Exception(err_text)
        except Exception as e:
            print(f"❌ Resend HTTP API error: {e}")
            raise e

    # Method 2: Standard Flask-Mail SMTP fallback
    try:
        sender = current_app.config.get("MAIL_DEFAULT_SENDER") or current_app.config.get("MAIL_USERNAME")
        msg = Message(
            subject="Reset Your Learnify Password",
            recipients=[recipient_email],
            sender=sender,
            html=html_content
        )
        mail.send(msg)
        print(f"✅ Email sent via SMTP to {recipient_email}")
        return True, "SMTP Sent"
    except Exception as e:
        import traceback
        print(f"❌ SMTP Email sending failed: {e}")
        traceback.print_exc()
        raise e
