
package com.fitconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CompleteStaffInvitationRequest(

        @NotBlank
        @Size(max = 100)
        String token,

        @NotBlank
        @Size(min = 8, max = 72)
        String password
) {}
