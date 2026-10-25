
package com.fitconnect.service.impl;

import java.nio.charset.StandardCharsets;

import java.util.List;

import com.fitconnect.service.StaffInvitationService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fitconnect.dto.request.CreateStaffRequest;
import com.fitconnect.dto.request.UpdateStaffRequest;
import com.fitconnect.dto.response.StaffResponse;
import com.fitconnect.entity.Staff;
import com.fitconnect.entity.User;
import com.fitconnect.repository.StaffRepository;
import com.fitconnect.repository.UserRepository;
import com.fitconnect.service.StaffService;
import com.fitconnect.dto.request.UpdateStaffDesignationRequest;

@Service
@Transactional
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final StaffInvitationService staffInvitationService;

    public StaffServiceImpl(
            StaffRepository staffRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate,
            StaffInvitationService staffInvitationService) {

        this.staffRepository = staffRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
        this.staffInvitationService = staffInvitationService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffResponse> getAllStaff() {
        return staffRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StaffResponse getStaffById(Long id) {
        return toResponse(findStaff(id));
    }

    @Override
    public StaffResponse updateStaffDesignation(
            Long id,
            UpdateStaffDesignationRequest request) {

        Staff staff = findStaff(id);
        staff.setDesignation(request.designation().trim());

        return toResponse(staffRepository.save(staff));
    }




@Override
public void createStaff(CreateStaffRequest request) {

    String email = request.email()
            .trim()
            .toLowerCase(java.util.Locale.ROOT);

    if (userRepository.existsByEmail(email)
            || staffRepository.existsByEmail(email)) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account or staff profile with this email already exists"
        );
    }

    staffInvitationService.createInvitation(
    	    request.fullName(),
    	    request.email(),
    	    request.phoneNumber(),
    	    request.designation()
    	);
}




    @Override
    public StaffResponse updateStaff(
            Long id, UpdateStaffRequest request) {
        Staff staff = findStaff(id);
        String email = request.email().trim().toLowerCase();

        staffRepository.findByEmail(email)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Another staff member already uses this email");
                });

        staff.setFullName(request.fullName().trim());
        staff.setEmail(email);
        staff.setPhoneNumber(request.phoneNumber().trim());
        staff.setRole(request.role().trim());

        return toResponse(staffRepository.save(staff));
    }

    @Override
    public StaffResponse updateStaffStatus(Long id, boolean active) {
        Staff staff = findStaff(id);
        rejectSelfRemoval(staff);

        User account = userRepository.findByEmail(
                staff.getEmail().trim().toLowerCase()
        ).orElse(null);

        if (account != null && account.getRole() != User.Role.STAFF) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The linked login account is not a STAFF account");
        }

        // Update both records within the same transaction.
        staff.setActive(active);

        if (account != null) {
            account.setActive(active);
            userRepository.save(account);
        }

        return toResponse(staffRepository.save(staff));
    }


@Override
public void deleteStaff(Long id) {
    Staff staff = findStaff(id);
    rejectSelfRemoval(staff);

    String email = staff.getEmail()
            .trim()
            .toLowerCase(java.util.Locale.ROOT);

    User account = userRepository.findByEmail(email)
            .orElse(null);

    if (account != null && account.getRole() != User.Role.STAFF) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Refusing to delete a non-STAFF login account");
    }

    if (hasForeignKeyReferences("staff", staff.getId())) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Cannot permanently delete this staff member because "
                        + "other records reference the staff profile. "
                        + "Deactivate the account instead.");
    }

    if (account != null
            && hasForeignKeyReferences("users", account.getId())) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Cannot permanently delete this staff member because "
                        + "other records reference the login account. "
                        + "Deactivate the account instead.");
    }

    // Remove old invitation records so the same email can be invited again.
    jdbcTemplate.update(
            "DELETE FROM staff_invitations WHERE LOWER(email) = LOWER(?)",
            email);

    // Delete the staff profile and login account.
    staffRepository.delete(staff);

    if (account != null) {
        userRepository.delete(account);
    }
}


    private boolean hasForeignKeyReferences(
            String referencedTable, Long referencedId) {

        List<String[]> references = jdbcTemplate.query(
                """
                SELECT TABLE_NAME, COLUMN_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
                  AND REFERENCED_TABLE_NAME = ?
                  AND REFERENCED_COLUMN_NAME = 'id'
                """,
                (rs, rowNum) -> new String[] {
                        rs.getString("TABLE_NAME"),
                        rs.getString("COLUMN_NAME")
                },
                referencedTable
        );

        for (String[] reference : references) {
            String table = quoteIdentifier(reference[0]);
            String column = quoteIdentifier(reference[1]);

            Long count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM " + table
                            + " WHERE " + column + " = ?",
                    Long.class,
                    referencedId
            );

            if (count != null && count > 0) {
                return true;
            }
        }

        return false;
    }

    private String quoteIdentifier(String identifier) {
        // Only database metadata supplies identifiers to this method.
        return "`" + identifier.replace("`", "``") + "`";
    }

    private void rejectSelfRemoval(Staff staff) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getName() != null
                && authentication.getName().equalsIgnoreCase(
                        staff.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You cannot deactivate or delete your own account");
        }
    }

    private Staff findStaff(Long id) {
        return staffRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Staff member not found with ID: " + id));
    }

    private StaffResponse toResponse(Staff staff) {
        return new StaffResponse(
                staff.getId(),
                staff.getFullName(),
                staff.getEmail(),
                staff.getPhoneNumber(),
                staff.getRole(),
                staff.getDesignation(),
                staff.isActive(),
                staff.getCreatedAt(),
                staff.getUpdatedAt()
        );
    }
}
