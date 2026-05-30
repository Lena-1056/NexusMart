package com.ecommerce.user;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {
    @Id
    public String id;
    public String name;
    public String email;
    public String role;
    public String status;
    public String joined;
    public int orders;

    public User() {}
}
