
package com.fitconnect.service.impl;

import com.fitconnect.dto.request.CreateFollowUpRequest;
import com.fitconnect.dto.response.FollowUpResponse;
import com.fitconnect.entity.Client;
import com.fitconnect.entity.FollowUp;
import com.fitconnect.repository.ClientRepository;
import com.fitconnect.repository.FollowUpRepository;
import com.fitconnect.service.FollowUpService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class FollowUpServiceImpl implements FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final ClientRepository clientRepository;

    public FollowUpServiceImpl(
            FollowUpRepository followUpRepository,
            ClientRepository clientRepository) {
        this.followUpRepository = followUpRepository;
        this.clientRepository = clientRepository;
    }

    @Override
    public FollowUpResponse createFollowUp(CreateFollowUpRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Client not found"));

        FollowUp followUp = new FollowUp();
        followUp.setClientId(client.getId());
        followUp.setClientName(client.getFullName());
        followUp.setTitle(request.getTitle().trim());
        followUp.setNotes(request.getNotes());
        followUp.setDueDate(request.getDueDate());
        followUp.setAssignedStaff(request.getAssignedStaff().trim());
        followUp.setStatus(FollowUp.Status.PENDING);

        return toResponse(followUpRepository.save(followUp));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowUpResponse> getAllFollowUps() {
        return followUpRepository.findAllByOrderByDueDateAsc()
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public FollowUpResponse getFollowUpById(Long id) {
        return toResponse(findFollowUp(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowUpResponse> getFollowUpsByClientId(Long clientId) {
        if (!clientRepository.existsById(clientId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Client not found");
        }

        return followUpRepository.findByClientIdOrderByDueDateAsc(clientId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowUpResponse> getFollowUpsByStatus(
            FollowUp.Status status) {
        return followUpRepository.findByStatusOrderByDueDateAsc(status)
                .stream().map(this::toResponse).toList();
    }

    @Override
    public FollowUpResponse updateFollowUpStatus(
            Long id, FollowUp.Status status) {
        FollowUp followUp = findFollowUp(id);
        followUp.setStatus(status);

        return toResponse(followUpRepository.save(followUp));
    }

    private FollowUp findFollowUp(Long id) {
        return followUpRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Follow-up not found"));
    }

    private FollowUpResponse toResponse(FollowUp followUp) {
        return new FollowUpResponse(
                followUp.getId(),
                followUp.getClientId(),
                followUp.getClientName(),
                followUp.getTitle(),
                followUp.getNotes(),
                followUp.getDueDate(),
                followUp.getAssignedStaff(),
                followUp.getStatus(),
                followUp.getCreatedAt(),
                followUp.getUpdatedAt()
        );
    }
}
