package com.ecommerce.onboarding.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_users", schema = "onboarding_schema")
@Data
@NoArgsConstructor
public class AdminUser {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "temp_password", nullable = false, length = 255)
    private String tempPassword;

    @Column(length = 255)
    private String password;  // bcrypt hashed, null until changed

    @Column(nullable = false, length = 50)
    private String status = "TEMP_PASSWORD";  // TEMP_PASSWORD | ACTIVE

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "onboarded_by", length = 255)
    private String onboardedBy;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "otp_code", length = 10)
    private String otpCode;

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;
}
