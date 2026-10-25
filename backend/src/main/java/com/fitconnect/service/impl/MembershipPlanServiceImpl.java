
package com.fitconnect.service.impl;

import com.fitconnect.dto.request.MembershipPlanRequest;
import com.fitconnect.dto.response.MembershipPlanResponse;
import com.fitconnect.entity.MembershipPlan;
import com.fitconnect.repository.MembershipPlanRepository;
import com.fitconnect.service.MembershipPlanService;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.fitconnect.entity.ClientStatus;
import com.fitconnect.repository.ClientRepository;

import java.util.List;

@Service
@Transactional
public class MembershipPlanServiceImpl
        implements MembershipPlanService {

	private final MembershipPlanRepository repository;
	private final ClientRepository clientRepository;

	public MembershipPlanServiceImpl(
	        MembershipPlanRepository repository,
	        ClientRepository clientRepository) {
	    this.repository = repository;
	    this.clientRepository = clientRepository;
	}

    @Override
    @Transactional(readOnly = true)
    public List<MembershipPlanResponse> getAllPlans() {
        return repository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MembershipPlanResponse getPlanById(Long id) {
        return toResponse(findPlan(id));
    }

    @Override
    public MembershipPlanResponse createPlan(
            MembershipPlanRequest request) {

        validateDuration(request);

        MembershipPlan plan = new MembershipPlan();
        applyRequest(plan, request);

        return toResponse(repository.save(plan));
    }

    @Override
    public MembershipPlanResponse updatePlan(
            Long id, MembershipPlanRequest request) {

        validateDuration(request);

        MembershipPlan plan = findPlan(id);
        applyRequest(plan, request);

        return toResponse(repository.save(plan));
    }


@Override
public void deletePlan(Long id) {
    MembershipPlan plan = findPlan(id);

    if (clientRepository.existsByMembershipPlanId(id)) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Cannot delete membership plan because clients are assigned to it"
        );
    }

    repository.delete(plan);
}


    private MembershipPlan findPlan(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Membership plan not found: " + id));
    }

    private void validateDuration(MembershipPlanRequest request) {
        if (request.durationDays() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Duration must be greater than zero");
        }
    }

    private void applyRequest(
            MembershipPlan plan,
            MembershipPlanRequest request) {

        plan.setName(request.name());
        plan.setDurationDays(request.durationDays());
        plan.setPrice(request.price());
        plan.setDescription(request.description());
        plan.setFeatures(request.features());
        plan.setStatus(request.status());
    }


private MembershipPlanResponse toResponse(
        MembershipPlan plan) {

    long activeMembersCount =
            clientRepository.countByMembershipPlanIdAndStatus(
                    plan.getId(),
                    ClientStatus.ACTIVE
            );

    return new MembershipPlanResponse(
            plan.getId(),
            plan.getName(),
            plan.getDurationDays(),
            plan.getPrice(),
            plan.getDescription(),
            plan.getFeatures(),
            plan.getStatus(),
            activeMembersCount,
            plan.getCreatedAt(),
            plan.getUpdatedAt()
    );
}

}
