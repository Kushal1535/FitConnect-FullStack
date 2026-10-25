package com.fitconnect.service.impl;

import com.fitconnect.entity.MembershipPlan;
import com.fitconnect.entity.MembershipPlanStatus;
import com.fitconnect.repository.MembershipPlanRepository;
import com.fitconnect.dto.request.CreateClientRequest;
import com.fitconnect.dto.request.UpdateClientRequest;
import com.fitconnect.dto.response.ClientResponse;
import com.fitconnect.entity.Client;
import com.fitconnect.entity.ClientStatus;
import com.fitconnect.repository.ClientRepository;
import com.fitconnect.service.ClientService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final MembershipPlanRepository membershipPlanRepository;


    public ClientServiceImpl(
            ClientRepository clientRepository,
            MembershipPlanRepository membershipPlanRepository) {

        this.clientRepository = clientRepository;
        this.membershipPlanRepository = membershipPlanRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClientResponse> getAllClients() {
        return clientRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ClientResponse getClientById(Long id) {
        Client client = findClient(id);
        return toResponse(client);
    }

    @Override
    public void deleteClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Client not found with id: " + id
                ));

        clientRepository.delete(client);
    }

    @Override
    public ClientResponse createClient(CreateClientRequest request) {

    	if (clientRepository.existsByEmail(
    	        request.email().trim())) {
    	    throw new ResponseStatusException(
    	            HttpStatus.CONFLICT,
    	            "A client with this email already exists"
    	    );
    	}

        validateDates(request.startDate(), request.endDate());

        Client client = new Client();
        MembershipPlan plan = membershipPlanRepository
                .findById(request.membershipPlanId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Membership plan not found"
                ));

        if (plan.getStatus() != MembershipPlanStatus.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot assign an inactive or archived membership plan"
            );
        }

        client.setFullName(request.fullName().trim());
        client.setPhoneNumber(request.phoneNumber().trim());
        client.setEmail(request.email().trim());
        client.setMembershipPlanId(plan.getId());
        client.setMembershipPlanName(plan.getName());
        client.setStartDate(request.startDate());
        client.setEndDate(request.endDate());
        client.setStatus(request.status());
        client.setNotes(request.notes());
        client.setAssignedStaffId(request.assignedStaffId());
        client.setEmergencyContact(request.emergencyContact());

        Client savedClient = clientRepository.save(client);

        return toResponse(savedClient);
    }

    @Override
    public ClientResponse updateClient(
            Long id,
            UpdateClientRequest request) {

        Client client = findClient(id);

        var startDate = request.startDate() != null
                ? request.startDate()
                : client.getStartDate();

        var endDate = request.endDate() != null
                ? request.endDate()
                : client.getEndDate();

        validateDates(startDate, endDate);

        if (request.fullName() != null) {
            client.setFullName(request.fullName().trim());
        }

        if (request.phoneNumber() != null) {
            client.setPhoneNumber(request.phoneNumber().trim());
        }

        if (request.email() != null) {
            String newEmail = request.email().trim();

            if (clientRepository.existsByEmail(newEmail)
                    && !client.getEmail().equalsIgnoreCase(newEmail)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A client with this email already exists"
                );
            }

            client.setEmail(newEmail);
        }


if (request.membershipPlanId() != null) {
    MembershipPlan plan = membershipPlanRepository
            .findById(request.membershipPlanId())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Membership plan not found"
            ));

    if (plan.getStatus() != MembershipPlanStatus.ACTIVE) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot assign an inactive or archived membership plan"
        );
    }

    client.setMembershipPlanId(plan.getId());
    client.setMembershipPlanName(plan.getName());
}


        if (request.startDate() != null) {
            client.setStartDate(request.startDate());
        }

        if (request.endDate() != null) {
            client.setEndDate(request.endDate());
        }

        if (request.status() != null) {
            client.setStatus(request.status());
        }

        if (request.notes() != null) {
            client.setNotes(request.notes());
        }

        if (request.assignedStaffId() != null) {
            client.setAssignedStaffId(
                    request.assignedStaffId());
        }

        if (request.emergencyContact() != null) {
            client.setEmergencyContact(
                    request.emergencyContact());
        }

        Client updatedClient = clientRepository.save(client);

        return toResponse(updatedClient);
    }

    @Override
    public ClientResponse updateClientStatus(
            Long id,
            ClientStatus status) {

        Client client = findClient(id);
        client.setStatus(status);

        Client updatedClient = clientRepository.save(client);

        return toResponse(updatedClient);
    }

    private Client findClient(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Client not found with ID: " + id
                        ));
    }

    private void validateDates(
            java.time.LocalDate startDate,
            java.time.LocalDate endDate) {

        if (startDate != null
                && endDate != null
                && endDate.isBefore(startDate)) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Membership end date cannot be before start date"
            );
        }
    }

    private ClientResponse toResponse(Client client) {

        return new ClientResponse(
                client.getId(),
                client.getFullName(),
                client.getPhoneNumber(),
                client.getEmail(),
                client.getMembershipPlanId(),
                client.getMembershipPlanName() != null
                        ? client.getMembershipPlanName()
                        : "",
                client.getStartDate(),
                client.getEndDate(),
                client.getStatus(),
                client.getNotes() != null
                        ? client.getNotes()
                        : "",
                client.getAssignedStaffId(),
                client.getAssignedStaffName(),
                client.getEmergencyContact(),
                client.getCreatedAt(),
                client.getUpdatedAt()
        );
    }
}