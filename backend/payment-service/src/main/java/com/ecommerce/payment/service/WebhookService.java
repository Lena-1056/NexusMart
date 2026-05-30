package com.ecommerce.payment.service;

import com.ecommerce.payment.entity.WebhookEvent;
import com.ecommerce.payment.repository.WebhookEventRepository;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WebhookService {

    private final WebhookEventRepository webhookEventRepository;
    private final RazorpayService razorpayService;

    public WebhookService(WebhookEventRepository webhookEventRepository, RazorpayService razorpayService) {
        this.webhookEventRepository = webhookEventRepository;
        this.razorpayService = razorpayService;
    }

    @Transactional
    public void processWebhook(String payload, String signature) {
        if (!razorpayService.verifyWebhookSignature(payload, signature)) {
            throw new IllegalArgumentException("Invalid webhook signature");
        }

        JSONObject jsonPayload = new JSONObject(payload);
        String eventId = jsonPayload.getString("id"); // Webhook event ID from Razorpay (faked or real)

        if (webhookEventRepository.existsById(eventId)) {
            // Idempotency check: Already processed
            return;
        }

        WebhookEvent event = new WebhookEvent();
        event.id = eventId;
        event.eventType = jsonPayload.getString("event");
        event.payload = payload;
        event.signature = signature;
        
        // In a real scenario, you'd process event.eventType = "payment.captured" here
        event.processed = true;
        
        webhookEventRepository.save(event);
    }
}
