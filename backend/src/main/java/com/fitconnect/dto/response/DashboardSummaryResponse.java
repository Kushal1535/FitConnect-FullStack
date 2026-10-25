
package com.fitconnect.dto.response;

public record DashboardSummaryResponse(
        long totalClients,
        long activeMemberships,
        long pendingFollowUps,
        long totalCommunications
) {}


