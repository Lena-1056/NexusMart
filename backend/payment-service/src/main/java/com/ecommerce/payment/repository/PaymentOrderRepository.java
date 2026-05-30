package com.ecommerce.payment.repository;

import com.ecommerce.payment.entity.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, String> {
    Optional<PaymentOrder> findByOrderId(String orderId);
    Optional<PaymentOrder> findByRazorpayOrderId(String razorpayOrderId);
}
