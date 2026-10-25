
package com.fitconnect.controller;

import com.fitconnect.dto.request.CreateStaffRequest;
import com.fitconnect.dto.request.UpdateStaffRequest;
import com.fitconnect.dto.request.UpdateStaffDesignationRequest;
import com.fitconnect.dto.response.StaffResponse;
import com.fitconnect.service.StaffService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasRole('ADMIN')")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public List<StaffResponse> getAllStaff() {
        return staffService.getAllStaff();
    }

    @GetMapping("/{id}")
    public StaffResponse getStaffById(@PathVariable Long id) {
        return staffService.getStaffById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void createStaff(
            @Valid @RequestBody CreateStaffRequest request) {
        staffService.createStaff(request);
    }

    @PutMapping("/{id}")
    public StaffResponse updateStaff(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffRequest request) {
        return staffService.updateStaff(id, request);
    }

    @PatchMapping("/{id}/designation")
    public StaffResponse updateStaffDesignation(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStaffDesignationRequest request) {
        return staffService.updateStaffDesignation(id, request);
    }

    @PatchMapping("/{id}/status")
    public StaffResponse updateStaffStatus(
            @PathVariable Long id,
            @RequestParam boolean active) {
        return staffService.updateStaffStatus(id, active);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
    }
}
