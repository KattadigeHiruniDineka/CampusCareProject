package com.campuscare.notification.controller;

import com.campuscare.notification.model.Notification;
import com.campuscare.notification.repository.NotificationRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@Tag(name = "Notifications", description = "Manage notifications generated for students")
public class NotificationController {

    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    @Operation(summary = "Create a notification")
    public ResponseEntity<Notification> create(@RequestBody Notification notification) {
        notification.setId(null);
        return ResponseEntity.ok(repository.save(notification));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Retrieve notifications for a user")
    public List<Notification> getForUser(@PathVariable Long userId) {
        return repository.findByUserId(userId);
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    public ResponseEntity<Notification> markRead(@PathVariable Long id) {
        return repository.findById(id).map(n -> {
            n.setRead(true);
            return ResponseEntity.ok(repository.save(n));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a notification")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
