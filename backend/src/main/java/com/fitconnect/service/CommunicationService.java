
package com.fitconnect.service;

import com.fitconnect.dto.request.CreateCommunicationRequest;
import com.fitconnect.dto.response.CommunicationResponse;

import java.util.List;

public interface CommunicationService {

    CommunicationResponse createCommunication(
            CreateCommunicationRequest request,
            String sentBy);

    List<CommunicationResponse> getAllCommunications();

    CommunicationResponse getCommunicationById(Long id);

    List<CommunicationResponse> getCommunicationsByClientId(
            Long clientId);
}
