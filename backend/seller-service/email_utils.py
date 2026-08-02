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

def send_seller_forgot_password_email(to_email: str, owner_name: str, temp_password: str, reset_link: str):
    subject = "Reset Your Seller Password"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hi {owner_name},</p>
        <p>We received a request to reset your password. Use the temporary password below to reset your account.</p>
        <p><strong>Temporary Password:</strong> {temp_password}</p>
        <p>Click the link below to set a new password:</p>
        <p><a href="{reset_link}" style="display:inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <br/>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br/>The Marketplace Team</p>
    </body>
    </html>
    """
    send_email_async(to_email, subject, html)

def send_seller_password_changed_email(to_email: str, owner_name: str, login_link: str):
    subject = "Password Changed Successfully"
    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Changed</h2>
        <p>Hi {owner_name},</p>
        <p>Your password has been changed successfully.</p>
        <p>Please login using the link below:</p>
        <p><a href="{login_link}">{login_link}</a></p>
        <br/>
        <p>Best regards,<br/>The Marketplace Team</p>
    </body>
    </html>
    """
    send_email_async(to_email, subject, html)
