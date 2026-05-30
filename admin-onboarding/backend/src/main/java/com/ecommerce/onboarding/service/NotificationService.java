package com.ecommerce.onboarding.service;

import com.ecommerce.onboarding.model.AdminNotification;
import com.ecommerce.onboarding.repository.AdminNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final AdminNotificationRepository repo;

    public void create(String adminId, String adminEmail, String type, String message) {
        AdminNotification n = new AdminNotification();
        n.setId("NTF-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8));
        n.setAdminId(adminId);
        n.setAdminEmail(adminEmail);
        n.setType(type);
        n.setMessage(message);
        n.setRead(false);
        repo.save(n);
    }

    public AdminNotificationRepository getRepo() {
        return repo;
    }
}
