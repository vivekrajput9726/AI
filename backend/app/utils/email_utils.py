import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config.settings import settings
from loguru import logger


def send_email(to_email: str, subject: str, html_body: str):
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("Email not configured — skipping email send")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USER
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info(f"Email sent to {to_email}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


_PLACEHOLDERS = {"", "your_app_password", "your_email@gmail.com"}

def _smtp_configured() -> bool:
    return (
        bool(settings.SMTP_HOST)
        and settings.SMTP_USER not in _PLACEHOLDERS
        and settings.SMTP_PASSWORD not in _PLACEHOLDERS
    )


def send_otp_email(to_email: str, otp_code: str, full_name: str) -> bool:
    """Send OTP verification email. Returns True on success, False if SMTP not configured."""
    if not _smtp_configured():
        logger.info(f"[OTP] {otp_code} for {to_email} — configure SMTP_USER/SMTP_PASSWORD in .env to send real emails")
        return False

    html_body = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:32px;text-align:center;">
              <span style="color:#fff;font-size:22px;font-weight:700;">&#10084; Synora Health</span>
              <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">Email Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 36px;">
              <p style="color:#374151;font-size:16px;margin:0 0 8px;">Hi <strong>{full_name}</strong>,</p>
              <p style="color:#6b7280;font-size:14px;margin:0 0 28px;line-height:1.6;">
                Use the code below to verify your email and complete registration.
                This code expires in <strong>10 minutes</strong>.
              </p>
              <div style="background:#eff6ff;border:2px dashed #3b82f6;border-radius:12px;
                          padding:24px;text-align:center;margin-bottom:28px;">
                <p style="color:#6b7280;font-size:12px;text-transform:uppercase;
                           letter-spacing:2px;margin:0 0 10px;">Your verification code</p>
                <p style="color:#1d4ed8;font-size:40px;font-weight:900;
                           letter-spacing:12px;margin:0;font-family:monospace;">{otp_code}</p>
              </div>
              <p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0;">
                If you did not request this code, you can safely ignore this email.
                Never share this code with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; 2025 Synora Health</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    plain = (
        f"Hi {full_name},\n\n"
        f"Your Synora Health verification code is: {otp_code}\n\n"
        f"This code is valid for 10 minutes. Do not share it with anyone.\n\n"
        f"— Synora Health Team"
    )

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Synora Health Verification Code"
        msg["From"] = f"Synora Health <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())

        logger.info(f"OTP email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        return False


def send_appointment_booked_email(patient_email: str, patient_name: str, doctor_name: str, date: str, time: str):
    send_email(
        to_email=patient_email,
        subject="Appointment Booked - AI Healthcare",
        html_body=f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Appointment Confirmed!</h2>
            <p>Hi <b>{patient_name}</b>,</p>
            <p>Your appointment has been booked successfully.</p>
            <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><b>Doctor:</b> {doctor_name}</p>
                <p><b>Date:</b> {date}</p>
                <p><b>Time:</b> {time}</p>
            </div>
            <p>Please be on time for your appointment.</p>
            <p style="color: #6b7280;">AI Healthcare Platform</p>
        </div>
        """
    )


def send_appointment_confirmed_email(patient_email: str, patient_name: str, doctor_name: str, date: str, time: str, meeting_link: str = None):
    meeting_section = ""
    if meeting_link:
        meeting_section = f"""
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center;">
            <p style="margin: 0 0 12px 0; font-weight: bold; color: #1d4ed8;">Your Video Consultation Link</p>
            <a href="{meeting_link}"
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
               Join Video Consultation
            </a>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280; word-break: break-all;">{meeting_link}</p>
        </div>
        """
    send_email(
        to_email=patient_email,
        subject="Appointment Confirmed — Video Link Inside | AI Healthcare",
        html_body=f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #16a34a;">Appointment Confirmed!</h2>
            <p>Hi <b>{patient_name}</b>,</p>
            <p>Your appointment has been confirmed by <b>{doctor_name}</b>.</p>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0;"><b>Doctor:</b> {doctor_name}</p>
                <p style="margin: 4px 0;"><b>Date:</b> {date}</p>
                <p style="margin: 4px 0;"><b>Time:</b> {time}</p>
            </div>
            {meeting_section}
            <p style="font-size: 13px; color: #6b7280;">Click the button above at the appointment time to join your video consultation. No downloads needed — it opens directly in your browser.</p>
            <p style="color: #6b7280;">AI Healthcare Platform</p>
        </div>
        """
    )


def send_appointment_cancelled_email(patient_email: str, patient_name: str, doctor_name: str, date: str):
    send_email(
        to_email=patient_email,
        subject="Appointment Cancelled - AI Healthcare",
        html_body=f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #dc2626;">Appointment Cancelled</h2>
            <p>Hi <b>{patient_name}</b>,</p>
            <p>Your appointment with <b>{doctor_name}</b> on <b>{date}</b> has been cancelled.</p>
            <p>Please book a new appointment at your convenience.</p>
            <p style="color: #6b7280;">AI Healthcare Platform</p>
        </div>
        """
    )
