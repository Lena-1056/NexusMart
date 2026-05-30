package com.ecommerce.onboarding.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    @Value("${app.admin-dashboard.url}")
    private String dashboardUrl;

    @Value("${app.onboarding.url}")
    private String onboardingUrl;

    @Async
    public void sendOnboardingEmail(String toEmail, String adminName, String tempPassword) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Welcome! You have been onboarded as a System Administrator");
            helper.setText(buildOnboardingHtml(adminName, toEmail, tempPassword), true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send onboarding email: " + e.getMessage());
        }
    }

    @Async
    public void sendPasswordChangedEmail(String toEmail, String adminName) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Your temporary password has been changed");
            helper.setText(buildPasswordChangedHtml(adminName), true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send password changed email: " + e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String adminName, String otp, String resetLink) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Admin Portal Password Reset Request");
            helper.setText(buildPasswordResetHtml(adminName, otp, resetLink), true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("[EmailService] Failed to send password reset email: " + e.getMessage());
        }
    }

    private String buildOnboardingHtml(String name, String email, String tempPassword) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 40px 20px;">
              <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
                <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 12px;">🏢</div>
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">Welcome to ECommerce Admin</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">You have been onboarded as a System Administrator</p>
                </div>
                <div style="padding: 36px;">
                  <p style="color: #94a3b8; font-size: 15px; margin-bottom: 24px;">Hi <strong style="color: #f1f5f9;">%s</strong>,</p>
                  <p style="color: #94a3b8; font-size: 14px; line-height: 1.7;">
                    You have been granted administrator access to the ECommerce platform.
                    Use the credentials below to log in for the first time. You will be asked to change your password on first login.
                  </p>
                  <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <div style="margin-bottom: 14px;">
                      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.08em; margin-bottom: 4px;">Email Address</div>
                      <div style="color: #a78bfa; font-size: 16px; font-weight: 600;">%s</div>
                    </div>
                    <div>
                      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.08em; margin-bottom: 4px;">Temporary Password</div>
                      <div style="color: #34d399; font-size: 18px; font-weight: 700; font-family: monospace; letter-spacing: 0.1em;">%s</div>
                    </div>
                  </div>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="%s/login" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                      Login to Admin Portal
                    </a>
                  </div>
                  <p style="color: #475569; font-size: 12px; text-align: center;">
                    ⚠️ Keep your credentials secure. Change your password immediately after first login.
                  </p>
                </div>
                <div style="background: #0f172a; padding: 20px; text-align: center;">
                  <p style="color: #475569; font-size: 12px; margin: 0;">ECommerce Platform · System Administration</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, email, tempPassword, onboardingUrl);
    }

    private String buildPasswordChangedHtml(String name) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 40px 20px;">
              <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
                <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 12px;">🔐</div>
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">Password Changed</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Your temporary password has been updated</p>
                </div>
                <div style="padding: 36px;">
                  <p style="color: #94a3b8; font-size: 15px;">Hi <strong style="color: #f1f5f9;">%s</strong>,</p>
                  <p style="color: #94a3b8; font-size: 14px; line-height: 1.7;">
                    Your temporary password has been successfully changed. Your account is now fully active.
                    You can now log in to the Admin Dashboard using your new password.
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                      Go to Admin Dashboard
                    </a>
                  </div>
                  <p style="color: #475569; font-size: 12px; text-align: center;">
                    If you did not make this change, contact your organisation's admin team immediately.
                  </p>
                </div>
                <div style="background: #0f172a; padding: 20px; text-align: center;">
                  <p style="color: #475569; font-size: 12px; margin: 0;">ECommerce Platform · System Administration</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, dashboardUrl);
    }

    private String buildPasswordResetHtml(String name, String otp, String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 40px 20px;">
              <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
                <div style="background: linear-gradient(135deg, #e11d48, #be123c); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 12px;">🔑</div>
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">Reset Your Password</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">We received a request to reset your admin password</p>
                </div>
                <div style="padding: 36px;">
                  <p style="color: #94a3b8; font-size: 15px;">Hi <strong style="color: #f1f5f9;">%s</strong>,</p>
                  <p style="color: #94a3b8; font-size: 14px; line-height: 1.7;">
                    Click the button below and enter your OTP to securely reset your password. This OTP will expire in 15 minutes.
                  </p>
                  <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.08em; margin-bottom: 4px;">Your Reset OTP</div>
                    <div style="color: #34d399; font-size: 24px; font-weight: 700; font-family: monospace; letter-spacing: 0.2em;">%s</div>
                  </div>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #e11d48, #be123c); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                      Reset Password
                    </a>
                  </div>
                  <p style="color: #475569; font-size: 12px; text-align: center;">
                    If you did not request a password reset, you can safely ignore this email.
                  </p>
                </div>
                <div style="background: #0f172a; padding: 20px; text-align: center;">
                  <p style="color: #475569; font-size: 12px; margin: 0;">ECommerce Platform · System Administration</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, otp, resetLink);
    }
}
