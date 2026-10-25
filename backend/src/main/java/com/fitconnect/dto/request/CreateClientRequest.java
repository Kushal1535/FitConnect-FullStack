package com.fitconnect.dto.request;

import com.fitconnect.entity.ClientStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

public record CreateClientRequest(
    @NotBlank String fullName,
    @NotBlank String phoneNumber,
    @NotBlank @Email String email,
    @NotNull @Positive Long membershipPlanId,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    @NotNull ClientStatus status,
    String notes,
    Long assignedStaffId,
    String emergencyContact
) {}