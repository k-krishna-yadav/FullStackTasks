package edu.jfs.app;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.ModelAndView;

@RestController
public class MVCController {
	@GetMapping("/")
	public ModelAndView getMyPage() {
		ModelAndView mView=new ModelAndView();
		mView.addObject("str","MithraMa");
		mView.setViewName("OneString");
		return mView;
	}
	@GetMapping("/person")
	public ModelAndView getMyPersonData() {
		ModelAndView mView=new ModelAndView();
		Person person = new Person(111, "Mithra");
		mView.addObject("str",person.getNameString());		
		mView.setViewName("OneString");
		return mView;
	}
		
	@GetMapping("/page")
    public ModelAndView page() {
        return new  ModelAndView("index");
    }
	
	@GetMapping("/show")
	public ModelAndView show(Model model) {
	    Person person = new Person(777, "MilaniMithra");
	    model.addAttribute("person", person); // Give the attribute a name
	    return new ModelAndView ("Person"); // Just return view name, not ModelAndView
	}
}
