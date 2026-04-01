package com.employee.repository;

import com.employee.model.Employee;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;

@Component
public class EmployeeRepository {
    
    // In-memory storage using HashMap
    private Map<Integer, Employee> employeeMap = new HashMap<>();
    private int currentId = 1;

    // Save employee
    public Employee save(Employee employee) {
        if (employee.getId() == 0) {
            employee.setId(currentId++);
        }
        employeeMap.put(employee.getId(), employee);
        return employee;
    }

    // Find employee by ID
    public Employee findById(int id) {
        return employeeMap.get(id);
    }

    // Find all employees
    public Map<Integer, Employee> findAll() {
        return new HashMap<>(employeeMap);
    }

    // Delete employee
    public void delete(int id) {
        employeeMap.remove(id);
    }

    // Update employee
    public Employee update(Employee employee) {
        if (employeeMap.containsKey(employee.getId())) {
            employeeMap.put(employee.getId(), employee);
            return employee;
        }
        return null;
    }
}