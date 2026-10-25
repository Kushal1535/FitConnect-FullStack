
package com.fitconnect.controller;

import com.fitconnect.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test/email")
public class EmailTestController {

    private final EmailService emailService;

    public EmailTestController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<String> sendTestEmail(
            @RequestParam String to,
            Authentication authentication) {

        // Allow only an authenticated ADMIN.
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getAuthorities().stream()
                    .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only an authenticated Admin can send a test email.");
        }

        if (to == null || to.isBlank() || !to.contains("@")) {
            return ResponseEntity.badRequest()
                    .body("Please provide a valid recipient email address.");
        }

        emailService.sendEmail(
                to.trim(),
                "FitConnect SMTP Test",
                "Hello! This is a test email from FitConnect.\n\n"
                        + "If you received this message, email sending is working."
        );

        return ResponseEntity.ok("Test email submitted successfully.");
    }
}
