
package com.fitconnect.repository;

import com.fitconnect.entity.StaffInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface StaffInvitationRepository
        extends JpaRepository<StaffInvitation, Long> {

    Optional<StaffInvitation> findByTokenHash(String tokenHash);

    Optional<StaffInvitation> findByTokenHashAndUsedFalse(String tokenHash);

    boolean existsByEmailAndUsedFalse(String email);

    Optional<StaffInvitation> findByEmailIgnoreCase(String email);

    @Modifying
    @Query("""
        update StaffInvitation s
        set s.otpAttempts = s.otpAttempts + 1
        where s.id = :id
          and s.verified = false
          and s.used = false
          and s.otpAttempts < 5
    """)
    int incrementOtpAttempts(@Param("id") Long id);
}
