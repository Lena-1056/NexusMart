package com.ecommerce.onboarding.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_notifications", schema = "onboarding_schema")
@Data
@NoArgsConstructor
public class AdminNotification {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "admin_id", length = 50)
    private String adminId;

    @Column(name = "admin_email", length = 255)
    private String adminEmail;

    @Column(nullable = false, length = 50)
    private String type;  // ONBOARDED | LOGIN | PASSWORD_CHANGED

    @Column(nullable = false)
    private String message;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private Boolean read = false;
}
