package com.ecommerce.onboarding.repository;

import com.ecommerce.onboarding.model.AdminNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminNotificationRepository extends JpaRepository<AdminNotification, String> {
    List<AdminNotification> findByAdminIdOrderByCreatedAtDesc(String adminId);
    List<AdminNotification> findByAdminEmailOrderByCreatedAtDesc(String email);
}
