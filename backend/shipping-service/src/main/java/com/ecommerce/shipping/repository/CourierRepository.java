package com.ecommerce.shipping.repository;

import com.ecommerce.shipping.entity.Courier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CourierRepository extends JpaRepository<Courier, String> {
    Optional<Courier> findByEmail(String email);
}
