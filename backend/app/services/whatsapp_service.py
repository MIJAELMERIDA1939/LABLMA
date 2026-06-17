"""
services/whatsapp_service.py
Responsabilidad: Envío de notificaciones vía WhatsApp Business Cloud API (Meta).
Dependencias: httpx, config
Exportaciones: send_whatsapp
"""

import httpx
from app.config import settings

WHATSAPP_API_URL = "https://graph.facebook.com/v19.0/{phone_number_id}/messages"


async def send_whatsapp(to: str, message: str):
    if not settings.WHATSAPP_TOKEN or not settings.WHATSAPP_PHONE_NUMBER_ID:
        return

    url = WHATSAPP_API_URL.format(phone_number_id=settings.WHATSAPP_PHONE_NUMBER_ID)

    payload = {
        "messaging_product": "whatsapp",
        "to": to.lstrip("+"),
        "type": "text",
        "text": {"body": message},
    }

    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)

    if response.status_code != 200:
        raise Exception(f"WhatsApp API error: {response.status_code} - {response.text}")

    return response.json()
