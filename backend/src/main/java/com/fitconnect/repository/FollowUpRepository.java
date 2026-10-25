
package com.fitconnect.repository;

import com.fitconnect.entity.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FollowUpRepository
        extends JpaRepository<FollowUp, Long> {

    List<FollowUp> findByClientIdOrderByDueDateAsc(Long clientId);

    List<FollowUp> findByStatusOrderByDueDateAsc(
            FollowUp.Status status);

    List<FollowUp> findAllByOrderByDueDateAsc();

    long countByStatus(FollowUp.Status status);

}
