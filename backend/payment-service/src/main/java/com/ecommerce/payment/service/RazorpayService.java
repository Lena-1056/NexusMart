package com.ecommerce.payment.service;

import com.ecommerce.payment.exception.PaymentException;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class RazorpayService {

    private final RazorpayClient client;

    @Value("${razorpay.key.secret}")
    private String secret;

    public RazorpayService(@Value("${razorpay.key.id}") String keyId,
                           @Value("${razorpay.key.secret}") String keySecret) throws RazorpayException {
        this.client = new RazorpayClient(keyId, keySecret);
    }

    public Order createOrder(BigDecimal amount, String currency, String receipt) {
        try {
            JSONObject options = new JSONObject();
            options.put("amount", amount.multiply(new BigDecimal("100")).intValue());
            options.put("currency", currency);
            options.put("receipt", receipt);
            
            if ("mock_secret_key_123".equals(secret)) {
                JSONObject mockJson = new JSONObject();
                mockJson.put("id", "order_mock_" + System.currentTimeMillis());
                mockJson.put("amount", options.getInt("amount"));
                mockJson.put("currency", currency);
                mockJson.put("receipt", receipt);
                mockJson.put("status", "created");
                return new Order(mockJson);
            }
            
            return client.orders.create(options);
        } catch (Exception e) {
            throw new PaymentException("Failed to create Razorpay Order: " + e.getMessage());
        }
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(options, secret);
        } catch (Exception e) {
            return false;
        }
    }
    
    public boolean verifyWebhookSignature(String payload, String signature) {
        try {
            return Utils.verifyWebhookSignature(payload, signature, secret);
        } catch (Exception e) {
            return false;
        }
    }
}
