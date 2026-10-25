
package com.fitconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateStaffDesignationRequest(
        @NotBlank(message = "Designation is required")
        @Size(max = 100, message = "Designation cannot exceed 100 characters")
        String designation
) {}
