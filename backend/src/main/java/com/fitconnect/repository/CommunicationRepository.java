
package com.fitconnect.repository;

import com.fitconnect.entity.Communication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunicationRepository
        extends JpaRepository<Communication, Long> {

    List<Communication> findByClientIdOrderBySentAtDesc(Long clientId);

    List<Communication> findAllByOrderBySentAtDesc();
}
