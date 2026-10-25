package com.fitconnect.dto.request;

import com.fitconnect.entity.ClientStatus;

import java.time.LocalDate;

public record UpdateClientRequest(
    String fullName,
    String phoneNumber,
    String email,
    Long membershipPlanId,
    LocalDate startDate,
    LocalDate endDate,
    ClientStatus status,
    String notes,
    Long assignedStaffId,
    String emergencyContact
) {}