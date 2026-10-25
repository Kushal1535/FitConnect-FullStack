package com.fitconnect.dto.response;

import com.fitconnect.entity.ClientStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ClientResponse(
    Long id,
    String fullName,
    String phoneNumber,
    String email,
    Long membershipPlanId,
    String membershipPlanName,
    LocalDate startDate,
    LocalDate endDate,
    ClientStatus status,
    String notes,
    Long assignedStaffId,
    String assignedStaffName,
    String emergencyContact,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}