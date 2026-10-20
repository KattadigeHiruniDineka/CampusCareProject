package com.campuscare.request.controller;

import com.campuscare.request.model.ServiceRequest;
import com.campuscare.request.repository.ServiceRequestRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/requests")
@Tag(name = "Service Requests", description = "Create, view, update and delete university service requests")
public class RequestController {

    private final ServiceRequestRepository repository;

    public RequestController(ServiceRequestRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    @Operation(summary = "Create a service request")
    public ResponseEntity<ServiceRequest> create(@RequestBody ServiceRequest request) {
        request.setId(null);
        return ResponseEntity.ok(repository.save(request));
    }

    @GetMapping
    @Operation(summary = "Retrieve service requests")
    public List<ServiceRequest> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve a specific request")
    public ResponseEntity<ServiceRequest> getOne(@PathVariable Long id) {
        return repository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a request")
    public ResponseEntity<ServiceRequest> update(@PathVariable Long id, @RequestBody ServiceRequest updated) {
        return repository.findById(id).map(existing -> {
            if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
            if (updated.getPriority() != null) existing.setPriority(updated.getPriority());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            if (updated.getRequestType() != null) existing.setRequestType(updated.getRequestType());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a request")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
