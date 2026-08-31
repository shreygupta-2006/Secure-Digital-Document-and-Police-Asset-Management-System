package com.example.policeassetmanagement.ai.service;

import com.example.policeassetmanagement.ai.config.GroqConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroqService {

    private final GroqConfig config;
    private final WebClient webClient = WebClient.builder().build();

    /**
     * Generate a chat completion from Groq.
     */
    public String chatCompletion(String systemPrompt, String userMessage) {
        if (!config.isConfigured()) {
            throw new IllegalStateException("Groq API key not configured. Set GROQ_API_KEY environment variable.");
        }

        Map<String, Object> requestBody = Map.of(
                "model", config.getChatModel(),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                ),
                "temperature", 0.3,
                "max_tokens", 2048
        );

        try {
            Map<String, Object> response = webClient.post()
                    .uri(config.getBaseUrl() + "/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + config.getApiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");
        } catch (WebClientResponseException e) {
            log.error("Groq API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI service error: " + e.getStatusCode());
        } catch (Exception e) {
            log.error("Groq API call failed", e);
            throw new RuntimeException("AI service unavailable: " + e.getMessage());
        }
    }


}
