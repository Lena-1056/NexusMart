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

def send_seller_status_email(to_email: str, owner_name: str, store_name: str, status: str):
    if status == 'APPROVED' or status == 'ACTIVE':
        subject = "Account Approved - Start Selling!"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Congratulations, {owner_name}!</h2>
            <p>Your store <strong>{store_name}</strong> has been <strong>APPROVED</strong> by the management team.</p>
            <p>You can now log into your Seller Dashboard and start uploading products.</p>
            <br/>
            <p>Best regards,<br/>The Marketplace Management Team</p>
        </body>
        </html>
        """
    else:
        subject = f"Account Status Update: {status}"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Hello {owner_name},</h2>
            <p>Your store <strong>{store_name}</strong> status has been updated to: <strong>{status}</strong>.</p>
            <br/>
            <p>Best regards,<br/>The Marketplace Management Team</p>
        </body>
        </html>
        """
    send_email_async(to_email, subject, html)

def send_product_status_email(to_email: str, owner_name: str, product_name: str, status: str):
    if status == 'APPROVED' or status == 'ACTIVE':
        subject = f"Product Approved: {product_name}"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Hello {owner_name},</h2>
            <p>Great news! Your product <strong>{product_name}</strong> has been <strong>APPROVED</strong> by the management team and is now live on the marketplace.</p>
            <br/>
            <p>Best regards,<br/>The Marketplace Management Team</p>
        </body>
        </html>
        """
    else:
        subject = f"Product Status Update: {product_name}"
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2>Hello {owner_name},</h2>
            <p>The status of your product <strong>{product_name}</strong> has been updated to: <strong>{status}</strong>.</p>
            <br/>
            <p>Best regards,<br/>The Marketplace Management Team</p>
        </body>
        </html>
        """
    send_email_async(to_email, subject, html)
