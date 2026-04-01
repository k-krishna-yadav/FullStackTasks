package edu.demo.e3.repository;

import java.util.LinkedList;

import org.springframework.stereotype.Repository;

import edu.demo.e3.entity.Product;

@Repository
public class ProductRepository {
	Product mouse;
	Product Laptop;
	LinkedList<Product> pList=new LinkedList<>();
	
	
	public String insert() {
		mouse=new Product(101,"Mouse");
		 Laptop=new Product(102,"Laptop");	
		pList.add(mouse);
		pList.add(Laptop);
		return "Products are added";
	}
	
	public LinkedList<Product> getProducts() {
		System.out.println(pList);
		return pList;
	}
	
	public String deleteProduct(){
		pList.removeFirst();
		return "DElete success";
		
	}
	
	public String modifyProduct(){
		Laptop.setName("HPLaptop");		
		return "Modified successfully";
	}
	
	

}
