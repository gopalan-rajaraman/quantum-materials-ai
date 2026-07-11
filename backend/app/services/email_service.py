import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import asyncio
from app.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_login_alert(to_email: str, ip_address: str, user_name: str):
        """Sends a new login alert email synchronously."""
        try:
            if not settings.SMTP_HOST or not settings.SMTP_USER:
                logger.warning("SMTP not configured. Skipping email alert.")
                return

            msg = MIMEMultipart()
            msg['From'] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
            msg['To'] = to_email
            msg['Subject'] = "New Login Detected - Quantum Materials AI"

            body = f"""
Hello {user_name},

We detected a new login to your Quantum Materials AI account.

IP Address: {ip_address}

If this was you, you can safely ignore this email.
If you did not authorize this login, please secure your account immediately.

Regards,
Quantum Materials AI Team
"""
            
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            logger.info(f"Login alert email sent to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")

    @staticmethod
    async def send_login_alert_async(to_email: str, ip_address: str, user_name: str):
        """Sends a new login alert email asynchronously."""
        await asyncio.to_thread(EmailService.send_login_alert, to_email, ip_address, user_name)

email_service = EmailService()
