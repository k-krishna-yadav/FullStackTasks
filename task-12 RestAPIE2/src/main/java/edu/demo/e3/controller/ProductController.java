package edu.demo.e3.controller;

import java.util.LinkedList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.demo.e3.entity.Product;
import edu.demo.e3.repository.ProductRepository;

@RestController
public class ProductController {
	
	@Autowired
	ProductRepository productRepository;
	
	@GetMapping("/")
	LinkedList<Product> getAllProducts() {
		return productRepository.getProducts();
	}
	
	@PostMapping("/add")
	String addProduct() {
		return productRepository.insert();
	}
	
	@DeleteMapping
	public String deleteProduct(){
		
		return productRepository.deleteProduct();
		
	}
	
	@PutMapping
	public String modifyProduct() {
	return productRepository.modifyProduct();
	}
	
	
	

}
