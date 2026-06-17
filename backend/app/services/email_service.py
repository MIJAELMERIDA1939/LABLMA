"""
services/email_service.py
Responsabilidad: Envío de emails SMTP usando fastapi-mail.
Dependencias: fastapi-mail, config
Exportaciones: send_email
"""

from app.config import settings


async def send_email(to: str, subject: str, body: str):
    if not settings.SMTP_HOST:
        return

    try:
        from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

        conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USER,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=settings.SMTP_FROM or settings.SMTP_USER,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=settings.SMTP_HOST,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
        )

        message = MessageSchema(
            subject=subject,
            recipients=[to],
            body=body,
            subtype="html",
        )

        fm = FastMail(conf)
        await fm.send_message(message)
    except ImportError:
        pass
    except Exception as e:
        raise e
