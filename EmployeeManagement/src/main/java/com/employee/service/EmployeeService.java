package com.employee.service;

import com.employee.model.Employee;
import com.employee.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Collection;

@Service
public class EmployeeService {
    
    @Autowired
    private EmployeeRepository employeeRepository;

    // Add new employee
    public Employee addEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    // Get employee by ID
    public Employee getEmployee(int id) {
        return employeeRepository.findById(id);
    }

    // Get all employees
    public Collection<Employee> getAllEmployees() {
        return employeeRepository.findAll().values();
    }

    // Update employee
    public Employee updateEmployee(Employee employee) {
        return employeeRepository.update(employee);
    }

    // Delete employee
    public boolean deleteEmployee(int id) {
        Employee emp = employeeRepository.findById(id);
        if (emp != null) {
            employeeRepository.delete(id);
            return true;
        }
        return false;
    }

    // Calculate average salary
    public double getAverageSalary() {
        return employeeRepository.findAll().values()
                .stream()
                .mapToDouble(Employee::getSalary)
                .average()
                .orElse(0.0);
    }
}