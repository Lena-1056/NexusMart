package com.ecommerce.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }

    @PostMapping("/api/auth/login")
    public String login(@RequestBody LoginRequest request) {
        // Mock authentication for MVP, but real JWT token
        if ("admin@ecommerce.local".equals(request.getEmail()) && "admin123".equals(request.getPassword())) {
            String token = AuthApplication.generateToken("ADM-1", request.getEmail(), "ADMIN");
            return "{\"token\": \"" + token + "\"}";
        }
        return "{\"error\": \"Invalid credentials\"}";
    }

    @GetMapping("/api/auth/validate")
    public String validateToken() {
        return "{\"status\": \"valid\"}";
    }
}

class LoginRequest {
    private String email;
    private String password;

    // Getters and Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
