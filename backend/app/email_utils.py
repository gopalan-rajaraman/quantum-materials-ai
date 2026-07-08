"""
Email sending utility using aiosmtplib (async SMTP).
Configure via environment variables in backend/.env
"""

import logging
import os

import aiosmtplib
from dotenv import load_dotenv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

load_dotenv()

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_NAME = os.getenv("FROM_NAME", "Quantum Materials AI")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def smtp_configured() -> bool:
    """Return True when required SMTP credentials are present."""
    return bool(SMTP_USER and SMTP_PASSWORD)


def log_smtp_status() -> None:
    """Log SMTP configuration status at startup (never logs secrets)."""
    if smtp_configured():
        logger.info(
            "SMTP configured: host=%s port=%s user=%s from=%s frontend=%s",
            SMTP_HOST,
            SMTP_PORT,
            SMTP_USER,
            FROM_EMAIL,
            FRONTEND_URL,
        )
    else:
        logger.warning(
            "SMTP not fully configured (SMTP_USER/SMTP_PASSWORD missing). "
            "Password reset and verification emails will fail."
        )


async def _send(to_email: str, subject: str, html_body: str) -> None:
    """Low-level async send."""
    if not smtp_configured():
        raise RuntimeError("SMTP is not configured. Set SMTP_USER and SMTP_PASSWORD in backend/.env")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    logger.info("Sending email to %s subject=%r via %s:%s", to_email, subject, SMTP_HOST, SMTP_PORT)
    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASSWORD,
        start_tls=True,
    )
    logger.info("Email sent successfully to %s", to_email)


async def send_password_reset_email(to_email: str, reset_token: str) -> None:
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f5f3ff;font-family:'Inter',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:40px 20px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(99,102,241,0.12);">

            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:36px 40px;text-align:center;">
                <div style="display:inline-flex;align-items:center;gap:10px;">
                  <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:36px;text-align:center;font-size:18px;">â¬¡</div>
                  <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;">Quantum Materials AI</span>
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:44px 40px 36px;">
                <div style="text-align:center;margin-bottom:28px;">
                  <div style="width:68px;height:68px;background:#eef2ff;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:32px;">ð</div>
                  <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;">Reset your password</h1>
                  <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">
                    We received a request to reset the password for your account associated with <strong>{to_email}</strong>.
                  </p>
                </div>

                <div style="text-align:center;margin:32px 0;">
                  <a href="{reset_url}"
                     style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(99,102,241,0.35);letter-spacing:0.01em;">
                    Reset Password
                  </a>
                </div>

                <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
                  This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
                </p>

                <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;">

                <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="{reset_url}" style="color:#6366f1;word-break:break-all;">{reset_url}</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f8faff;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">
                  Â© 2026 Quantum Materials AI Â· This is an automated email, please do not reply.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    await _send(to_email, "Reset Your Password â Quantum Materials AI", html)


async def send_verification_email(to_email: str, full_name: str, verify_token: str) -> None:
    verify_url = f"{FRONTEND_URL}/verify-email?token={verify_token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f5f3ff;font-family:'Inter',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:40px 20px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(99,102,241,0.12);">
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:36px 40px;text-align:center;">
                <span style="color:#ffffff;font-size:20px;font-weight:800;">Quantum Materials AI</span>
              </td>
            </tr>
            <tr>
              <td style="padding:44px 40px 36px;text-align:center;">
                <div style="font-size:48px;margin-bottom:16px;">ð</div>
                <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:#1e1b4b;">Welcome, {full_name}!</h1>
                <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
                  Thanks for signing up. Please verify your email address to get started.
                </p>
                <a href="{verify_url}"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;box-shadow:0 4px 18px rgba(99,102,241,0.35);">
                  Verify Email Address
                </a>
                <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">Link expires in 24 hours.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8faff;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">Â© 2026 Quantum Materials AI</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    await _send(to_email, "Verify your email â Quantum Materials AI", html)


async def send_auth_email(event: str, to_email: str, user: dict = None, ip_address: str = 'Unknown', user_agent: str = 'Unknown') -> None:
    if event == "signup":
        subject = "Welcome to Quantum Materials AI"
        icon = "🎉"
        title = "Welcome Aboard!"
        message_body = f"""
            <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
              Hi {user.get('full_name', 'there') if user else 'there'},<br><br>
              Welcome to Quantum Materials AI! We're thrilled to have you join us.
            </p>
            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
              Dive into our platform and explore the tools to advance your materials research.
            </p>
        """
    elif event == "login":
        from datetime import datetime
        login_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        subject = "New login to your account - Quantum Materials AI"
        icon = "🚨"
        title = "New Login Alert"
        message_body = f"""
            <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">
              We noticed a new login to your Quantum Materials AI account.
            </p>
            <ul style="text-align:left;font-size:14px;color:#64748b;line-height:1.6;background:#f8faff;padding:16px 16px 16px 36px;border-radius:12px;margin-bottom:28px;">
              <li><strong>Time:</strong> {login_time}</li>
              <li><strong>IP Address:</strong> {ip_address}</li>
              <li><strong>Device/Browser:</strong> {user_agent}</li>
            </ul>
            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
              If this was you, you can safely ignore this email.<br>
              If you don't recognize this activity, please <a href="{FRONTEND_URL}/reset-password" style="color:#4f46e5;text-decoration:underline;">secure your account immediately</a>.
            </p>
        """
    else:
        return

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f5f3ff;font-family:'Inter',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:40px 20px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(99,102,241,0.12);">
            <tr>
              <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:36px 40px;text-align:center;">
                <span style="color:#ffffff;font-size:20px;font-weight:800;">Quantum Materials AI</span>
              </td>
            </tr>
            <tr>
              <td style="padding:44px 40px 36px;text-align:center;">
                <div style="font-size:48px;margin-bottom:16px;">{icon}</div>
                <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#1e1b4b;">{title}</h1>
                {message_body}
              </td>
            </tr>
            <tr>
              <td style="background:#f8faff;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">&copy; 2026 Quantum Materials AI</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    await _send(to_email, subject, html)
