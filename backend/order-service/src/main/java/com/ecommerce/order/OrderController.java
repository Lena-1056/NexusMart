package com.ecommerce.order;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestTemplate;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;

import java.time.Instant;
import java.util.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    private RestTemplate restTemplate = new RestTemplate();
    private final String KEY_ID = "rzp_test_mock123";
    private final String KEY_SECRET = "mock_secret_123";

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/seller/{seller}")
    public List<Order> getOrdersBySeller(@PathVariable String seller) {
        return orderRepository.findBySeller(seller);
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody Order order) {
        order.id = "ORD-" + UUID.randomUUID().toString().substring(0, 8);
        order.date = Instant.now().toString();
        order.createdAt = Instant.now().toString();
        order.updatedAt = Instant.now().toString();
        
        // --- SMART PROXIMITY ROUTING ---
        if (order.customerCity != null && !order.customerCity.isEmpty()) {
            try {
                // 1. Get original product details to find its name
                ResponseEntity<List> productsRes = restTemplate.getForEntity("http://localhost:8081/api/products", List.class);
                if (productsRes.getStatusCode().is2xxSuccessful() && productsRes.getBody() != null) {
                    List<Map<String, Object>> allProducts = (List<Map<String, Object>>) productsRes.getBody();
                    String targetProductName = null;
                    for (Map<String, Object> p : allProducts) {
                        if (order.product.equals(p.get("id"))) {
                            targetProductName = (String) p.get("name");
                            break;
                        }
                    }

                    if (targetProductName != null) {
                        // 2. Get all sellers to find their cities
                        ResponseEntity<List> sellersRes = restTemplate.getForEntity("http://localhost:8090/api/sellers", List.class);
                        if (sellersRes.getStatusCode().is2xxSuccessful() && sellersRes.getBody() != null) {
                            List<Map<String, Object>> allSellers = (List<Map<String, Object>>) sellersRes.getBody();
                            
                            // 3. Find if any seller in customerCity has the exact same product
                            for (Map<String, Object> p : allProducts) {
                                if (targetProductName.equals(p.get("name"))) {
                                    String pSellerName = (String) p.get("seller");
                                    for (Map<String, Object> s : allSellers) {
                                        if (pSellerName.equals(s.get("store")) && order.customerCity.equalsIgnoreCase((String) s.get("city"))) {
                                            // Found a match in the same city! Reroute!
                                            order.product = (String) p.get("id");
                                            order.seller = pSellerName;
                                            System.out.println("SMART ROUTING: Rerouted order to local seller: " + pSellerName + " in " + order.customerCity);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Smart routing failed, falling back to default seller: " + e.getMessage());
            }
        }
        // -------------------------------
        
        // Call Inventory Service to reserve stock
        try {
            ResponseEntity<String> invRes = restTemplate.postForEntity(
                "http://localhost:8085/api/inventory/reserve?productId=" + order.product + "&quantity=1", 
                null, String.class);
            if (!invRes.getStatusCode().is2xxSuccessful()) {
                return ResponseEntity.badRequest().build(); // Out of stock
            }
        } catch (Exception e) {
            System.err.println("Inventory reservation failed: " + e.getMessage());
            // Fallback or fail
        }

        // If payment is COD, status is CREATED awaiting seller acceptance
        if ("COD".equalsIgnoreCase(order.payment)) {
            order.status = "CREATED";
            orderRepository.save(order);
            sendNotification(order.seller, "New order received (COD)! Product: " + order.product + ". Delivery Location: " + order.address);
            return ResponseEntity.ok(order);
        }
        
        order.status = "PENDING_PAYMENT";
        orderRepository.save(order);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/create-razorpay-order")
    public ResponseEntity<Map<String, String>> createRazorpayOrder(@RequestBody Map<String, Object> data) {
        try {
            int amount = Integer.parseInt(data.get("amount").toString());
            
            // Mock Razorpay Order Creation since we are using fake keys
            Map<String, String> response = new HashMap<>();
            response.put("orderId", "order_mock_" + UUID.randomUUID().toString().substring(0, 8));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<Order> verifyPayment(@RequestBody Map<String, String> data) {
        try {
            String razorpayOrderId = data.get("razorpay_order_id");
            String razorpayPaymentId = data.get("razorpay_payment_id");
            String razorpaySignature = data.get("razorpay_signature");
            String internalOrderId = data.get("internal_order_id"); // ORD-xxxx

            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);

            // In production, uncomment the signature verification
            // boolean status = Utils.verifyPaymentSignature(options, KEY_SECRET);
            boolean status = true; // Mock verification since we use fake keys

            if (status) {
                Optional<Order> optOrder = orderRepository.findById(internalOrderId);
                if (optOrder.isPresent()) {
                    Order order = optOrder.get();
                    order.payment = "PAID";
                    order.status = "CREATED"; // Awaiting seller acceptance
                    order.updatedAt = Instant.now().toString();
                    orderRepository.save(order);

                    // Notify seller
                    sendNotification(order.seller, "New order received (PAID)! Product: " + order.product + ". Delivery Location: " + order.address);
                    
                    return ResponseEntity.ok(order);
                }
            }
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<Order> acceptOrder(@PathVariable String id) {
        Optional<Order> optionalOrder = orderRepository.findById(id);
        if (optionalOrder.isPresent()) {
            Order o = optionalOrder.get();
            o.status = "ACCEPTED";
            o.updatedAt = Instant.now().toString();
            orderRepository.save(o);
            sendNotification(o.customer, "Your order " + o.id + " has been accepted by the seller.");
            return ResponseEntity.ok(o);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Order> rejectOrder(@PathVariable String id) {
        Optional<Order> optionalOrder = orderRepository.findById(id);
        if (optionalOrder.isPresent()) {
            Order o = optionalOrder.get();
            o.status = "REJECTED_BY_SELLER";
            o.updatedAt = Instant.now().toString();
            if ("PAID".equals(o.payment)) {
                o.payment = "REFUND_REQUESTED";
                // Trigger refund via Payment Service
            }
            orderRepository.save(o);
            // Release inventory
            restTemplate.postForEntity("http://localhost:8085/api/inventory/release?productId=" + o.product + "&quantity=1", null, String.class);
            sendNotification(o.customer, "Your order " + o.id + " was rejected by the seller.");
            return ResponseEntity.ok(o);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/pack")
    public ResponseEntity<Order> packOrder(@PathVariable String id) {
        Optional<Order> optionalOrder = orderRepository.findById(id);
        if (optionalOrder.isPresent()) {
            Order o = optionalOrder.get();
            o.status = "PACKED";
            o.updatedAt = Instant.now().toString();
            orderRepository.save(o);
            return ResponseEntity.ok(o);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/dispatch")
    public ResponseEntity<Order> dispatchOrder(@PathVariable String id) {
        Optional<Order> optionalOrder = orderRepository.findById(id);
        if (optionalOrder.isPresent()) {
            Order o = optionalOrder.get();
            o.status = "DISPATCHED";
            o.updatedAt = Instant.now().toString();
            
            // Create shipment in shipping-service
            try {
                Map<String, String> shipReq = new HashMap<>();
                shipReq.put("orderId", o.id);
                shipReq.put("courier", "Nexus Logistics");
                
                // Fetch actual seller location from seller-service
                String actualSellerLocation = "Mumbai"; // fallback
                String actualSellerAddress = ""; // fallback
                try {
                    ResponseEntity<List> sellersRes = restTemplate.getForEntity("http://localhost:8090/api/sellers", List.class);
                    if (sellersRes.getStatusCode().is2xxSuccessful() && sellersRes.getBody() != null) {
                        List<Map<String, Object>> allSellers = (List<Map<String, Object>>) sellersRes.getBody();
                        for (Map<String, Object> s : allSellers) {
                            if (o.seller.equals(s.get("store"))) {
                                actualSellerLocation = (String) s.get("city");
                                actualSellerAddress = (String) s.get("address");
                                break;
                            }
                        }
                    }
                } catch(Exception e) {}

                shipReq.put("sellerLocation", actualSellerLocation); 
                shipReq.put("originAddress", actualSellerAddress != null ? actualSellerAddress : actualSellerLocation);
                shipReq.put("destHub", o.customerCity != null ? o.customerCity : "Mumbai");
                shipReq.put("paymentMethod", o.payment != null ? o.payment : "PAID");
                shipReq.put("amount", String.valueOf(o.amount));
                shipReq.put("deliveryAddress", o.address != null ? o.address : (o.customerCity != null ? o.customerCity : ""));
                ResponseEntity<Map> shipRes = restTemplate.postForEntity("http://localhost:8094/api/shipping", shipReq, Map.class);
                if (shipRes.getStatusCode().is2xxSuccessful() && shipRes.getBody() != null) {
                    o.trackingId = (String) shipRes.getBody().get("trackingId");
                }
            } catch (Exception e) {
                System.err.println("Shipping service call failed: " + e.getMessage());
            }

            orderRepository.save(o);
            sendNotification(o.customer, "Your order for product " + o.product + " has been shipped. Tracking ID: " + (o.trackingId != null ? o.trackingId : "Pending"));
            sendNotification(o.seller, "You have successfully dispatched order " + o.id + ".");
            return ResponseEntity.ok(o);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/deliver")
    public ResponseEntity<Order> deliverOrder(@PathVariable String id) {
        Optional<Order> optionalOrder = orderRepository.findById(id);
        if (optionalOrder.isPresent()) {
            Order o = optionalOrder.get();
            if (!"DELIVERED".equals(o.status)) {
                o.status = "DELIVERED";
                o.updatedAt = Instant.now().toString();
                o.deliveredAt = Instant.now().toString();
                orderRepository.save(o);
                
                // Payout Seller ONLY when delivered!
                if ("PAID".equals(o.payment) || "COD".equals(o.payment)) {
                    updateSellerRevenue(o.seller, o.amount);
                }
                
                sendNotification(o.customer, "Your order " + o.id + " has been delivered!");
            }
            return ResponseEntity.ok(o);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        Optional<Order> optionalOrder = orderRepository.findById(id);
        if (optionalOrder.isPresent()) {
            Order o = optionalOrder.get();
            String newStatus = body.get("status");
            o.status = newStatus;
            o.updatedAt = Instant.now().toString();
            if ("DELIVERED".equals(newStatus)) {
                o.deliveredAt = Instant.now().toString();
                if ("PAID".equals(o.payment) || "COD".equals(o.payment)) {
                    updateSellerRevenue(o.seller, o.amount);
                }
            }
            orderRepository.save(o);
            return ResponseEntity.ok(o);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable String id) {
        Optional<Order> optionalOrder = orderRepository.findById(id);
        if (optionalOrder.isPresent()) {
            Order o = optionalOrder.get();
            if ("SHIPPED".equals(o.status) || "DELIVERED".equals(o.status) || "CANCELLED".equals(o.status)) {
                return ResponseEntity.badRequest().build();
            }

            if ("PAID".equals(o.payment)) {
                o.payment = "REFUND_REQUESTED";
                // Trigger actual refund in payment-service
            }
            
            o.status = "CANCELLED";
            o.updatedAt = Instant.now().toString();

            orderRepository.save(o);

            // Release inventory
            restTemplate.postForEntity("http://localhost:8085/api/inventory/release?productId=" + o.product + "&quantity=1", null, String.class);

            sendNotification(o.customer, "Your order " + o.id + " for product " + o.product + " has been cancelled.");
            sendNotification(o.seller, "Order " + o.id + " for product " + o.product + " has been cancelled by the customer.");
            
            return ResponseEntity.ok(o);
        }
        return ResponseEntity.notFound().build();
    }

    private void updateSellerRevenue(String sellerEmail, double amount) {
        try {
            String encodedStore = URLEncoder.encode(sellerEmail, StandardCharsets.UTF_8.toString()).replace("+", "%20");
            restTemplate.put("http://localhost:8090/api/sellers/" + encodedStore + "/revenue?amount=" + amount, null);
        } catch (Exception e) {
            System.err.println("Failed to update seller revenue: " + e.getMessage());
        }
    }

    private void sendNotification(String recipient, String message) {
        try {
            Map<String, String> req = new HashMap<>();
            req.put("recipient", recipient);
            req.put("message", message);
            restTemplate.postForEntity("http://localhost:8086/api/notifications/email", req, String.class);
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }
    }
}

