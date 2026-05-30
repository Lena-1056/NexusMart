package com.ecommerce.payment.dto;

public class PaymentVerificationRequest {
    public String razorpayOrderId;
    public String razorpayPaymentId;
    public String razorpaySignature;
}
