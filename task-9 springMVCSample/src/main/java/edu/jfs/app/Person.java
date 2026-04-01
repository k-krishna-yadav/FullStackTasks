package edu.jfs.app;

public class Person {
public int id;
public String nameString;

public Person(){}

public Person(int id, String nameString) {
	super();
	this.id = id;
	this.nameString = nameString;
}

public int getId() {
	return id;
}

public void setId(int id) {
	this.id = id;
}

public String getNameString() {
	return nameString;
}

public void setNameString(String nameString) {
	this.nameString = nameString;
}

@Override
public String toString() {
	return "Person [id=" + id + ", nameString=" + nameString + "]";
}


}
