
package com.fitconnect.dto.response;

import com.fitconnect.entity.MembershipPlanStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record MembershipPlanResponse(
    Long id,
    String name,
    Integer durationDays,
    BigDecimal price,
    String description,
    List<String> features,
    MembershipPlanStatus status,
    Long activeMembersCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
