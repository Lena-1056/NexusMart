package com.ecommerce.payment.dto;

import java.math.BigDecimal;

public class RefundRequest {
    public String paymentId;
    public BigDecimal amount;
}
