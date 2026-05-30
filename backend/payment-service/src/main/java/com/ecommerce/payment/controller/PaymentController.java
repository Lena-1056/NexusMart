package com.ecommerce.payment.controller;

import com.ecommerce.payment.dto.PaymentOrderRequest;
import com.ecommerce.payment.dto.PaymentVerificationRequest;
import com.ecommerce.payment.entity.Payment;
import com.ecommerce.payment.entity.PaymentOrder;
import com.ecommerce.payment.service.PaymentService;
import com.ecommerce.payment.service.WebhookService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final WebhookService webhookService;

    public PaymentController(PaymentService paymentService, WebhookService webhookService) {
        this.paymentService = paymentService;
        this.webhookService = webhookService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<PaymentOrder> createPaymentOrder(@RequestBody PaymentOrderRequest request) {
        return ResponseEntity.ok(paymentService.createPaymentOrder(request));
    }

    @PostMapping("/verify")
    public ResponseEntity<Payment> verifyPayment(@RequestBody PaymentVerificationRequest request) {
        return ResponseEntity.ok(paymentService.verifyPayment(request));
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload,
                                                @RequestHeader("x-razorpay-signature") String signature) {
        webhookService.processWebhook(payload, signature);
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<Payment> getPayment(@PathVariable String paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentDetails(paymentId));
    }
}
