package com.ecommerce.payment.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions", schema = "payments_schema")
public class PaymentTransaction {
    @Id
    public String id;
    
    @ManyToOne
    @JoinColumn(name = "payment_id")
    public Payment payment;
    
    @Column(name = "transaction_type", nullable = false)
    public String transactionType;
    
    @Column(name = "gateway_response")
    public String gatewayResponse;
    
    @Column(nullable = false)
    public String status;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
