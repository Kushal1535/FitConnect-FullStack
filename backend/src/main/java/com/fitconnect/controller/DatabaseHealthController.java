package com.fitconnect.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class DatabaseHealthController {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/health/db")
    public Map<String, String> databaseHealth() {
        jdbcTemplate.queryForObject("SELECT 1", Integer.class);

        return Map.of(
            "database", "MySQL",
            "status", "CONNECTED"
        );
    }
}