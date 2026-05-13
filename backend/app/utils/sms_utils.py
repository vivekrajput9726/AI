from loguru import logger


def send_sms(to_phone: str, message: str) -> bool:
    """Send SMS via Twilio or log if not configured."""
    try:
        from app.config.settings import settings
        account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
        auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
        from_phone = getattr(settings, "TWILIO_PHONE_NUMBER", None)

        if account_sid and auth_token and from_phone:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            client.messages.create(body=message, from_=from_phone, to=to_phone)
            logger.info(f"SMS sent to {to_phone}")
            return True
    except Exception as e:
        logger.warning(f"SMS send failed to {to_phone}: {e}")

    logger.info(f"[SMS stub] To: {to_phone} | Message: {message[:80]}...")
    return False
