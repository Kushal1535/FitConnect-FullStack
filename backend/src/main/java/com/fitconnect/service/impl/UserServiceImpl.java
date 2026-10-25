
package com.fitconnect.service.impl;

import com.fitconnect.dto.request.UserRegistrationRequest;
import com.fitconnect.entity.User;
import com.fitconnect.repository.UserRepository;
import com.fitconnect.service.UserService;

import com.fitconnect.dto.request.CreateStaffUserRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User createAdmin(UserRegistrationRequest request) {
        return createUser(request, User.Role.ADMIN);
    }

    @Override
    public User createStaffUser(UserRegistrationRequest request) {
        return createUser(request, User.Role.STAFF);
    }


@Override
@Transactional
public User createStaffUser(CreateStaffUserRequest request) {

    String fullName = request.fullName().trim();
    String email = request.email().trim().toLowerCase();
    String password = request.password();

    if (password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Password must not exceed 72 UTF-8 bytes."
        );
    }

    if (userRepository.existsByEmail(email)) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "An account with this email already exists."
        );
    }

    User staffUser = new User();
    staffUser.setFullName(fullName);
    staffUser.setEmail(email);
    staffUser.setPassword(passwordEncoder.encode(password));
    staffUser.setRole(User.Role.STAFF);
    staffUser.setActive(true);

    return userRepository.save(staffUser);
}


    private User createUser(
            UserRegistrationRequest request,
            User.Role role) {

        String email = request.email().trim().toLowerCase();
        String password = request.password();

        if (password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must not exceed 72 bytes"
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists"
            );
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActive(true);

        return userRepository.save(user);
    }
}
