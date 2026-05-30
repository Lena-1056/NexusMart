package com.ecommerce.shipping.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "shipments")
public class Shipment {

    @Id
    private String id;
    private String orderId;
    private String trackingId;
    private String courier;
    private String status;
    private String sellerLocation;
    private String courierId; // First mile
    private String linehaulCourierId;
    private String lastMileCourierId;
    private String originHub;
    private String destHub;
    
    private String paymentMethod;
    private Double amount;
    private String deliveryAddress;
    private String originAddress;

    public Shipment() {
    }

    public Shipment(String orderId, String courier, String status, String sellerLocation, String paymentMethod, Double amount) {
        this.id = UUID.randomUUID().toString();
        this.orderId = orderId;
        this.trackingId = "TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.courier = courier;
        this.status = status;
        this.sellerLocation = sellerLocation;
        this.paymentMethod = paymentMethod;
        this.amount = amount;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getTrackingId() {
        return trackingId;
    }

    public void setTrackingId(String trackingId) {
        this.trackingId = trackingId;
    }

    public String getCourier() {
        return courier;
    }

    public void setCourier(String courier) {
        this.courier = courier;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSellerLocation() { return sellerLocation; }
    public void setSellerLocation(String sellerLocation) { this.sellerLocation = sellerLocation; }
    public String getCourierId() { return courierId; }
    public void setCourierId(String courierId) { this.courierId = courierId; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getLinehaulCourierId() {
        return linehaulCourierId;
    }

    public void setLinehaulCourierId(String linehaulCourierId) {
        this.linehaulCourierId = linehaulCourierId;
    }

    public String getLastMileCourierId() {
        return lastMileCourierId;
    }

    public void setLastMileCourierId(String lastMileCourierId) {
        this.lastMileCourierId = lastMileCourierId;
    }

    public String getOriginHub() {
        return originHub;
    }

    public void setOriginHub(String originHub) {
        this.originHub = originHub;
    }

    public String getDestHub() {
        return destHub;
    }

    public void setDestHub(String destHub) {
        this.destHub = destHub;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getOriginAddress() { return originAddress; }
    public void setOriginAddress(String originAddress) { this.originAddress = originAddress; }
}
