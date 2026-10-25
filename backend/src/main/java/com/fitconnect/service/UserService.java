
package com.fitconnect.service;

import com.fitconnect.dto.request.CreateStaffUserRequest;
import com.fitconnect.dto.request.UserRegistrationRequest;
import com.fitconnect.entity.User;

public interface UserService {

	User createStaffUser(CreateStaffUserRequest request);

    User createAdmin(UserRegistrationRequest request);

    User createStaffUser(UserRegistrationRequest request);
}
