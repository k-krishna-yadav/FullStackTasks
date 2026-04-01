package com.employee.main;

import com.employee.model.Employee;
import com.employee.service.EmployeeService;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.context.support.ClassPathXmlApplicationContext;

public class MainApp {
    public static void main(String[] args) {
        
        System.out.println("=== Employee Management System ===\n");
        
        try {
            // Load Spring configuration and create BeanFactory
            BeanFactory factory = new ClassPathXmlApplicationContext("applicationContext.xml");
            
            // Get EmployeeService bean from BeanFactory
            EmployeeService employeeService = factory.getBean(EmployeeService.class);
            
            // Demonstrate Dependency Injection and Inversion of Control
            System.out.println("1. Adding Employees...");
            
            // Add employees
            Employee emp1 = employeeService.addEmployee(
                new Employee(0, "John Doe", "IT", 50000)
            );
            System.out.println("Added: " + emp1);
            
            Employee emp2 = employeeService.addEmployee(
                new Employee(0, "Jane Smith", "HR", 45000)
            );
            System.out.println("Added: " + emp2);
            
            Employee emp3 = employeeService.addEmployee(
                new Employee(0, "Bob Johnson", "IT", 55000)
            );
            System.out.println("Added: " + emp3);
            
            System.out.println("\n2. Getting All Employees:");
            employeeService.getAllEmployees().forEach(System.out::println);
            
            System.out.println("\n3. Getting Employee by ID (ID: 2):");
            Employee found = employeeService.getEmployee(2);
            System.out.println(found);
            
            System.out.println("\n4. Updating Employee (ID: 1):");
            emp1.setSalary(52000);
            emp1.setDepartment("IT-Senior");
            Employee updated = employeeService.updateEmployee(emp1);
            System.out.println("Updated: " + updated);
            
            System.out.println("\n5. Average Salary: $" + 
                String.format("%.2f", employeeService.getAverageSalary()));
            
            System.out.println("\n6. Deleting Employee (ID: 3):");
            boolean deleted = employeeService.deleteEmployee(3);
            System.out.println("Deleted: " + (deleted ? "Success" : "Failed"));
            
            System.out.println("\n7. Final Employee List:");
            employeeService.getAllEmployees().forEach(System.out::println);
            
            System.out.println("\n=== Inversion of Control Demonstrated ===");
            System.out.println("- Spring manages object lifecycle");
            System.out.println("- @Component auto-detects beans");
            System.out.println("- @Autowired injects dependencies");
            System.out.println("- BeanFactory provides centralized bean management");
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}