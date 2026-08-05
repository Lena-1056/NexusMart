from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
import datetime

app = FastAPI(title="Notification Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
DB_URL = f"postgresql://postgres:{os.environ.get('DB_PASSWORD', '')}@localhost:5432/ecommerce"

def get_db_connection():
    return psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)

class BroadcastReq(BaseModel):
    message: str
    recipient: str
    subject: str = "NexusMart Order Update"
    isHtml: bool = False

@app.get("/api/notifications")
def get_notifications():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM notifications_schema.notifications ORDER BY time DESC")
        notifs = cur.fetchall()
        cur.close()
        conn.close()
        return notifs
    except Exception as e:
        print(f"Database error: {e}")
        return []

@app.post("/api/notifications/broadcast")
def broadcast_notification(req: BroadcastReq):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        new_id = f"NTF-{uuid.uuid4().hex[:8]}"
        time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        
        cur.execute(
            "INSERT INTO notifications_schema.notifications (id, type, message, recipient, time, read) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
            (new_id, "SYSTEM", req.message, req.recipient, time_str, False)
        )
        new_notif = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return new_notif
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
SMTP_USER = "Enter your SMTP email here"
SMTP_PASS = os.environ.get("SMTP_PASSWORD", "Enter your SMTP password here")

import re
from email.mime.image import MIMEImage

def send_email_async(to_email: str, subject: str, body: str, is_html: bool = False):
    def send():
        try:
            msg = MIMEMultipart('related') if is_html else MIMEMultipart()
            msg['From'] = f"NexusMart <{SMTP_USER}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            if is_html:
                import uuid
                import base64
                
                images_to_attach = []
                def replacer(match):
                    ext = match.group(1)
                    b64_data = match.group(2)
                    cid = f"image_{uuid.uuid4().hex}@{ext}"
                    images_to_attach.append((cid, b64_data, ext))
                    return f"src='cid:{cid}'"

                # Match both single and double quotes for src
                pattern = r"src=['\"]data:image/([a-zA-Z0-9]+);base64,([^'\"]+)['\"]"
                new_body = re.sub(pattern, replacer, body)
                
                # Use alternative multipart for html to support both text and images properly
                msg_alt = MIMEMultipart('alternative')
                msg.attach(msg_alt)
                msg_alt.attach(MIMEText(new_body, 'html'))
                
                for cid, b64_data, ext in images_to_attach:
                    try:
                        img_data = base64.b64decode(b64_data)
                        img_mime = MIMEImage(img_data, _subtype=ext)
                        img_mime.add_header('Content-ID', f'<{cid}>')
                        img_mime.add_header('Content-Disposition', 'inline')
                        msg.attach(img_mime)
                    except Exception as img_e:
                        print(f"Failed to attach image: {img_e}")
            else:
                msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=3)
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")
    threading.Thread(target=send, daemon=True).start()

@app.post("/api/notifications/email")
def send_email(req: BroadcastReq):
    try:
        # Send real email async
        send_email_async(req.recipient, req.subject, req.message, req.isHtml)
        
        # Also store it in DB
        conn = get_db_connection()
        cur = conn.cursor()
        new_id = f"NTF-{uuid.uuid4().hex[:8]}"
        time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        cur.execute(
            "INSERT INTO notifications_schema.notifications (id, type, message, recipient, time, read) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
            (new_id, "EMAIL", req.message, req.recipient, time_str, False)
        )
        new_notif = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "email_sent", "record": new_notif}
    except Exception as e:
        print(f"Failed to mock email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/notifications/{n_id}/read")
def mark_read(n_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE notifications_schema.notifications SET read = TRUE WHERE id = %s RETURNING *", (n_id,))
        notif = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if notif:
            return {"status": "success"}
        raise HTTPException(status_code=404, detail="Notification not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/notifications/{n_id}")
def delete_notification(n_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM notifications_schema.notifications WHERE id = %s", (n_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8091)

