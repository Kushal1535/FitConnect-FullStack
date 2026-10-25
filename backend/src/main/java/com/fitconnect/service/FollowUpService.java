
package com.fitconnect.service;

import com.fitconnect.dto.request.CreateFollowUpRequest;
import com.fitconnect.dto.response.FollowUpResponse;
import com.fitconnect.entity.FollowUp;

import java.util.List;

public interface FollowUpService {

    FollowUpResponse createFollowUp(CreateFollowUpRequest request);

    List<FollowUpResponse> getAllFollowUps();

    FollowUpResponse getFollowUpById(Long id);

    List<FollowUpResponse> getFollowUpsByClientId(Long clientId);

    List<FollowUpResponse> getFollowUpsByStatus(FollowUp.Status status);

    FollowUpResponse updateFollowUpStatus(Long id, FollowUp.Status status);
}
