
package com.fitconnect.dto.response;

public record LoginResponse(
    String token,
    String tokenType,
    Long userId,
    String fullName,
    String email,
    String role
) {}
