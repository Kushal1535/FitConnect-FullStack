package com.fitconnect.controller;

import com.fitconnect.dto.request.CreateClientRequest;

import com.fitconnect.dto.request.UpdateClientRequest;
import com.fitconnect.dto.request.UpdateClientStatusRequest;
import com.fitconnect.dto.response.ClientResponse;
import com.fitconnect.service.ClientService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    @GetMapping
    public List<ClientResponse> getAllClients() {
        return clientService.getAllClients();
    }

    @GetMapping("/{id}")
    public ClientResponse getClientById(
            @PathVariable Long id) {
        return clientService.getClientById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClientResponse createClient(
            @Valid @RequestBody CreateClientRequest request) {
        return clientService.createClient(request);
    }

    @PutMapping("/{id}")
    public ClientResponse updateClient(
            @PathVariable Long id,
            @Valid @RequestBody UpdateClientRequest request) {
        return clientService.updateClient(id, request);
    }

    @PatchMapping("/{id}/status")
    public ClientResponse updateClientStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateClientStatusRequest request) {
        return clientService.updateClientStatus(
                id, request.status());
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }
}