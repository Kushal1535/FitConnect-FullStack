
package com.fitconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VerifyStaffInvitationRequest(
        @NotBlank
        @Size(max = 100)
        String token,

        @NotBlank
        @Pattern(regexp = "^[0-9]{6}$",
                 message = "OTP must contain exactly six digits")
        String otp
) {}
