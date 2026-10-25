package com.fitconnect.dto.response;

import java.time.LocalDateTime;

public record StaffResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        String role,
        String designation,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}