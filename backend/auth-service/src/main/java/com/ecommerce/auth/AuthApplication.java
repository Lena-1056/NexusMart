package com.ecommerce.auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.HashMap;
import java.util.List;
import org.mindrot.jbcrypt.BCrypt;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.stream.Stream;

@SpringBootApplication
@RestController
@CrossOrigin(origins = "*")
public class AuthApplication implements CommandLineRunner {

    static {
        try {
            Files.readAllLines(Paths.get("../../.env")).forEach(line -> {
                if (line.contains("=") && !line.startsWith("#")) {
                    String[] p = line.split("=", 2);
                    System.setProperty(p[0].trim(), p[1].trim());
                }
            });
        } catch (Exception e) {
            // Ignore missing .env file
        }
    }

    private final JdbcTemplate jdbcTemplate;
    private final EmailService emailService;
    private static final String SECRET = "my_super_secret_key_for_ecommerce_app_12345";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET.getBytes());

    public AuthApplication(JdbcTemplate jdbcTemplate, EmailService emailService) {
        this.jdbcTemplate = jdbcTemplate;
        this.emailService = emailService;
    }

    public static String generateToken(String id, String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("id", id)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 24 hours
                .signWith(SECRET_KEY)
                .compact();
    }

    public static void main(String[] args) {
        SpringApplication.run(AuthApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        jdbcTemplate.execute("ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'password'");
        
        String[] alterUserStatements = {
            "ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)",
            "ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS dob VARCHAR(20)",
            "ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)",
            "ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS avatar_url TEXT",
            "ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS alt_email VARCHAR(255)",
            "ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)",
            "ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50)"
        };
        for (String sql : alterUserStatements) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception e) {
                System.err.println("Could not execute: " + sql + " - " + e.getMessage());
            }
        }

        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS users_schema.addresses (" +
                "id VARCHAR(50) PRIMARY KEY, " +
                "customer_email VARCHAR(255), " +
                "full_name VARCHAR(255), " +
                "mobile VARCHAR(50), " +
                "pincode VARCHAR(20), " +
                "flat VARCHAR(255), " +
                "area VARCHAR(255), " +
                "landmark VARCHAR(255), " +
                "city VARCHAR(100), " +
                "state VARCHAR(100), " +
                "country VARCHAR(100), " +
                "is_default BOOLEAN DEFAULT false, " +
                "address_type VARCHAR(50), " +
                "delivery_instructions VARCHAR(1000))");

        String[] alterStatements = {
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS mobile VARCHAR(50)",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS pincode VARCHAR(20)",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS flat VARCHAR(255)",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS area VARCHAR(255)",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS landmark VARCHAR(255)",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS state VARCHAR(100)",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS country VARCHAR(100)",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS address_type VARCHAR(50)",
            "ALTER TABLE users_schema.addresses ADD COLUMN IF NOT EXISTS delivery_instructions VARCHAR(1000)",
            "ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10)",
            "ALTER TABLE users_schema.users ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP"
        };
        for (String sql : alterStatements) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception e) {
                System.err.println("Could not execute: " + sql + " - " + e.getMessage());
            }
        }
                
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS users_schema.payments (" +
                "id VARCHAR(50) PRIMARY KEY, " +
                "customer_email VARCHAR(255), " +
                "card_number VARCHAR(50), " +
                "expiry VARCHAR(20), " +
                "brand VARCHAR(50))");
    }

    @PostMapping("/api/auth/customer/register")
    public Map<String, Object> register(@RequestBody Map<String, String> request) {
        String id = "CUS-" + UUID.randomUUID().toString();
        String name = request.get("name");
        String email = request.get("email");
        String password = request.get("password");
        String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt());

        jdbcTemplate.update("INSERT INTO users_schema.users (id, email, name, role, status, password, joined) VALUES (?, ?, ?, 'CUSTOMER', 'ACTIVE', ?, CURRENT_DATE)",
                id, email, name, hashedPassword);

        emailService.sendRegistrationEmail(email, name);

        Map<String, Object> user = new HashMap<>();
        user.put("id", id);
        user.put("name", name);
        user.put("email", email);
        user.put("role", "CUSTOMER");
        user.put("status", "ACTIVE");
        return user;
    }

    @PostMapping("/api/auth/forgot-password")
    public Map<String, Object> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        try {
            Map<String, Object> user = jdbcTemplate.queryForMap("SELECT * FROM users_schema.users WHERE email = ?", email);
            
            // Generate 6-digit OTP
            String otp = String.format("%06d", new java.util.Random().nextInt(999999));
            jdbcTemplate.update("UPDATE users_schema.users SET otp_code = ?, otp_expiry = NOW() + INTERVAL '15 minutes' WHERE email = ?", otp, email);
            
            emailService.sendPasswordResetEmail(email, (String) user.get("name"), otp);
            
            return Map.of("status", "success", "message", "OTP sent to your email address.");
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "No account found with that email");
            return error;
        }
    }

    @PostMapping("/api/auth/verify-otp")
    public Map<String, Object> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        try {
            Map<String, Object> user = jdbcTemplate.queryForMap("SELECT * FROM users_schema.users WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()", email, otp);
            return Map.of("status", "success", "message", "OTP verified");
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid or expired OTP");
            return error;
        }
    }

    @PostMapping("/api/auth/reset-password")
    public Map<String, Object> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");
        try {
            Map<String, Object> user = jdbcTemplate.queryForMap("SELECT * FROM users_schema.users WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()", email, otp);
            
            String hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt());
            jdbcTemplate.update("UPDATE users_schema.users SET password = ?, otp_code = NULL, otp_expiry = NULL WHERE email = ?", hashedPassword, email);
            
            return Map.of("status", "success", "message", "Password reset successfully");
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid or expired OTP");
            return error;
        }
    }

    @PostMapping("/api/auth/login")
    public Map<String, Object> adminLogin(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        try {
            Map<String, Object> user = jdbcTemplate.queryForMap("SELECT * FROM users_schema.users WHERE email = ? AND role = 'ADMIN'", email);
            String dbPassword = (String) user.get("password");
            
            if (dbPassword != null && BCrypt.checkpw(password, dbPassword)) {
                String token = generateToken((String) user.get("id"), email, "ADMIN");
                Map<String, Object> response = new HashMap<>(user);
                response.put("token", token);
                response.remove("password");
                return response;
            } else {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Invalid credentials");
                return error;
            }
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid credentials");
            return error;
        }
    }

    @PostMapping("/api/auth/customer/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        try {
            Map<String, Object> user = jdbcTemplate.queryForMap("SELECT * FROM users_schema.users WHERE email = ?", email);
            String dbPassword = (String) user.get("password");
            
            if (BCrypt.checkpw(password, dbPassword)) {
                String token = generateToken((String) user.get("id"), email, (String) user.get("role"));
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                
                // Remove password before sending to frontend
                Map<String, Object> safeUser = new HashMap<>(user);
                safeUser.remove("password");
                response.put("user", safeUser);

                String name = user.get("name") != null ? user.get("name").toString() : "Customer";
                emailService.sendLoginEmail(email, name);

                return response;
            } else {
                throw new RuntimeException("Invalid password");
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Invalid credentials");
            return response;
        }
    }

    @GetMapping("/api/auth/customer/{email}")
    public Map<String, Object> getCustomerProfile(@PathVariable String email) {
        try {
            return jdbcTemplate.queryForMap("SELECT * FROM users_schema.users WHERE email = ?", email);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "User not found");
            return response;
        }
    }

    @PutMapping("/api/auth/customer/{email}")
    public Map<String, Object> updateCustomerProfile(@PathVariable String email, @RequestBody Map<String, String> request) {
        String name = request.get("name");
        String phone = request.get("phone");
        String dob = request.get("dob");
        String gender = request.get("gender");
        String avatarUrl = request.get("avatar_url");
        String altEmail = request.get("alt_email");
        String companyName = request.get("company_name");
        String taxId = request.get("tax_id");

        jdbcTemplate.update("UPDATE users_schema.users SET name = ?, phone = ?, dob = ?, gender = ?, avatar_url = ?, alt_email = ?, company_name = ?, tax_id = ? WHERE email = ?",
                name, phone, dob, gender, avatarUrl, altEmail, companyName, taxId, email);

        return Map.of("status", "success");
    }

    @PutMapping("/api/auth/customer/{email}/password")
    public Map<String, Object> updatePassword(@PathVariable String email, @RequestBody Map<String, String> request) {
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        try {
            Map<String, Object> user = jdbcTemplate.queryForMap("SELECT * FROM users_schema.users WHERE email = ?", email);
            String dbPassword = (String) user.get("password");
            
            if (BCrypt.checkpw(currentPassword, dbPassword)) {
                String hashedNewPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt());
                jdbcTemplate.update("UPDATE users_schema.users SET password = ? WHERE email = ?", hashedNewPassword, email);
                return Map.of("status", "success");
            }
        } catch (Exception e) {}
        
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Invalid current password");
        return response;
    }

    @GetMapping("/api/customer/address/{email}")
    public List<Map<String, Object>> getAddresses(@PathVariable String email) {
        return jdbcTemplate.queryForList("SELECT * FROM users_schema.addresses WHERE customer_email = ? ORDER BY is_default DESC, id ASC", email);
    }

    @PostMapping("/api/customer/address")
    public Map<String, Object> addAddress(@RequestBody Map<String, Object> request) {
        String id = "ADDR-" + UUID.randomUUID().toString();
        String email = (String) request.get("email");
        String fullName = (String) request.get("fullName");
        String mobile = (String) request.get("mobile");
        String pincode = (String) request.get("pincode");
        String flat = (String) request.get("flat");
        String area = (String) request.get("area");
        String landmark = (String) request.get("landmark");
        String city = (String) request.get("city");
        String state = (String) request.get("state");
        String country = (String) request.get("country");
        
        Object isDefaultObj = request.get("isDefault");
        boolean isDefault = false;
        if (isDefaultObj instanceof Boolean) {
            isDefault = (Boolean) isDefaultObj;
        } else if (isDefaultObj instanceof String) {
            isDefault = Boolean.parseBoolean((String) isDefaultObj);
        }
        
        String addressType = (String) request.get("addressType");
        String deliveryInstructions = (String) request.get("deliveryInstructions");

        if (isDefault) {
            jdbcTemplate.update("UPDATE users_schema.addresses SET is_default = false WHERE customer_email = ?", email);
        }

        jdbcTemplate.update("INSERT INTO users_schema.addresses (id, customer_email, full_name, mobile, pincode, flat, area, landmark, city, state, country, is_default, address_type, delivery_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                id, email, fullName, mobile, pincode, flat, area, landmark, city, state, country, isDefault, addressType, deliveryInstructions);

        return Map.of("status", "success", "id", id);
    }

    @PutMapping("/api/customer/address/{id}")
    public Map<String, Object> updateAddress(@PathVariable String id, @RequestBody Map<String, Object> request) {
        String email = (String) request.get("email");
        String fullName = (String) request.get("fullName");
        String mobile = (String) request.get("mobile");
        String pincode = (String) request.get("pincode");
        String flat = (String) request.get("flat");
        String area = (String) request.get("area");
        String landmark = (String) request.get("landmark");
        String city = (String) request.get("city");
        String state = (String) request.get("state");
        String country = (String) request.get("country");
        
        Object isDefaultObj = request.get("isDefault");
        boolean isDefault = false;
        if (isDefaultObj instanceof Boolean) {
            isDefault = (Boolean) isDefaultObj;
        } else if (isDefaultObj instanceof String) {
            isDefault = Boolean.parseBoolean((String) isDefaultObj);
        }
        
        String addressType = (String) request.get("addressType");
        String deliveryInstructions = (String) request.get("deliveryInstructions");

        if (isDefault) {
            jdbcTemplate.update("UPDATE users_schema.addresses SET is_default = false WHERE customer_email = ?", email);
        }

        jdbcTemplate.update("UPDATE users_schema.addresses SET full_name = ?, mobile = ?, pincode = ?, flat = ?, area = ?, landmark = ?, city = ?, state = ?, country = ?, is_default = ?, address_type = ?, delivery_instructions = ? WHERE id = ?",
                fullName, mobile, pincode, flat, area, landmark, city, state, country, isDefault, addressType, deliveryInstructions, id);

        return Map.of("status", "success", "id", id);
    }

    @PutMapping("/api/customer/address/{id}/default")
    public Map<String, Object> setDefaultAddress(@PathVariable String id) {
        try {
            Map<String, Object> addr = jdbcTemplate.queryForMap("SELECT customer_email FROM users_schema.addresses WHERE id = ?", id);
            String email = (String) addr.get("customer_email");
            if (email != null) {
                jdbcTemplate.update("UPDATE users_schema.addresses SET is_default = false WHERE customer_email = ?", email);
                jdbcTemplate.update("UPDATE users_schema.addresses SET is_default = true WHERE id = ?", id);
            }
            return Map.of("status", "success");
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @DeleteMapping("/api/customer/address/{id}")
    public Map<String, Object> deleteAddress(@PathVariable String id) {
        jdbcTemplate.update("DELETE FROM users_schema.addresses WHERE id = ?", id);
        return Map.of("status", "success");
    }

    @GetMapping("/api/customer/payment/{email}")
    public List<Map<String, Object>> getPayments(@PathVariable String email) {
        return jdbcTemplate.queryForList("SELECT * FROM users_schema.payments WHERE customer_email = ?", email);
    }

    @PostMapping("/api/customer/payment")
    public Map<String, Object> addPayment(@RequestBody Map<String, String> request) {
        String id = "PAY-" + UUID.randomUUID().toString();
        String email = request.get("email");
        String cardNumber = request.get("cardNumber");
        String expiry = request.get("expiry");
        String brand = request.get("brand");

        jdbcTemplate.update("INSERT INTO users_schema.payments (id, customer_email, card_number, expiry, brand) VALUES (?, ?, ?, ?, ?)",
                id, email, cardNumber, expiry, brand);

        return Map.of("status", "success", "id", id);
    }
}
