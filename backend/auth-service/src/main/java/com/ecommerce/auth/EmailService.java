package com.ecommerce.auth;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendRegistrationEmail(String toEmail, String customerName) {
        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage msg = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
                helper.setFrom(fromEmail, fromName);
                helper.setTo(toEmail);
                helper.setSubject("Welcome to NexusMart, " + customerName + "!");
                helper.setText(buildRegistrationHtml(customerName), true);
                mailSender.send(msg);
            } catch (Exception e) {
                System.err.println("[EmailService] Failed to send registration email: " + e.getMessage());
            }
        });
    }

    public void sendLoginEmail(String toEmail, String customerName) {
        CompletableFuture.runAsync(() -> {
            try {
                MimeMessage msg = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
                helper.setFrom(fromEmail, fromName);
                helper.setTo(toEmail);
                helper.setSubject("New Login Alert - NexusMart");
                helper.setText(buildLoginHtml(customerName), true);
                mailSender.send(msg);
            } catch (Exception e) {
                System.err.println("[EmailService] Failed to send login email: " + e.getMessage());
            }
        });
    }

    private String buildRegistrationHtml(String name) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
              <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #a855f7, #6366f1); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">Welcome to NexusMart</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Your ultimate shopping destination</p>
                </div>
                <div style="padding: 36px;">
                  <p style="color: #334155; font-size: 15px; margin-bottom: 24px;">Hi <strong>%s</strong>,</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.7;">
                    Your account has been successfully created! We are thrilled to have you on board.
                    You can now browse our catalog, save your favorite items to your wishlist, and track your orders.
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="http://localhost:5174/" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #6366f1); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
                      Start Shopping
                    </a>
                  </div>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center;">
                  <p style="color: #64748b; font-size: 12px; margin: 0;">NexusMart &copy; 2026</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name);
    }

    private String buildLoginHtml(String name) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px;">
              <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 12px;">🛡️</div>
                  <h1 style="color: #fff; margin: 0; font-size: 24px;">New Login Alert</h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">A recent login to your account</p>
                </div>
                <div style="padding: 36px;">
                  <p style="color: #334155; font-size: 15px;">Hi <strong>%s</strong>,</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.7;">
                    We noticed a successful login to your NexusMart account. 
                    If this was you, no further action is required!
                  </p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.7; margin-top: 16px;">
                    If you did not authorize this login, please change your password immediately or contact our support team.
                  </p>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center;">
                  <p style="color: #64748b; font-size: 12px; margin: 0;">NexusMart &copy; 2026</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name);
    }
}
