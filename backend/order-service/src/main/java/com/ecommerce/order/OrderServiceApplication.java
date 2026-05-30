package com.ecommerce.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.HashMap;

@SpringBootApplication
public class OrderServiceApplication {

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

    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
