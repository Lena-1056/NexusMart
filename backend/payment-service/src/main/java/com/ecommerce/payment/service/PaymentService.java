package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.PaymentOrderRequest;
import com.ecommerce.payment.dto.PaymentVerificationRequest;
import com.ecommerce.payment.entity.Payment;
import com.ecommerce.payment.entity.PaymentOrder;
import com.ecommerce.payment.entity.PaymentTransaction;
import com.ecommerce.payment.exception.PaymentException;
import com.ecommerce.payment.repository.PaymentOrderRepository;
import com.ecommerce.payment.repository.PaymentRepository;
import com.ecommerce.payment.repository.PaymentTransactionRepository;
import com.razorpay.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RazorpayService razorpayService;

    public PaymentService(PaymentOrderRepository paymentOrderRepository,
                          PaymentRepository paymentRepository,
                          PaymentTransactionRepository paymentTransactionRepository,
                          RazorpayService razorpayService) {
        this.paymentOrderRepository = paymentOrderRepository;
        this.paymentRepository = paymentRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.razorpayService = razorpayService;
    }

    @Transactional
    public PaymentOrder createPaymentOrder(PaymentOrderRequest request) {
        PaymentOrder paymentOrder = new PaymentOrder();
        paymentOrder.id = "PO-" + UUID.randomUUID().toString().substring(0, 8);
        paymentOrder.orderId = request.orderId;
        paymentOrder.amount = request.amount;
        paymentOrder.currency = request.currency;
        paymentOrder.status = "CREATED";

        Order rzpOrder = razorpayService.createOrder(request.amount, request.currency, paymentOrder.id);
        paymentOrder.razorpayOrderId = rzpOrder.get("id");
        paymentOrder.status = "PENDING";
        
        return paymentOrderRepository.save(paymentOrder);
    }

    @Transactional
    public Payment verifyPayment(PaymentVerificationRequest request) {
        if (!razorpayService.verifySignature(request.razorpayOrderId, request.razorpayPaymentId, request.razorpaySignature)) {
            throw new PaymentException("Invalid payment signature");
        }

        PaymentOrder paymentOrder = paymentOrderRepository.findByRazorpayOrderId(request.razorpayOrderId)
                .orElseThrow(() -> new PaymentException("Payment order not found"));

        paymentOrder.status = "PAID";
        paymentOrderRepository.save(paymentOrder);

        Payment payment = new Payment();
        payment.id = "PAY-" + UUID.randomUUID().toString().substring(0, 8);
        payment.orderId = paymentOrder.orderId;
        payment.paymentOrder = paymentOrder;
        payment.razorpayPaymentId = request.razorpayPaymentId;
        payment.amount = paymentOrder.amount;
        payment.status = "CAPTURED";
        paymentRepository.save(payment);

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.id = "TXN-" + UUID.randomUUID().toString().substring(0, 8);
        transaction.payment = payment;
        transaction.transactionType = "PAYMENT_CAPTURE";
        transaction.status = "SUCCESS";
        paymentTransactionRepository.save(transaction);

        return payment;
    }

    public Payment getPaymentDetails(String paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentException("Payment not found"));
    }
}
