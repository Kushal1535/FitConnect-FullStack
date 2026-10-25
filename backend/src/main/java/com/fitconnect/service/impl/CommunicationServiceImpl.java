
package com.fitconnect.service.impl;

import com.fitconnect.dto.request.CreateCommunicationRequest;
import com.fitconnect.dto.response.CommunicationResponse;
import com.fitconnect.entity.Client;
import com.fitconnect.entity.Communication;
import com.fitconnect.repository.ClientRepository;
import com.fitconnect.repository.CommunicationRepository;
import com.fitconnect.service.CommunicationService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class CommunicationServiceImpl implements CommunicationService {

    private final CommunicationRepository communicationRepository;
    private final ClientRepository clientRepository;

    public CommunicationServiceImpl(
            CommunicationRepository communicationRepository,
            ClientRepository clientRepository) {
        this.communicationRepository = communicationRepository;
        this.clientRepository = clientRepository;
    }

    @Override
    public CommunicationResponse createCommunication(
            CreateCommunicationRequest request,
            String sentBy) {

        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Client not found"));

        String channel = request.getChannel()
                .trim().toUpperCase(Locale.ROOT);

        if (!List.of("EMAIL", "SMS", "WHATSAPP", "IN_APP")
                .contains(channel)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Channel must be EMAIL, SMS, WHATSAPP, or IN_APP");
        }

        Communication communication = new Communication();
        communication.setClientId(client.getId());
        communication.setClientName(client.getFullName());
        communication.setChannel(channel);
        communication.setSubject(request.getSubject().trim());
        communication.setMessage(request.getMessage().trim());
        communication.setStatus("SENT");
        communication.setSentBy(sentBy);

        Communication saved =
                communicationRepository.save(communication);

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommunicationResponse> getAllCommunications() {
        return communicationRepository.findAllByOrderBySentAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CommunicationResponse getCommunicationById(Long id) {
        Communication communication = communicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Communication not found"));

        return toResponse(communication);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommunicationResponse> getCommunicationsByClientId(
            Long clientId) {

        if (!clientRepository.existsById(clientId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Client not found");
        }

        return communicationRepository
                .findByClientIdOrderBySentAtDesc(clientId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private CommunicationResponse toResponse(
            Communication communication) {

        return new CommunicationResponse(
                communication.getId(),
                communication.getClientId(),
                communication.getClientName(),
                communication.getChannel(),
                communication.getSubject(),
                communication.getMessage(),
                communication.getStatus(),
                communication.getSentAt(),
                communication.getSentBy());
    }
}
