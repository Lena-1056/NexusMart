package com.ecommerce.order;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "orders", schema = "orders_schema")
public class Order {
    @Id
    public String id;
    public String customer;
    public String seller;
    public String product;
    public int quantity;
    public double amount;
    public String status;
    public String payment;
    public String paymentMethod;
    public String date;
    public String address;
    public String customerCity;

    public String trackingId;
    public String createdAt;
    public String updatedAt;
    public String deliveredAt;

    public Order() {}
}
