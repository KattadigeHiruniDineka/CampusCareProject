package com.campuscare.department.controller;

import com.campuscare.department.model.Department;
import com.campuscare.department.repository.DepartmentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departments")
@Tag(name = "Departments", description = "University department management")
public class DepartmentController {

    private final DepartmentRepository repository;

    public DepartmentController(DepartmentRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    @Operation(summary = "Create a department")
    public ResponseEntity<Department> create(@RequestBody Department department) {
        department.setId(null);
        return ResponseEntity.ok(repository.save(department));
    }

    @GetMapping
    @Operation(summary = "Retrieve departments")
    public List<Department> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve a specific department")
    public ResponseEntity<Department> getOne(@PathVariable Long id) {
        return repository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a department")
    public ResponseEntity<Department> update(@PathVariable Long id, @RequestBody Department updated) {
        return repository.findById(id).map(existing -> {
            if (updated.getName() != null) existing.setName(updated.getName());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            if (updated.getContactEmail() != null) existing.setContactEmail(updated.getContactEmail());
            if (updated.getLocation() != null) existing.setLocation(updated.getLocation());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a department")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
