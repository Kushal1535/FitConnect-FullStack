
package com.fitconnect.controller;

import com.fitconnect.dto.request.VerifyStaffInvitationRequest;
import com.fitconnect.dto.request.CompleteStaffInvitationRequest;
import com.fitconnect.service.StaffInvitationService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/staff-invitations")
public class StaffInvitationController {

    private final StaffInvitationService invitationService;

    public StaffInvitationController(
            StaffInvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(
            @Valid @RequestBody VerifyStaffInvitationRequest request) {

        invitationService.verifyInvitationOtp(
                request.token(),
                request.otp());

        return ResponseEntity.ok(
                "Email verified successfully. You can now create your password.");
    }

    @PostMapping("/complete")
    public ResponseEntity<String> completeInvitation(
            @Valid @RequestBody CompleteStaffInvitationRequest request) {

        invitationService.completeInvitation(
                request.token(),
                request.password()
        );

        return ResponseEntity.ok(
                "Staff registration completed. You can now log in."
        );
    }
}
