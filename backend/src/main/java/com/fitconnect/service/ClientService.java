package com.fitconnect.service;

import com.fitconnect.dto.request.CreateClientRequest;
import com.fitconnect.dto.request.UpdateClientRequest;
import com.fitconnect.dto.response.ClientResponse;
import com.fitconnect.entity.ClientStatus;

import java.util.List;

public interface ClientService {

    List<ClientResponse> getAllClients();

    void deleteClient(Long id);

    ClientResponse getClientById(Long id);

    ClientResponse createClient(CreateClientRequest request);

    ClientResponse updateClient(
        Long id,
        UpdateClientRequest request
    );

    ClientResponse updateClientStatus(
        Long id,
        ClientStatus status
    );
}