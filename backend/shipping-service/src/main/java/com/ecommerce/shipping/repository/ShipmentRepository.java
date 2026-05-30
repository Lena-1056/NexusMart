package com.ecommerce.shipping.repository;

import com.ecommerce.shipping.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, String> {
    Optional<Shipment> findByTrackingId(String trackingId);
}
