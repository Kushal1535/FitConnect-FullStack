
package com.fitconnect.service.impl;

import com.fitconnect.dto.response.DashboardSummaryResponse;
import com.fitconnect.entity.ClientStatus;
import com.fitconnect.entity.FollowUp;
import com.fitconnect.repository.ClientRepository;
import com.fitconnect.repository.CommunicationRepository;
import com.fitconnect.repository.FollowUpRepository;
import com.fitconnect.service.DashboardService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final ClientRepository clientRepository;
    private final FollowUpRepository followUpRepository;
    private final CommunicationRepository communicationRepository;

    public DashboardServiceImpl(
            ClientRepository clientRepository,
            FollowUpRepository followUpRepository,
            CommunicationRepository communicationRepository) {
        this.clientRepository = clientRepository;
        this.followUpRepository = followUpRepository;
        this.communicationRepository = communicationRepository;
    }

    @Override
    public DashboardSummaryResponse getDashboardSummary() {

        long totalClients = clientRepository.count();

        long activeMemberships =
                clientRepository.countByStatusAndEndDateGreaterThanEqual(
                        ClientStatus.ACTIVE,
                        LocalDate.now()
                );

        long pendingFollowUps =
                followUpRepository.countByStatus(
                        FollowUp.Status.PENDING
                );

        long totalCommunications = communicationRepository.count();

        return new DashboardSummaryResponse(
                totalClients,
                activeMemberships,
                pendingFollowUps,
                totalCommunications
        );
    }
}
