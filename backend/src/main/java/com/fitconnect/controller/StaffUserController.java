
package com.fitconnect.controller;

import com.fitconnect.dto.request.CreateStaffUserRequest;
import com.fitconnect.entity.User;
import com.fitconnect.service.UserService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/staff-users")
public class StaffUserController {

    private final UserService userService;

    public StaffUserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createStaffUser(
            @Valid @RequestBody CreateStaffUserRequest request) {

        User user = userService.createStaffUser(request);

        return Map.of(
                "id", user.getId(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "active", user.isActive()
        );
    }
}
