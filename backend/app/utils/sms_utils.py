from app.config.settings import settings
from loguru import logger


def send_sms(to_phone: str, message: str):
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        logger.warning("Twilio not configured — skipping SMS send")
        return False
    if not to_phone or not to_phone.strip():
        logger.warning("No phone number provided — skipping SMS")
        return False
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(body=message, from_=settings.TWILIO_PHONE_NUMBER, to=to_phone)
        logger.info(f"SMS sent to {to_phone}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_phone}: {e}")
        return False


def send_appointment_booked_sms(phone: str, patient_name: str, doctor_name: str, date: str, time: str):
    send_sms(
        to_phone=phone,
        message=f"Hi {patient_name}! Your appointment with {doctor_name} is booked for {date} at {time}. - AI Healthcare"
    )


def send_appointment_confirmed_sms(phone: str, patient_name: str, doctor_name: str, date: str, time: str, meeting_link: str = None):
    msg = f"Hi {patient_name}! Your appointment with {doctor_name} on {date} at {time} is confirmed."
    if meeting_link:
        msg += f" Join here: {meeting_link}"
    msg += " - AI Healthcare"
    send_sms(to_phone=phone, message=msg)


def send_appointment_cancelled_sms(phone: str, patient_name: str, doctor_name: str, date: str):
    send_sms(
        to_phone=phone,
        message=f"Hi {patient_name}, your appointment with {doctor_name} on {date} has been cancelled. Please rebook. - AI Healthcare"
    )


def send_appointment_reminder_sms(phone: str, patient_name: str, doctor_name: str, date: str, time: str):
    send_sms(
        to_phone=phone,
        message=f"Reminder: Hi {patient_name}, you have an appointment with {doctor_name} tomorrow {date} at {time}. - AI Healthcare"
    )
