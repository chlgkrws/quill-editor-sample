package com.poc.example.view;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/quill")
public class QuillWeb {

    @GetMapping("/basic")
    public String basic() {

        return "basic";
    }

    @GetMapping("/basic-data")
    public String basicData() {

        return "basic-data";
    }

    @GetMapping("/basic-data/json")
    public String basicDataJson() {

        return "basic-data-json";
    }
}
