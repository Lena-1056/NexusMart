package com.ecommerce.onboarding.controller;

import com.ecommerce.onboarding.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/onboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OnboardingController {

    private final AdminService adminService;

    /**
     * POST /api/onboard
     * Called by the org onboarding team to register a new admin.
     * Body: { name, email, tempPassword, onboardedBy }
     */
    @PostMapping
    public ResponseEntity<?> onboardAdmin(@RequestBody Map<String, String> body) {
        try {
            String name        = body.get("name");
            String email       = body.get("email");
            String tempPwd     = body.get("tempPassword");
            String onboardedBy = body.getOrDefault("onboardedBy", "Organisation Team");

            if (name == null || email == null || tempPwd == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name, email, and tempPassword are required"));
            }

            Map<String, Object> result = adminService.onboardAdmin(name, email, tempPwd, onboardedBy);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
