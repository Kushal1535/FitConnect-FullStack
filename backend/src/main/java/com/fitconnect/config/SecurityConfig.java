
package com.fitconnect.config;

import com.fitconnect.security.JwtAuthenticationFilter;




import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import jakarta.servlet.DispatcherType;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> {})
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(exception -> exception
            	    .authenticationEntryPoint((request, response, authException) ->
            	        response.sendError(HttpServletResponse.SC_UNAUTHORIZED)
            	    )
            	    .accessDeniedHandler((request, response, accessDeniedException) ->
            	        response.sendError(HttpServletResponse.SC_FORBIDDEN)
            	    )
            	)
            .authorizeHttpRequests(auth -> auth

.requestMatchers("/api/auth/login").permitAll()
.requestMatchers("/api/health", "/api/health/db").permitAll()

// Public endpoints for invited staff
.requestMatchers(
    HttpMethod.POST,
    "/api/staff-invitations/verify-otp"
).permitAll()

// Existing staff-management endpoints remain Admin-only
//Public endpoints for invited staff
.requestMatchers(
 HttpMethod.POST,
 "/api/staff-invitations/verify-otp",
 "/api/staff-invitations/complete"
).permitAll()

//Existing staff-management endpoints remain Admin-only
.requestMatchers("/api/staff/**").hasRole("ADMIN")

.requestMatchers("/api/admin/**").hasRole("ADMIN")

.requestMatchers("/api/membership-plans/**")
 .hasRole("ADMIN")

.requestMatchers(HttpMethod.GET, "/api/clients/**")
    .hasAnyRole("ADMIN", "STAFF")
.requestMatchers(HttpMethod.POST, "/api/clients/**")
    .hasAnyRole("ADMIN", "STAFF")
.requestMatchers(HttpMethod.PUT, "/api/clients/**")
    .hasAnyRole("ADMIN", "STAFF")
.requestMatchers(HttpMethod.PATCH, "/api/clients/**")
    .hasAnyRole("ADMIN", "STAFF")
.requestMatchers(HttpMethod.DELETE, "/api/clients/**")
    .hasRole("ADMIN")

.requestMatchers("/api/follow-ups/**")
    .hasAnyRole("ADMIN", "STAFF")

.requestMatchers("/api/communications/**")
    .hasAnyRole("ADMIN", "STAFF")

                .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
