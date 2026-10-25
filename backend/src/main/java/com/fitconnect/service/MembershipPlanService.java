
package com.fitconnect.service;

import com.fitconnect.dto.request.MembershipPlanRequest;
import com.fitconnect.dto.response.MembershipPlanResponse;

import java.util.List;

public interface MembershipPlanService {

    List<MembershipPlanResponse> getAllPlans();

    MembershipPlanResponse getPlanById(Long id);

    MembershipPlanResponse createPlan(MembershipPlanRequest request);

    MembershipPlanResponse updatePlan(
        Long id,
        MembershipPlanRequest request
    );

    void deletePlan(Long id);
}
