package com.ecommerce.payment.dto;

import java.math.BigDecimal;

public class PaymentOrderRequest {
    public String orderId;
    public BigDecimal amount;
    public String currency = "INR";
}
