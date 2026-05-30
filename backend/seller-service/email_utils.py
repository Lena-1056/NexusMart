import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
SMTP_USER = "arjunkumartata249@gmail.com"
SMTP_PASS = "medg ecoy sxit sbkl"

def send_email_async(to_email: str, subject: str, html_body: str):
    def send():
        try:
            msg = MIMEMultipart()
            msg['From'] = f"Marketplace Admin <{SMTP_USER}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(html_body, 'html'))

            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=3)
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
            server.quit()
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")
            
    threading.Thread(target=send, daemon=True).start()

def send_seller_pending_email(to_email: str, owner_name: str, store_name: str):
    subject = "Registration Successful - Pending Approval"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to the Marketplace, {owner_name}!</h2>
        <p>Your store <strong>{store_name}</strong> has been successfully registered.</p>
        <p>Your account is currently <strong>PENDING APPROVAL</strong> by our admin team. 
        You will not be able to upload products until your account is fully approved.</p>
        <p>We will send you another email as soon as your account is approved.</p>
        <br/>
        <p>Best regards,<br/>The Marketplace Team</p>
    </body>
    </html>
    """
    send_email_async(to_email, subject, html)
