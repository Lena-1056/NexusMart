package com.ecommerce.payment.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "webhook_events", schema = "payments_schema")
public class WebhookEvent {
    @Id
    public String id;
    
    @Column(name = "event_type", nullable = false)
    public String eventType;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    public String payload;
    
    @Column
    public String signature;
    
    @Column
    public Boolean processed = false;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
