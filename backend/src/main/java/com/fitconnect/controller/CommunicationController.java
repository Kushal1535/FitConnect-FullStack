
package com.fitconnect.controller;

import com.fitconnect.dto.request.CreateCommunicationRequest;
import com.fitconnect.dto.response.CommunicationResponse;
import com.fitconnect.service.CommunicationService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/communications")
public class CommunicationController {

    private final CommunicationService communicationService;

    public CommunicationController(
            CommunicationService communicationService) {
        this.communicationService = communicationService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CommunicationResponse createCommunication(
            @Valid @RequestBody CreateCommunicationRequest request,
            Authentication authentication) {

        return communicationService.createCommunication(
                request, authentication.getName());
    }

    @GetMapping
    public List<CommunicationResponse> getAllCommunications() {
        return communicationService.getAllCommunications();
    }

    @GetMapping("/{id}")
    public CommunicationResponse getCommunicationById(
            @PathVariable Long id) {
        return communicationService.getCommunicationById(id);
    }

    @GetMapping("/client/{clientId}")
    public List<CommunicationResponse> getCommunicationsByClientId(
            @PathVariable Long clientId) {
        return communicationService.getCommunicationsByClientId(clientId);
    }
}
