
package com.fitconnect.setup;

import com.fitconnect.entity.User;
import com.fitconnect.repository.UserRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("admin-setup")
public class AdminSetupRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${fitconnect.admin.name}")
    private String adminName;

    @Value("${fitconnect.admin.email}")
    private String adminEmail;

    @Value("${fitconnect.admin.password}")
    private String adminPassword;

    public AdminSetupRunner(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String email = adminEmail.trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException(
                    "An account with this email already exists. "
                    + "Admin setup stopped without making changes."
            );
        }

        boolean adminExists = userRepository.findAll()
                .stream()
                .anyMatch(user -> user.getRole() == User.Role.ADMIN);

        if (adminExists) {
            throw new IllegalStateException(
                    "An ADMIN account already exists. Setup stopped."
            );
        }

        if (adminPassword.getBytes(
                java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException(
                    "Admin password must not exceed 72 bytes."
            );
        }

        User admin = new User();
        admin.setFullName(adminName.trim());
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(User.Role.ADMIN);
        admin.setActive(true);

        userRepository.save(admin);

        System.out.println(
                "Initial ADMIN account created successfully."
        );
    }
}
