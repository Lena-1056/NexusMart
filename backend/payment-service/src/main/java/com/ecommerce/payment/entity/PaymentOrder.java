package com.ecommerce.payment.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_orders", schema = "payments_schema")
public class PaymentOrder {
    @Id
    public String id;
    
    @Column(name = "order_id", nullable = false)
    public String orderId;
    
    @Column(name = "razorpay_order_id")
    public String razorpayOrderId;
    
    @Column(nullable = false)
    public BigDecimal amount;
    
    @Column(nullable = false)
    public String currency = "INR";
    
    @Column(nullable = false)
    public String status;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
