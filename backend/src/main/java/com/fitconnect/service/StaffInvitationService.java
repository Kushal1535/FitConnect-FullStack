package com.fitconnect.service;

import com.fitconnect.entity.Staff;
import com.fitconnect.entity.StaffInvitation;
import com.fitconnect.entity.User;
import com.fitconnect.repository.StaffInvitationRepository;
import com.fitconnect.repository.StaffRepository;
import com.fitconnect.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class StaffInvitationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final int MAX_OTP_ATTEMPTS = 5;

    private final StaffInvitationRepository invitationRepository;
    private final EmailService emailService;
    private final OtpAttemptService otpAttemptService;
    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String invitationBaseUrl;

    public StaffInvitationService(
            StaffInvitationRepository invitationRepository,
            EmailService emailService,
            OtpAttemptService otpAttemptService,
            StaffRepository staffRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${fitconnect.invitation.base-url}")
            String invitationBaseUrl) {

        this.invitationRepository = invitationRepository;
        this.emailService = emailService;
        this.otpAttemptService = otpAttemptService;
        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.invitationBaseUrl = invitationBaseUrl;
    }

    /**
     * Creates or refreshes a staff invitation.
     * No Staff or User account is created at this stage.
     */
    @Transactional
    public void createInvitation(
            String fullName,
            String email,
            String phoneNumber,
            String designation) {

        if (fullName == null || fullName.isBlank()
                || email == null || email.isBlank()
                || phoneNumber == null || phoneNumber.isBlank()
                || designation == null || designation.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Name, email, phone number and designation are required");
        }

        String normalizedName = fullName.trim();
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String normalizedPhone = phoneNumber.trim();
        String normalizedDesignation = designation.trim();

        if (normalizedName.length() > 100
                || normalizedEmail.length() > 150
                || normalizedPhone.length() > 20
                || normalizedDesignation.length() > 100) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "One or more fields exceed the allowed length");
        }

        if (userRepository.existsByEmail(normalizedEmail)
                || staffRepository.existsByEmail(normalizedEmail)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account already exists for this email");
        }

        // Reuse the existing row because invitation email is unique.
        // Replacing its token invalidates any previously issued link.
        StaffInvitation invitation = invitationRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(StaffInvitation::new);

        String rawToken = generateToken();
        String otp = generateOtp();
        LocalDateTime now = LocalDateTime.now();

        invitation.setFullName(normalizedName);
        invitation.setEmail(normalizedEmail);
        invitation.setPhoneNumber(normalizedPhone);
        invitation.setDesignation(normalizedDesignation);

        invitation.setTokenHash(sha256(rawToken));
        invitation.setOtpHash(sha256(otp));

        invitation.setExpiresAt(now.plusHours(24));
        invitation.setOtpExpiresAt(now.plusMinutes(10));
        invitation.setLastOtpSentAt(now);

        invitation.setOtpAttempts(0);
        invitation.setVerified(false);
        invitation.setUsed(false);

        invitationRepository.saveAndFlush(invitation);

        String invitationLink = invitationBaseUrl + "?token=" + rawToken;

        String emailBody = """
                Hello %s,

                You have been invited to join FitConnect.

                Name: %s
                Professional Designation: %s

                Open your invitation link:
                %s

                Your six-digit verification code is: %s

                The OTP expires in 10 minutes.
                The invitation expires in 24 hours.

                If you did not expect this invitation, please ignore this email.

                FitConnect Team
                """.formatted(
                    normalizedName,
                    normalizedName,
                    normalizedDesignation,
                    invitationLink,
                    otp
                );

        emailService.sendEmail(
                normalizedEmail,
                "Your FitConnect Staff Invitation",
                emailBody);
    }

    /**
     * Verifies the six-digit OTP sent to the invitee's email.
     */
    @Transactional
    public void verifyInvitationOtp(
            String rawToken,
            String submittedOtp) {

        if (rawToken == null || rawToken.isBlank()
                || submittedOtp == null
                || !submittedOtp.matches("^[0-9]{6}$")) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid invitation or OTP");
        }

        String tokenHash = sha256(rawToken);

        StaffInvitation invitation = invitationRepository
                .findByTokenHashAndUsedFalse(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid or expired invitation"));

        LocalDateTime now = LocalDateTime.now();

        if (invitation.isVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This invitation has already been verified");
        }

        if (invitation.getExpiresAt() == null
                || !now.isBefore(invitation.getExpiresAt())
                || invitation.getOtpExpiresAt() == null
                || !now.isBefore(invitation.getOtpExpiresAt())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invitation or OTP has expired");
        }

        if (invitation.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Too many OTP attempts. Request a new invitation");
        }

        String storedOtpHash = invitation.getOtpHash();

        boolean otpMatches = storedOtpHash != null
                && MessageDigest.isEqual(
                        sha256(submittedOtp).getBytes(StandardCharsets.UTF_8),
                        storedOtpHash.getBytes(StandardCharsets.UTF_8));

        if (!otpMatches) {
            // Uses the separate transaction in OtpAttemptService so
            // failed attempts are recorded even when this method throws.
            boolean recorded = otpAttemptService.recordFailedAttempt(
                    invitation.getId());

            if (!recorded) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Too many OTP attempts. Request a new invitation");
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Incorrect OTP");
        }

        invitation.setVerified(true);
        invitationRepository.save(invitation);
    }

    /**
     * Completes registration after successful OTP verification.
     * Creates the Staff and User records only at this stage.
     */
    @Transactional
    public void completeInvitation(
            String rawToken,
            String rawPassword) {

        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid invitation");
        }

        if (rawPassword == null
                || rawPassword.length() < 8
                || rawPassword.getBytes(StandardCharsets.UTF_8).length > 72) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must be at least 8 characters and no more than 72 UTF-8 bytes");
        }

        String tokenHash = sha256(rawToken);

        StaffInvitation invitation = invitationRepository
                .findByTokenHashAndUsedFalse(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid or expired invitation"));

        LocalDateTime now = LocalDateTime.now();

        if (!invitation.isVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Verify your email OTP before creating your account");
        }

        if (invitation.getExpiresAt() == null
                || !now.isBefore(invitation.getExpiresAt())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invitation has expired");
        }

        String email = invitation.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)
                || staffRepository.existsByEmail(email)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account already exists for this email");
        }

        // Create the staff profile with the admin-entered designation.
        Staff staff = new Staff();
        staff.setFullName(invitation.getFullName());
        staff.setEmail(email);
        staff.setPhoneNumber(invitation.getPhoneNumber());
        staff.setDesignation(invitation.getDesignation());

        // System role remains STAFF, regardless of designation.
        staff.setRole("STAFF");

        staffRepository.saveAndFlush(staff);

        // Create login credentials only after invitation verification.
        User user = new User();
        user.setFullName(invitation.getFullName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(User.Role.STAFF);
        user.setActive(true);
        user.setEmailVerified(true);

        userRepository.saveAndFlush(user);

        invitation.setUsed(true);
        invitationRepository.save(invitation);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    private String generateOtp() {
        return String.format(
                Locale.ROOT,
                "%06d",
                SECURE_RANDOM.nextInt(1_000_000));
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hash);

        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to securely hash invitation data",
                    ex);
        }
    }
}