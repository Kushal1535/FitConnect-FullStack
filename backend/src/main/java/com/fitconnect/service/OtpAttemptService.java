
package com.fitconnect.service;

import com.fitconnect.repository.StaffInvitationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpAttemptService {

    private final StaffInvitationRepository invitationRepository;

    public OtpAttemptService(
            StaffInvitationRepository invitationRepository) {
        this.invitationRepository = invitationRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean recordFailedAttempt(Long invitationId) {
        return invitationRepository.incrementOtpAttempts(invitationId) == 1;
    }
}
