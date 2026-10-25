
package com.fitconnect.dto.response;

import java.time.LocalDateTime;

public class CommunicationResponse {

    private Long id;
    private Long clientId;
    private String clientName;
    private String channel;
    private String subject;
    private String message;
    private String status;
    private LocalDateTime sentAt;
    private String sentBy;

    public CommunicationResponse() {
    }

    public CommunicationResponse(
            Long id,
            Long clientId,
            String clientName,
            String channel,
            String subject,
            String message,
            String status,
            LocalDateTime sentAt,
            String sentBy) {
        this.id = id;
        this.clientId = clientId;
        this.clientName = clientName;
        this.channel = channel;
        this.subject = subject;
        this.message = message;
        this.status = status;
        this.sentAt = sentAt;
        this.sentBy = sentBy;
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

    public String getChannel() {
        return channel;
    }

    public String getSubject() {
        return subject;
    }

    public String getMessage() {
        return message;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getSentAt() {
        return sentAt;
    }

    public String getSentBy() {
        return sentBy;
    }
}
