package com.campuscare.user.controller;

import com.campuscare.user.dto.AuthDtos;
import com.campuscare.user.dto.AuthDtos.*;
import com.campuscare.user.model.User;
import com.campuscare.user.repository.UserRepository;
import com.campuscare.user.security.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "Student registration and login")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new student")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("{\"error\":\"Email already registered\"}");
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .studentId(req.getStudentId())
                .build();
        User saved = userRepository.save(user);
        
        // Generate JWT token for the newly registered user and return AuthResponse
        String token = jwtUtil.generateToken(saved.getId(), saved.getEmail());
        AuthResponse response = new AuthResponse(token, saved.getId(), saved.getEmail());
        
        return ResponseEntity.ok(response);
    }

   @PostMapping("/login")
    @Operation(summary = "Authenticate a student and issue a JWT access token")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        return userRepository.findByEmail(req.getEmail())
                .filter(u -> passwordEncoder.matches(req.getPassword(), u.getPassword()))
                .map(u -> ResponseEntity.ok(new AuthResponse(
                        jwtUtil.generateToken(u.getId(), u.getEmail()), 
                        u.getId(), 
                        u.getEmail()
                )))
                .orElseGet(() -> ResponseEntity.status(401).body(null));
    }
}