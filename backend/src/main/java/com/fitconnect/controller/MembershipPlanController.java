
package com.fitconnect.controller;

import com.fitconnect.dto.request.MembershipPlanRequest;
import com.fitconnect.dto.response.MembershipPlanResponse;
import com.fitconnect.service.MembershipPlanService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/membership-plans")
public class MembershipPlanController {

    private final MembershipPlanService membershipPlanService;

    public MembershipPlanController(
            MembershipPlanService membershipPlanService) {
        this.membershipPlanService = membershipPlanService;
    }

    @GetMapping
    public List<MembershipPlanResponse> getAllPlans() {
        return membershipPlanService.getAllPlans();
    }

    @GetMapping("/{id}")
    public MembershipPlanResponse getPlanById(
            @PathVariable Long id) {
        return membershipPlanService.getPlanById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MembershipPlanResponse createPlan(
            @Valid @RequestBody MembershipPlanRequest request) {
        return membershipPlanService.createPlan(request);
    }

    @PutMapping("/{id}")
    public MembershipPlanResponse updatePlan(
            @PathVariable Long id,
            @Valid @RequestBody MembershipPlanRequest request) {
        return membershipPlanService.updatePlan(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePlan(@PathVariable Long id) {
        membershipPlanService.deletePlan(id);
    }
}
