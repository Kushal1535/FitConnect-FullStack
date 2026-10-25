
package com.fitconnect.dto.request;

import com.fitconnect.entity.FollowUp;
import jakarta.validation.constraints.NotNull;

public class UpdateFollowUpStatusRequest {

    @NotNull(message = "Status is required")
    private FollowUp.Status status;

    public UpdateFollowUpStatusRequest() {
    }

    public FollowUp.Status getStatus() {
        return status;
    }

    public void setStatus(FollowUp.Status status) {
        this.status = status;
    }
}
