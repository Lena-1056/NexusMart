package com.ecommerce.shipping.controller;

import com.ecommerce.shipping.entity.Courier;
import com.ecommerce.shipping.entity.Shipment;
import com.ecommerce.shipping.repository.CourierRepository;
import com.ecommerce.shipping.repository.ShipmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/shipping")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class ShippingController {

    @Autowired
    private ShipmentRepository shipmentRepository;

    @Autowired
    private CourierRepository courierRepository;

    @Autowired
    private RestTemplate restTemplate;

    @GetMapping
    public ResponseEntity<?> getAllShipments(@RequestParam(required = false) String location, @RequestParam(required = false) String courierId) {
        List<Shipment> shipments = shipmentRepository.findAll();
        
        if (courierId != null) {
            // First we need to get the Courier to know their role
            Optional<Courier> courierOpt = courierRepository.findById(courierId);
            if (courierOpt.isPresent()) {
                Courier c = courierOpt.get();
                if ("LINEHAUL".equals(c.role)) {
                    // Linehaul sees shipments waiting at their hub (originHub) to be transferred to destHub
                    shipments = shipments.stream()
                        .filter(s -> ("REACHED_ORIGIN_HUB".equals(s.getStatus()) && c.location.equals(s.getOriginHub())) || courierId.equals(s.getLinehaulCourierId()))
                        .collect(Collectors.toList());
                } else {
                    // Local sees PENDING first-mile in their city OR REACHED_DESTINATION_HUB last-mile in their city
                    shipments = shipments.stream()
                        .filter(s -> 
                            ("PENDING".equals(s.getStatus()) && c.location.equals(s.getSellerLocation())) ||
                            ("REACHED_DESTINATION_HUB".equals(s.getStatus()) && c.location.equals(s.getDestHub())) ||
                            courierId.equals(s.getCourierId()) || 
                            courierId.equals(s.getLastMileCourierId())
                        )
                        .collect(Collectors.toList());
                }
            } else {
                shipments = shipments.stream().filter(s -> courierId.equals(s.getCourierId())).collect(Collectors.toList());
            }
        } else if (location != null) {
            shipments = shipments.stream().filter(s -> "PENDING".equals(s.getStatus()) && location.equals(s.getSellerLocation())).collect(Collectors.toList());
        }
        
        return ResponseEntity.ok(shipments);
    }

    @GetMapping("/{trackingId}")
    public ResponseEntity<?> getShipment(@PathVariable String trackingId) {
        return shipmentRepository.findByTrackingId(trackingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createShipment(@RequestBody Map<String, String> request) {
        String orderId = request.get("orderId");
        String courier = request.getOrDefault("courier", "Nexus Logistics");
        String sellerLocation = request.get("sellerLocation");
        String destHub = request.getOrDefault("destHub", "Mumbai");
        String paymentMethod = request.get("paymentMethod");
        Double amount = request.containsKey("amount") ? Double.parseDouble(request.get("amount")) : 0.0;
        String deliveryAddress = request.get("deliveryAddress");
        String originAddress = request.get("originAddress");
        
        Shipment shipment = new Shipment(orderId, courier, "PENDING", sellerLocation, paymentMethod, amount);
        shipment.setOriginHub(sellerLocation);
        shipment.setDestHub(destHub);
        shipment.setDeliveryAddress(deliveryAddress);
        shipment.setOriginAddress(originAddress);
        
        shipmentRepository.save(shipment);
        
        return ResponseEntity.ok(Map.of("trackingId", shipment.getTrackingId()));
    }

    @PutMapping("/{trackingId}/address")
    public ResponseEntity<?> updateAddress(@PathVariable String trackingId, @RequestBody Map<String, String> request) {
        Optional<Shipment> shipmentOpt = shipmentRepository.findByTrackingId(trackingId);
        if (shipmentOpt.isEmpty()) return ResponseEntity.notFound().build();
        Shipment shipment = shipmentOpt.get();
        shipment.setDeliveryAddress(request.get("deliveryAddress"));
        shipmentRepository.save(shipment);
        return ResponseEntity.ok(shipment);
    }

    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyShipments(@RequestParam String location, @RequestParam(defaultValue = "50") int radiusKm) {
        // Return REACHED_DESTINATION_HUB shipments whose destHub matches location (city-based proximity)
        List<Shipment> all = shipmentRepository.findAll();
        List<Shipment> nearby = all.stream()
            .filter(s -> "REACHED_DESTINATION_HUB".equals(s.getStatus())
                && s.getCourierId() == null  // not yet claimed
                && isNearby(location, s.getDestHub(), radiusKm))
            .collect(Collectors.toList());
        return ResponseEntity.ok(nearby);
    }

    // Simple city-distance lookup (km) for Indian cities
    private boolean isNearby(String courierCity, String destHub, int radiusKm) {
        if (courierCity == null || destHub == null) return false;
        if (courierCity.equalsIgnoreCase(destHub)) return true;
        // Known same-metro pairs
        java.util.Map<String, java.util.List<String>> metro = new java.util.HashMap<>();
        metro.put("Bengaluru", java.util.Arrays.asList("Electronic City", "Whitefield", "HSR Layout", "Koramangala", "Indiranagar", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Ballari"));
        metro.put("Mumbai", java.util.Arrays.asList("Navi Mumbai", "Thane", "Bandra", "Andheri", "Borivali"));
        metro.put("Delhi", java.util.Arrays.asList("Noida", "Gurugram", "Gurgaon", "Faridabad", "Ghaziabad"));
        metro.put("Hyderabad", java.util.Arrays.asList("Secunderabad", "Cyberabad", "HITEC City"));
        metro.put("Chennai", java.util.Arrays.asList("Tambaram", "Velachery", "OMR", "Perambur"));
        metro.put("Kolkata", java.util.Arrays.asList("Salt Lake", "Howrah", "New Town"));
        metro.put("Visakhapatnam", java.util.Arrays.asList("Vijayawada", "Guntur", "Tirupati", "Nellore", "Kurnool"));
        
        // Let's treat all Karnataka as one big zone for testing, and AP as another.
        // If they are in the same general state zone, treat them as nearby.
        for (java.util.Map.Entry<String, java.util.List<String>> e : metro.entrySet()) {
            boolean courierInMetro = e.getKey().equalsIgnoreCase(courierCity) || e.getValue().stream().anyMatch(c -> c.equalsIgnoreCase(courierCity));
            boolean destInMetro = e.getKey().equalsIgnoreCase(destHub) || e.getValue().stream().anyMatch(c -> c.equalsIgnoreCase(destHub));
            if (courierInMetro && destInMetro) return true;
        }
        return false;
    }

    @GetMapping("/eta")
    public ResponseEntity<?> getETA(@RequestParam String originCity, @RequestParam String destCity) {
        if (originCity == null || destCity == null) return ResponseEntity.ok(Map.of("eta", "3-5 days"));
        
        if (originCity.equalsIgnoreCase(destCity)) {
            return ResponseEntity.ok(Map.of("eta", "1 day (Next day delivery)"));
        }
        
        // Define states
        List<String> karnataka = List.of("Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Ballari", "Electronic City", "Whitefield");
        List<String> andhra = List.of("Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kurnool");
        List<String> maharashtra = List.of("Mumbai", "Pune", "Nagpur", "Nashik", "Navi Mumbai", "Thane");
        
        boolean originKA = karnataka.stream().anyMatch(originCity::equalsIgnoreCase);
        boolean destKA = karnataka.stream().anyMatch(destCity::equalsIgnoreCase);
        boolean originAP = andhra.stream().anyMatch(originCity::equalsIgnoreCase);
        boolean destAP = andhra.stream().anyMatch(destCity::equalsIgnoreCase);
        boolean originMH = maharashtra.stream().anyMatch(originCity::equalsIgnoreCase);
        boolean destMH = maharashtra.stream().anyMatch(destCity::equalsIgnoreCase);

        if ((originKA && destKA) || (originAP && destAP) || (originMH && destMH)) {
            return ResponseEntity.ok(Map.of("eta", "2-3 days"));
        }
        
        if ((originKA && originAP) || (destKA && destAP)) {
            // Not possible, just safety fallback
            return ResponseEntity.ok(Map.of("eta", "3-5 days"));
        }
        
        return ResponseEntity.ok(Map.of("eta", "3-5 days"));
    }

    @PutMapping("/{trackingId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String trackingId, @RequestBody Map<String, String> request) {
        Optional<Shipment> shipmentOpt = shipmentRepository.findByTrackingId(trackingId);
        if (shipmentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Shipment shipment = shipmentOpt.get();
        String newStatus = request.get("status");
        shipment.setStatus(newStatus);
        
        if (request.containsKey("courierId")) {
            String cid = request.get("courierId");
            if ("PICKED_UP".equals(newStatus) || "COLLECTED".equals(newStatus)) {
                shipment.setCourierId(cid);
            } else if ("IN_TRANSIT_LINEHAUL".equals(newStatus)) {
                shipment.setLinehaulCourierId(cid);
            } else if ("OUT_FOR_DELIVERY".equals(newStatus)) {
                shipment.setLastMileCourierId(cid);
            }
        }
        
        shipmentRepository.save(shipment);
        
        // Notify order-service
        try {
            if ("DELIVERED".equals(newStatus)) {
                // Use /deliver endpoint so revenue update + notifications fire correctly
                String orderServiceUrl = "http://localhost:8083/api/orders/" + shipment.getOrderId() + "/deliver";
                restTemplate.put(orderServiceUrl, null);
            } else {
                // Map shipping status to order status
                String orderStatus = newStatus;
                if ("PICKED_UP".equals(newStatus)) orderStatus = "SHIPPED";
                else if ("REACHED_ORIGIN_HUB".equals(newStatus) || "IN_TRANSIT_LINEHAUL".equals(newStatus) || "REACHED_DESTINATION_HUB".equals(newStatus)) orderStatus = "IN_TRANSIT";
                else if ("OUT_FOR_DELIVERY".equals(newStatus)) orderStatus = "OUT_FOR_DELIVERY";
                String orderServiceUrl = "http://localhost:8083/api/orders/" + shipment.getOrderId() + "/status";
                restTemplate.put(orderServiceUrl, Map.of("status", orderStatus));
            }
        } catch (Exception e) {
            // Log error, but proceed
            System.err.println("Failed to notify order-service: " + e.getMessage());
        }
        
        return ResponseEntity.ok(shipment);
    }

    @PostMapping("/webhook/3pl")
    public ResponseEntity<?> handle3PLWebhook(@RequestBody Map<String, Object> payload) {
        // Mock 3PL payload: { "trackingNumber": "...", "status": "...", "paymentCollected": true }
        String trackingId = (String) payload.get("trackingNumber");
        String status = (String) payload.get("status");

        Optional<Shipment> shipmentOpt = shipmentRepository.findByTrackingId(trackingId);
        if (shipmentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Shipment shipment = shipmentOpt.get();
        shipment.setStatus(status);
        shipmentRepository.save(shipment);

        // Notify order-service
        try {
            String orderServiceUrl = "http://localhost:8083/api/orders/" + shipment.getOrderId() + "/status";
            restTemplate.put(orderServiceUrl, Map.of("status", status));
        } catch (Exception e) {
            System.err.println("Failed to notify order-service from webhook: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("message", "Webhook processed successfully"));
    }

    @PostMapping("/couriers/register")
    public ResponseEntity<?> registerCourier(@RequestBody Map<String, String> request) {
        Courier courier = new Courier(
            request.get("name"),
            request.get("email"),
            request.get("password"),
            request.get("location")
        );
        courierRepository.save(courier);
        return ResponseEntity.ok(courier);
    }

    @PostMapping("/couriers/login")
    public ResponseEntity<?> loginCourier(@RequestBody Map<String, String> request) {
        Optional<Courier> courierOpt = courierRepository.findByEmail(request.get("email"));
        if (courierOpt.isPresent() && courierOpt.get().password.equals(request.get("password"))) {
            return ResponseEntity.ok(courierOpt.get());
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }
}
