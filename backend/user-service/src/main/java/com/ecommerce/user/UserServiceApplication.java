package com.ecommerce.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class UserServiceApplication {

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
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
