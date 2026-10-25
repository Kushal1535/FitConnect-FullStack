package com.fitconnect.dto.request;

import com.fitconnect.entity.ClientStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateClientStatusRequest(
    @NotNull ClientStatus status
) {}