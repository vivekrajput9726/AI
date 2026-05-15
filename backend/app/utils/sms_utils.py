from loguru import logger


def send_sms(to_phone: str, message: str) -> bool:
    """Send SMS via Twilio or log if not configured."""
    try:
        from app.config.settings import settings
        account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
        auth_token  = getattr(settings, "TWILIO_AUTH_TOKEN", None)
        from_phone  = getattr(settings, "TWILIO_PHONE_NUMBER", None)

        if account_sid and auth_token and from_phone and \
           account_sid != "your_twilio_account_sid":
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            client.messages.create(body=message, from_=from_phone, to=to_phone)
            logger.info(f"SMS sent to {to_phone}")
            return True
    except Exception as e:
        logger.warning(f"SMS send failed to {to_phone}: {e}")

    logger.info(f"[SMS stub] To: {to_phone} | {message[:80]}")
    return False


def send_appointment_booked_sms(phone: str, patient_name: str, doctor_name: str, date: str, time: str) -> bool:
    msg = f"Hi {patient_name}, your appointment with {doctor_name} is booked for {date} at {time}. - Synora Health"
    return send_sms(phone, msg)


def send_appointment_confirmed_sms(phone: str, patient_name: str, doctor_name: str, date: str, time: str, meeting_link: str = None) -> bool:
    link_part = f" Join: {meeting_link}" if meeting_link else ""
    msg = f"Appointment confirmed with {doctor_name} on {date} at {time}.{link_part} - Synora Health"
    return send_sms(phone, msg)


def send_appointment_cancelled_sms(phone: str, patient_name: str, doctor_name: str, date: str) -> bool:
    msg = f"Hi {patient_name}, your appointment with {doctor_name} on {date} has been cancelled. - Synora Health"
    return send_sms(phone, msg)
