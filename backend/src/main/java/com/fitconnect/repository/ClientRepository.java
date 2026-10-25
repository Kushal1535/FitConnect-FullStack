package com.fitconnect.repository;

import com.fitconnect.entity.Client;

import com.fitconnect.entity.ClientStatus;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClientRepository
        extends JpaRepository<Client, Long> {

	long countByMembershipPlanIdAndStatus(
	        Long membershipPlanId,
	        ClientStatus status
	);

	boolean existsByMembershipPlanId(Long membershipPlanId);

	long countByStatus(ClientStatus status);

	long countByStatusAndEndDateGreaterThanEqual(
	        ClientStatus status,
	        LocalDate endDate
	);
	boolean existsByEmail(String email);
}