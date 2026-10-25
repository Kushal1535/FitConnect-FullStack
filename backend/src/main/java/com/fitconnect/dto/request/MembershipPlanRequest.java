
package com.fitconnect.dto.request;

import com.fitconnect.entity.MembershipPlanStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;

public record MembershipPlanRequest(
    @NotBlank String name,

    @NotNull @Positive Integer durationDays,

    @NotNull @DecimalMin("0.0") BigDecimal price,

    String description,

    List<String> features,

    @NotNull MembershipPlanStatus status
) {}
