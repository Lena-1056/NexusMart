package com.ecommerce.onboarding.controller;

import com.ecommerce.onboarding.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AdminService adminService;

    /**
     * POST /api/auth/login
     * Body: { email, password }
     * Returns: { token, adminId, name, email, status, requiresPasswordChange }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email    = body.get("email");
            String password = body.get("password");
            if (email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "email and password are required"));
            }
            return ResponseEntity.ok(adminService.login(email, password));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/auth/change-password
     * Header: Authorization: Bearer <token>
     * Body: { adminId, newPassword }
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body) {
        try {
            String adminId     = body.get("adminId");
            String newPassword = body.get("newPassword");
            if (adminId == null || newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "adminId and newPassword (min 6 chars) are required"));
            }
            return ResponseEntity.ok(adminService.changePassword(adminId, newPassword));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/auth/notifications?email=xxx
     */
    @GetMapping("/notifications")
    public ResponseEntity<?> notifications(@RequestParam String email) {
        return ResponseEntity.ok(adminService.getNotifications(email));
    }

    /**
     * PATCH /api/auth/notifications/{id}/read
     */
    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable String id) {
        adminService.getNotifications(""); // no-op placeholder; handled below
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null) return ResponseEntity.badRequest().body(Map.of("error", "email is required"));
            return ResponseEntity.ok(adminService.forgotPassword(email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String otp = body.get("otp");
            if (email == null || otp == null) return ResponseEntity.badRequest().body(Map.of("error", "email and otp required"));
            return ResponseEntity.ok(adminService.verifyOtp(email, otp));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String otp = body.get("otp");
            String newPassword = body.get("newPassword");
            if (email == null || otp == null || newPassword == null) return ResponseEntity.badRequest().body(Map.of("error", "email, otp, newPassword required"));
            return ResponseEntity.ok(adminService.resetPassword(email, otp, newPassword));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
