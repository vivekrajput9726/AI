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


def send_appointment_confirmed_email(patient_email: str, patient_name: str, doctor_name: str, date: str, time: str):
    send_email(
        to_email=patient_email,
        subject="Appointment Confirmed by Doctor - AI Healthcare",
        html_body=f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #16a34a;">Appointment Confirmed!</h2>
            <p>Hi <b>{patient_name}</b>,</p>
            <p>Your appointment has been confirmed by the doctor.</p>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p><b>Doctor:</b> {doctor_name}</p>
                <p><b>Date:</b> {date}</p>
                <p><b>Time:</b> {time}</p>
            </div>
            <p>You can now chat with your doctor and join a video consultation.</p>
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
