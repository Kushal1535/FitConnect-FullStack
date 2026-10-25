
package com.fitconnect.service;

import com.fitconnect.dto.request.CreateStaffRequest;
import com.fitconnect.dto.request.UpdateStaffRequest;
import com.fitconnect.dto.response.StaffResponse;

import com.fitconnect.dto.request.UpdateStaffDesignationRequest;

import java.util.List;

public interface StaffService {

    List<StaffResponse> getAllStaff();

    StaffResponse getStaffById(Long id);

    void createStaff(CreateStaffRequest request);

    StaffResponse updateStaff(Long id, UpdateStaffRequest request);

    StaffResponse updateStaffStatus(Long id, boolean active);

    StaffResponse updateStaffDesignation(
            Long id,
            UpdateStaffDesignationRequest request
    );

    void deleteStaff(Long id);
}
