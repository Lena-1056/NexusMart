package com.ecommerce.payment.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments", schema = "payments_schema")
public class Payment {
    @Id
    public String id;
    
    @Column(name = "order_id", nullable = false)
    public String orderId;
    
    @ManyToOne
    @JoinColumn(name = "payment_order_id")
    public PaymentOrder paymentOrder;
    
    @Column(name = "razorpay_payment_id")
    public String razorpayPaymentId;
    
    @Column(name = "transaction_reference")
    public String transactionReference;
    
    @Column(nullable = false)
    public BigDecimal amount;
    
    @Column(name = "payment_method")
    public String paymentMethod;
    
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
