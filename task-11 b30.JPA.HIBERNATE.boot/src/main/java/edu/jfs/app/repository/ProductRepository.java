package edu.jfs.app.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import edu.jfs.app.entity.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
		//JPQL 
		@Query("SELECT p FROM Product p where p.name=?1")
		Optional<Product> findByName(String name);
		
		//Native Query
		@Query(value="SELECT * FROM Product",nativeQuery = true)
		List<Product> findAll();
		
		//Derived Query
		Optional<Product> findByCost(double cost); 
}
