
package com.fitconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "staff_invitations",
    indexes = {
        @Index(name = "idx_invitation_email", columnList = "email")
    }
)
public class StaffInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 150)
    private String email;
    @Column(nullable = false, length = 20)
    private String phoneNumber;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false, length = 64)
    private String otpHash;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean verified = false;

    @Column(nullable = false, length = 100)
    private String designation = "Staff Member";


@Column(nullable = false)
private int otpAttempts = 0;

@Column(nullable = false)
private LocalDateTime otpExpiresAt;

@Column(nullable = false)
private LocalDateTime lastOtpSentAt;


    @Column(nullable = false)
    private boolean used = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public StaffInvitation() {
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getTokenHash() { return tokenHash; }
    public String getOtpHash() { return otpHash; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isVerified() { return verified; }
    public boolean isUsed() { return used; }

    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setEmail(String email) { this.email = email; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public void setUsed(boolean used) { this.used = used; }


public int getOtpAttempts() {
    return otpAttempts;
}

public void setOtpAttempts(int otpAttempts) {
    this.otpAttempts = otpAttempts;
}

public LocalDateTime getOtpExpiresAt() {
    return otpExpiresAt;
}

public void setOtpExpiresAt(LocalDateTime otpExpiresAt) {
    this.otpExpiresAt = otpExpiresAt;
}

public LocalDateTime getLastOtpSentAt() {
    return lastOtpSentAt;
}

public void setLastOtpSentAt(LocalDateTime lastOtpSentAt) {
    this.lastOtpSentAt = lastOtpSentAt;
}

public String getDesignation() {
    return designation;
}

public void setDesignation(String designation) {
    this.designation = designation;
}

}
