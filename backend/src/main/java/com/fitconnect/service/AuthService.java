
package com.fitconnect.service;

import com.fitconnect.dto.request.LoginRequest;
import com.fitconnect.dto.response.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);
}
