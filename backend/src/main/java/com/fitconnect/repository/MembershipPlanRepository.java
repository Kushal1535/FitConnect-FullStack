
package com.fitconnect.repository;

import com.fitconnect.entity.MembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembershipPlanRepository
        extends JpaRepository<MembershipPlan, Long> {
}
