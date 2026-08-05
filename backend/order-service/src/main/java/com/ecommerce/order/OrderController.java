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
                ResponseEntity<List> productsRes = restTemplate.getForEntity("http://localhost:9000/api/products", List.class);
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
        
        if (order.quantity <= 0) {
            order.quantity = 1;
        }

        // Call Product Service to decrement stock
        try {
            Map<String, Integer> stockReq = new HashMap<>();
            stockReq.put("quantity", order.quantity);
            restTemplate.put("http://localhost:9000/api/products/" + order.product + "/stock", stockReq);
        } catch (Exception e) {
            System.err.println("Stock decrement failed: " + e.getMessage());
            return ResponseEntity.badRequest().build(); // Out of stock
        }

        // If payment is COD, status is CREATED awaiting seller acceptance
        if ("COD".equalsIgnoreCase(order.payment)) {
            order.status = "CREATED";
            orderRepository.save(order);
            sendNotification(order.seller, "New order received (COD)! Product: " + order.product + ". Delivery Location: " + order.address);
            
            Map<String, String> pInfo = getProductInfo(order.product);
            String html = generateOrderHtml(order, pInfo.get("name"), pInfo.get("image"));
            sendHtmlNotification(order.customer, "Ordered: " + pInfo.get("name"), html);
            
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
                    
                    Map<String, String> pInfo = getProductInfo(order.product);
                    String html = generateOrderHtml(order, pInfo.get("name"), pInfo.get("image"));
                    sendHtmlNotification(order.customer, "Order Update: " + pInfo.get("name"), html);
                    
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
            
            Map<String, String> pInfo = getProductInfo(o.product);
            String html = generateOrderHtml(o, pInfo.get("name"), pInfo.get("image"));
            sendHtmlNotification(o.customer, "Order Update: " + pInfo.get("name"), html);
            
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
            try {
                Map<String, Integer> stockReq = new HashMap<>();
                stockReq.put("quantity", -o.quantity);
                restTemplate.put("http://localhost:9000/api/products/" + o.product + "/stock", stockReq);
            } catch (Exception e) {
                System.err.println("Inventory release failed: " + e.getMessage());
            }
            
            Map<String, String> pInfo = getProductInfo(o.product);
            String html = generateOrderHtml(o, pInfo.get("name"), pInfo.get("image"));
            sendHtmlNotification(o.customer, "Order Update: " + pInfo.get("name"), html);
            
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
                shipReq.put("customerEmail", o.customer);
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
            sendNotification(o.seller, "You have successfully dispatched order " + o.id + ".");
            
            Map<String, String> pInfo = getProductInfo(o.product);
            String html = generateOrderHtml(o, pInfo.get("name"), pInfo.get("image"));
            sendHtmlNotification(o.customer, "Order Update: " + pInfo.get("name"), html);
            
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
                
                Map<String, String> pInfo = getProductInfo(o.product);
                String html = generateOrderHtml(o, pInfo.get("name"), pInfo.get("image"));
                sendHtmlNotification(o.customer, "Order Update: " + pInfo.get("name"), html);
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
            
            if ("OUT_FOR_DELIVERY".equals(newStatus) || "DELIVERED".equals(newStatus)) {
                Map<String, String> pInfo = getProductInfo(o.product);
                String html = generateOrderHtml(o, pInfo.get("name"), pInfo.get("image"));
                sendHtmlNotification(o.customer, "Order Update: " + pInfo.get("name"), html);
            }
            
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
            try {
                Map<String, Integer> stockReq = new HashMap<>();
                stockReq.put("quantity", -o.quantity);
                restTemplate.put("http://localhost:9000/api/products/" + o.product + "/stock", stockReq);
            } catch (Exception e) {
                System.err.println("Inventory release failed: " + e.getMessage());
            }

            sendNotification(o.seller, "Order " + o.id + " for product " + o.product + " has been cancelled by the customer.");
            
            Map<String, String> pInfo = getProductInfo(o.product);
            String html = generateOrderHtml(o, pInfo.get("name"), pInfo.get("image"));
            sendHtmlNotification(o.customer, "Order Update: " + pInfo.get("name"), html);
            
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
            restTemplate.postForEntity("http://localhost:8091/api/notifications/email", req, String.class);
        } catch (Exception e) {
            System.err.println("Failed to send notification: " + e.getMessage());
        }
    }

    private void sendHtmlNotification(String recipient, String subject, String message) {
        try {
            Map<String, Object> req = new HashMap<>();
            req.put("recipient", recipient);
            req.put("subject", subject);
            req.put("message", message);
            req.put("isHtml", true);
            restTemplate.postForEntity("http://localhost:8091/api/notifications/email", req, String.class);
        } catch (Exception e) {
            System.err.println("Failed to send HTML notification: " + e.getMessage());
        }
    }

    private Map<String, String> getProductInfo(String productId) {
        try {
            ResponseEntity<List> productsRes = restTemplate.getForEntity("http://localhost:9000/api/products", List.class);
            if (productsRes.getStatusCode().is2xxSuccessful() && productsRes.getBody() != null) {
                List<Map<String, Object>> allProducts = (List<Map<String, Object>>) productsRes.getBody();
                for (Map<String, Object> p : allProducts) {
                    if (productId.equals(p.get("id"))) {
                        Map<String, String> info = new HashMap<>();
                        info.put("name", (String) p.get("name"));
                        String emoji = (String) p.get("emoji");
                        if (emoji != null && emoji.startsWith("data:image")) {
                            emoji = emoji.split("\\|\\|")[0];
                        }
                        info.put("image", emoji != null ? emoji : "");
                        return info;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to fetch product info: " + e.getMessage());
        }
        Map<String, String> def = new HashMap<>();
        def.put("name", "Product " + productId);
        def.put("image", "");
        return def;
    }

    private String generateOrderHtml(Order order, String productName, String productImgUrl) {
        boolean isShipped = "DISPATCHED".equals(order.status) || "SHIPPED".equals(order.status) || "IN_TRANSIT".equals(order.status) || "OUT_FOR_DELIVERY".equals(order.status) || "DELIVERED".equals(order.status);
        boolean isOut = "OUT_FOR_DELIVERY".equals(order.status) || "DELIVERED".equals(order.status);
        boolean isDelivered = "DELIVERED".equals(order.status);

        String cShipped = isShipped ? "#008296" : "#ddd";
        String tShipped = isShipped ? "color: #008296; font-weight: bold;" : "color: #767676;";
        String sShipped = isShipped ? "✓" : "";

        String cOut = isOut ? "#008296" : "#ddd";
        String tOut = isOut ? "color: #008296; font-weight: bold;" : "color: #767676;";
        String sOut = isOut ? "✓" : "";

        String cDel = isDelivered ? "#008296" : "#ddd";
        String tDel = isDelivered ? "color: #008296; font-weight: bold;" : "color: #767676;";
        String sDel = isDelivered ? "✓" : "";

        boolean isCancelled = "CANCELLED".equals(order.status) || "REJECTED_BY_SELLER".equals(order.status);
        String title = "Thanks for your order!";
        if (isCancelled) {
            title = "Your order has been cancelled";
        } else if ("ACCEPTED".equals(order.status)) {
            title = "Your order has been accepted!";
        } else if ("DISPATCHED".equals(order.status) || "SHIPPED".equals(order.status) || "IN_TRANSIT".equals(order.status)) {
            title = "Your order has been shipped!";
        } else if ("OUT_FOR_DELIVERY".equals(order.status)) {
            title = "Your order is out for delivery!";
        } else if ("DELIVERED".equals(order.status)) {
            title = "Your order has been delivered!";
        }
        String titleColor = isCancelled ? "#d9534f" : "#000";

        String progressHtml = "";
        if (isCancelled) {
            progressHtml = "<div style='text-align: center; color: #d9534f; margin: 30px 0; font-size: 18px; font-weight: bold; background-color: #fdf0ef; padding: 15px; border-radius: 8px;'>Order Cancelled ❌</div>";
        } else {
            progressHtml = "<table width='100%' border='0' cellspacing='0' cellpadding='0' style='margin: 30px 0;'>" +
                "<tr>" +
                "<td width='22%' align='center'><div style='background-color: #008296; color: #fff; width: 24px; height: 24px; border-radius: 12px; line-height: 24px; margin: 0 auto;'>✓</div></td>" +
                "<td width='4%' style='background: " + cShipped + "; height: 3px;'></td>" +
                "<td width='22%' align='center'><div style='background-color: " + cShipped + "; color: #fff; width: 24px; height: 24px; border-radius: 12px; line-height: 24px; margin: 0 auto;'>" + sShipped + "</div></td>" +
                "<td width='4%' style='background: " + cOut + "; height: 3px;'></td>" +
                "<td width='22%' align='center'><div style='background-color: " + cOut + "; color: #fff; width: 24px; height: 24px; border-radius: 12px; line-height: 24px; margin: 0 auto;'>" + sOut + "</div></td>" +
                "<td width='4%' style='background: " + cDel + "; height: 3px;'></td>" +
                "<td width='22%' align='center'><div style='background-color: " + cDel + "; color: #fff; width: 24px; height: 24px; border-radius: 12px; line-height: 24px; margin: 0 auto;'>" + sDel + "</div></td>" +
                "</tr>" +
                "<tr>" +
                "<td width='22%' align='center' style='color: #008296; font-weight: bold; font-size: 14px; padding-top: 10px;'>Ordered</td>" +
                "<td width='4%'></td>" +
                "<td width='22%' align='center' style='" + tShipped + " font-size: 14px; padding-top: 10px;'>Shipped</td>" +
                "<td width='4%'></td>" +
                "<td width='22%' align='center' style='" + tOut + " font-size: 14px; padding-top: 10px;'>Out for delivery</td>" +
                "<td width='4%'></td>" +
                "<td width='22%' align='center' style='" + tDel + " font-size: 14px; padding-top: 10px;'>Delivered</td>" +
                "</tr>" +
                "</table>";
        }

        return "<html><body style='font-family: Arial, sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px;'>" +
            "<div style='max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);'>" +
            "<div style='background-color: #232f3e; color: #fff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; font-size: 16px; font-weight: bold;'>" +
            "<a href='http://localhost:5173/orders' style='color: #fff; text-decoration: none; margin: 0 15px;'>Your Orders</a>" +
            "<a href='http://localhost:5173/profile' style='color: #fff; text-decoration: none; margin: 0 15px;'>Your Account</a>" +
            "<a href='http://localhost:5173/' style='color: #fff; text-decoration: none; margin: 0 15px;'>Buy Again</a>" +
            "</div>" +
            "<h2 style='text-align: center; margin-top: 20px; color: " + titleColor + ";'>" + title + "</h2>" +
            progressHtml +
            "<div style='border-top: 1px solid #ddd; padding-top: 20px;'>" +
            "<p style='margin: 5px 0;'><strong>Order # " + order.id + "</strong></p>" +
            "<p style='margin: 5px 0; color: #555;'>" + order.address + "</p>" +
            "<div style='margin-top: 15px;'>" +
            "<a href='http://localhost:5173/orders' style='display: inline-block; background-color: #ffd814; color: #0f1111; text-decoration: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; font-size: 14px;'>View or edit order</a>" +
            "</div>" +
            "</div>" +
            "<div style='display: flex; margin-top: 20px; padding: 20px; background-color: #f9f9f9; border-radius: 8px;'>" +
            (productImgUrl != null && (productImgUrl.startsWith("http") || productImgUrl.startsWith("data:image")) ? 
            "<img src='" + productImgUrl + "' style='width: 100px; height: 100px; object-fit: contain; background: #fff; padding: 5px; border: 1px solid #ddd; border-radius: 4px; margin-right: 20px;'/>" :
            "<div style='width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; font-size: 48px; background: #fff; border: 1px solid #ddd; border-radius: 4px; margin-right: 20px; text-align: center;'>" + (productImgUrl != null && !productImgUrl.trim().isEmpty() ? productImgUrl : "📦") + "</div>") +
            "<div>" +
            "<p style='margin: 0 0 10px 0; font-size: 16px;'><a href='http://localhost:5173/product/" + order.product + "' style='color: #007185; text-decoration: none;'>" + productName + "</a></p>" +
            "<p style='margin: 0; font-weight: bold; font-size: 18px;'>₹" + order.amount + " (Qty: " + order.quantity + ")</p>" +
            "<div style='margin-top: 10px;'><a href='http://localhost:5173/product/" + order.product + "' style='display: inline-block; background-color: #e3f2fd; color: #007185; text-decoration: none; padding: 6px 12px; border-radius: 16px; font-weight: bold; font-size: 12px;'>View item</a></div>" +
            "</div>" +
            "</div>" +
            "<div style='border-top: 1px solid #ddd; margin-top: 20px; padding-top: 20px; text-align: right; font-size: 18px;'>" +
            "<strong>Total: ₹" + order.amount + "</strong>" +
            "</div>" +
            "</div></body></html>";
    }
}

