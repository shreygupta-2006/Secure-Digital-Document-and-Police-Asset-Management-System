package com.example.policeassetmanagement.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Multipart config handled via application.yml
    // This class is available for future CORS, interceptors, etc.
}
