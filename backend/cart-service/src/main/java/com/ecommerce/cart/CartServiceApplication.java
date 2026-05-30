package com.ecommerce.cart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.UUID;

@SpringBootApplication
@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartServiceApplication {

    static {
        try {
            java.nio.file.Files.readAllLines(java.nio.file.Paths.get("../../.env")).forEach(line -> {
                if (line.contains("=") && !line.startsWith("#")) {
                    String[] p = line.split("=", 2);
                    System.setProperty(p[0].trim(), p[1].trim());
                }
            });
        } catch (Exception e) {}
    }

    private final JdbcTemplate jdbcTemplate;

    public CartServiceApplication(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public static void main(String[] args) {
        SpringApplication.run(CartServiceApplication.class, args);
    }

    @GetMapping("/{email}")
    public List<Map<String, Object>> getCart(@PathVariable String email) {
        return jdbcTemplate.queryForList("SELECT * FROM carts_schema.carts WHERE customer_email = ?", email);
    }

    @PostMapping("/add")
    public Map<String, Object> addItem(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String productId = (String) request.get("productId");
        int quantity = (Integer) request.get("quantity");
        
        List<Map<String, Object>> existing = jdbcTemplate.queryForList(
                "SELECT * FROM carts_schema.carts WHERE customer_email = ? AND product_id = ?", email, productId);
        
        if (existing.isEmpty()) {
            String id = UUID.randomUUID().toString();
            jdbcTemplate.update("INSERT INTO carts_schema.carts (id, customer_email, product_id, quantity) VALUES (?, ?, ?, ?)",
                    id, email, productId, quantity);
        } else {
            jdbcTemplate.update("UPDATE carts_schema.carts SET quantity = quantity + ? WHERE customer_email = ? AND product_id = ?",
                    quantity, email, productId);
        }
        
        return Map.of("status", "success", "message", "Item added");
    }

    @PutMapping("/update")
    public Map<String, Object> updateQuantity(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String productId = (String) request.get("productId");
        int quantity = (Integer) request.get("quantity");
        
        if (quantity <= 0) {
            jdbcTemplate.update("DELETE FROM carts_schema.carts WHERE customer_email = ? AND product_id = ?", email, productId);
        } else {
            jdbcTemplate.update("UPDATE carts_schema.carts SET quantity = ? WHERE customer_email = ? AND product_id = ?",
                    quantity, email, productId);
        }
        
        return Map.of("status", "success", "message", "Quantity updated");
    }

    @DeleteMapping("/remove")
    public Map<String, Object> removeItem(@RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String productId = (String) request.get("productId");
        
        jdbcTemplate.update("DELETE FROM carts_schema.carts WHERE customer_email = ? AND product_id = ?", email, productId);
        
        return Map.of("status", "success", "message", "Item removed");
    }
}
