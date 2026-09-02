package com.example.policeassetmanagement.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "groq")
public class GroqConfig {

    private String apiKey;
    private String baseUrl = "https://api.groq.com/openai/v1";
    private String chatModel = "openai/gpt-oss-20b";
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
