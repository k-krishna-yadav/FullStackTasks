package edu.jfs.app.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import edu.jfs.app.entity.Product;
import edu.jfs.app.service.ProductService;

@RestController
public class ProductController {

	@Autowired
	ProductService service;

	@GetMapping("/getProducts")
	public List<Product> getProducts() {

		return service.getProducts();
	}

	@GetMapping("/getProductByCost/{cost}")
	public Product getProductByCost(@PathVariable Double cost) {

		return service.getProductByCost(cost);
	}

	// mapping to pick only one product by id

	@GetMapping("/getProduct/{id}")
	public Product getProduct(@PathVariable int id) {

		return service.getProduct(id);
	}

	// mapping to pick only one product by name
	@GetMapping("/getProductByName/{name}")
	public Product getProductByName(@PathVariable String name) {

		return service.getProductByName(name);
	}
	
	
	
	
	
	
	
	
	
	
	
	
	

	// post one object to a db(save) using requestbody
	@PostMapping("/addProduct")
	public Product addData(@RequestBody Product product) {
		service.addData(product);
		return product;
	}

	@PostMapping("/saveProduct")
	public ResponseEntity<Product> addDatap(@RequestBody Product product) {
		service.addData(product);
		return ResponseEntity.ok(product);
	}

}
