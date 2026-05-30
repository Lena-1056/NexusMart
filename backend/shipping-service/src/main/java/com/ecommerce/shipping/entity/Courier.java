package com.ecommerce.shipping.entity;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "couriers", schema = "shipping_schema")
public class Courier {
    @Id
    public String id;
    public String name;
    public String email;
    public String password;
    public String location;
    public String role;
    
    public Courier() {}
    
    public Courier(String name, String email, String password, String location) {
        this.id = "COUR-" + UUID.randomUUID().toString().substring(0, 8);
        this.name = name;
        this.email = email;
        this.password = password; // In production, hash this!
        this.location = location;
        this.role = "LOCAL";
    }
}
