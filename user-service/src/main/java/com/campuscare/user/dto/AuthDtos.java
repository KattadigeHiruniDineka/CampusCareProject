package com.campuscare.user.dto;

import lombok.*;

public class AuthDtos {

    @Getter @Setter
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String studentId;
    }

    @Getter @Setter
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Getter @Setter @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String tokenType = "Bearer";
        private Long userId;
        private String email;

        public AuthResponse(String token, Long userId, String email) {
            this.token = token;
            this.userId = userId;
            this.email = email;
        }
    }

    @Getter @Setter @AllArgsConstructor
    public static class UpdateUserRequest {
        private String name;
        private String studentId;
    }
}
