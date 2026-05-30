package com.ecommerce.onboarding;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class OnboardingApplication {

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
        SpringApplication.run(OnboardingApplication.class, args);
    }
}
