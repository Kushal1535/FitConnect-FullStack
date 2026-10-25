
package com.fitconnect.dto.response;

import com.fitconnect.entity.FollowUp;
import java.time.LocalDateTime;

public class FollowUpResponse {

    private Long id;
    private Long clientId;
    private String clientName;
    private String title;
    private String notes;
    private LocalDateTime dueDate;
    private String assignedStaff;
    private FollowUp.Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FollowUpResponse() {
    }

    public FollowUpResponse(
            Long id,
            Long clientId,
            String clientName,
            String title,
            String notes,
            LocalDateTime dueDate,
            String assignedStaff,
            FollowUp.Status status,
            LocalDateTime createdAt,
            LocalDateTime updatedAt) {
        this.id = id;
        this.clientId = clientId;
        this.clientName = clientName;
        this.title = title;
        this.notes = notes;
        this.dueDate = dueDate;
        this.assignedStaff = assignedStaff;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getClientId() {
        return clientId;
    }

    public String getClientName() {
        return clientName;
    }

    public String getTitle() {
        return title;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public String getAssignedStaff() {
        return assignedStaff;
    }

    public FollowUp.Status getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
