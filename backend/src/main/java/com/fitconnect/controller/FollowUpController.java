
package com.fitconnect.controller;

import com.fitconnect.dto.request.CreateFollowUpRequest;

import com.fitconnect.dto.request.UpdateFollowUpStatusRequest;
import com.fitconnect.dto.response.FollowUpResponse;
import com.fitconnect.entity.FollowUp;
import com.fitconnect.service.FollowUpService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/follow-ups")
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FollowUpResponse createFollowUp(
            @Valid @RequestBody CreateFollowUpRequest request) {
        return followUpService.createFollowUp(request);
    }

    @GetMapping
    public List<FollowUpResponse> getAllFollowUps() {
        return followUpService.getAllFollowUps();
    }

    @GetMapping("/{id}")
    public FollowUpResponse getFollowUpById(@PathVariable Long id) {
        return followUpService.getFollowUpById(id);
    }

    @GetMapping("/client/{clientId}")
    public List<FollowUpResponse> getFollowUpsByClientId(
            @PathVariable Long clientId) {
        return followUpService.getFollowUpsByClientId(clientId);
    }

    @GetMapping("/status/{status}")
    public List<FollowUpResponse> getFollowUpsByStatus(
            @PathVariable FollowUp.Status status) {
        return followUpService.getFollowUpsByStatus(status);
    }

    @PatchMapping("/{id}/status")
    public FollowUpResponse updateFollowUpStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFollowUpStatusRequest request) {
        return followUpService.updateFollowUpStatus(
                id, request.getStatus());
    }
}
