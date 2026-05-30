package com.ecommerce.onboarding.service;

import com.ecommerce.onboarding.model.AdminUser;
import com.ecommerce.onboarding.repository.AdminUserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminUserRepository userRepo;
    private final EmailService emailService;
    private final NotificationService notifService;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiry}")
    private long jwtExpiry;

    /**
     * Onboard a new admin — called by the org onboarding team.
     */
    public Map<String, Object> onboardAdmin(String name, String email, String tempPassword, String onboardedBy) {
        if (userRepo.existsByEmail(email)) {
            throw new RuntimeException("Email already registered as admin");
        }

        AdminUser user = new AdminUser();
        user.setId("ADM-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8));
        user.setName(name);
        user.setEmail(email);
        user.setTempPassword(tempPassword);
        user.setStatus("TEMP_PASSWORD");
        user.setOnboardedBy(onboardedBy);
        userRepo.save(user);

        // Send Email asynchronously explicitly using Java's CompletableFuture
        // This guarantees the HTTP request returns instantly, even if the SMTP server hangs.
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            emailService.sendOnboardingEmail(email, name, tempPassword);
        });

        // Create in-app notification
        notifService.create(user.getId(), email, "ONBOARDED",
                "Welcome " + name + "! You have been onboarded as a System Administrator.");

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("name", user.getName());
        result.put("email", user.getEmail());
        result.put("status", user.getStatus());
        result.put("message", "Admin onboarded successfully. Welcome email sent to " + email);
        return result;
    }

    /**
     * Login — validates temp or permanent password.
     */
    public Map<String, Object> login(String email, String password) {
        AdminUser user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No admin account found with that email"));

        boolean valid = false;
        if ("TEMP_PASSWORD".equals(user.getStatus())) {
            // Compare plain temp password
            valid = user.getTempPassword().equals(password);
        } else {
            // Compare bcrypt password
            if (user.getPassword() != null && passwordEncoder.matches(password, user.getPassword())) {
                valid = true;
            } else if (password.equals(user.getPassword())) {
                // Fallback for manually inserted plain-text passwords in the DB
                valid = true;
                user.setPassword(passwordEncoder.encode(password)); // Auto-hash for future
            }
        }

        if (!valid) {
            throw new RuntimeException("Incorrect password");
        }

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepo.save(user);

        // Notification
        notifService.create(user.getId(), email, "LOGIN",
                "Login successful at " + LocalDateTime.now().toString().replace("T", " ").substring(0, 19));

        String token = generateToken(user);

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("adminId", user.getId());
        result.put("name", user.getName());
        result.put("email", user.getEmail());
        result.put("status", user.getStatus());
        result.put("requiresPasswordChange", "TEMP_PASSWORD".equals(user.getStatus()));
        return result;
    }

    /**
     * Change password — first-time mandatory change from temp password.
     */
    public Map<String, Object> changePassword(String adminId, String newPassword) {
        AdminUser user = userRepo.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setStatus("ACTIVE");
        userRepo.save(user);

        // Send notification email asynchronously explicitly using Java's CompletableFuture
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            emailService.sendPasswordChangedEmail(user.getEmail(), user.getName());
        });

        // Add to notifications
        notifService.create(user.getId(), user.getEmail(), "PASSWORD_CHANGED",
                "Your temporary password has been changed. Your account is now fully active.");

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Password changed successfully. You can now log in to the Admin Dashboard.");
        result.put("adminId", user.getId());
        result.put("name", user.getName());
        result.put("email", user.getEmail());
        result.put("status", user.getStatus());
        return result;
    }

    public Map<String, Object> forgotPassword(String email) {
        AdminUser user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No admin account found with that email"));

        // Generate 6-digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(15));
        userRepo.save(user);

        // We use the dashboard URL here since the email sends them to the dashboard forgot password UI
        String resetLink = "http://localhost:5173/reset-password?email=" + email;

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            emailService.sendPasswordResetEmail(email, user.getName(), otp, resetLink);
        });

        Map<String, Object> result = new HashMap<>();
        result.put("message", "OTP sent to your email address.");
        return result;
    }

    public Map<String, Object> verifyOtp(String email, String otp) {
        AdminUser user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No admin account found with that email"));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "OTP verified successfully");
        return result;
    }

    public Map<String, Object> resetPassword(String email, String otp, String newPassword) {
        // Verify OTP again just in case
        verifyOtp(email, otp);

        AdminUser user = userRepo.findByEmail(email).get();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setStatus("ACTIVE");
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepo.save(user);

        notifService.create(user.getId(), email, "PASSWORD_CHANGED",
                "Your password has been reset successfully using OTP.");

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            emailService.sendPasswordChangedEmail(user.getEmail(), user.getName());
        });

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Password reset successfully. You can now log in.");
        return result;
    }

    /**
     * Get all notifications for an admin.
     */
    public Object getNotifications(String email) {
        return notifService.getRepo().findByAdminEmailOrderByCreatedAtDesc(email);
    }

    /**
     * Generate JWT token.
     */
    private String generateToken(AdminUser user) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("status", user.getStatus())
                .claim("role", "ADMIN")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiry))
                .signWith(key)
                .compact();
    }

    /**
     * Validate and parse JWT.
     */
    public Claims validateToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
