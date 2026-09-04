package com.example.policeassetmanagement.ai.controller;

import com.example.policeassetmanagement.ai.dto.request.AskDocumentRequest;
import com.example.policeassetmanagement.ai.dto.response.*;
import com.example.policeassetmanagement.ai.service.AIService;
import com.example.policeassetmanagement.security.SecurityHelper;
import com.example.policeassetmanagement.service.DocumentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;
    private final SecurityHelper securityHelper;
    private final DocumentService documentService;

    @PostMapping("/documents/{documentId}/index")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<IndexDocumentResponse> indexDocument(
            @PathVariable Long documentId,
            HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        documentService.assertDocumentAccessible(documentId, userId);
        String ip = getClientIp(httpRequest);
        Map<String, Object> result = aiService.indexDocument(documentId, userId, ip);
        return ResponseEntity.ok(IndexDocumentResponse.builder()
                .documentId(documentId)
                .chunksCreated((int) result.get("chunksCreated"))
                .indexed(true)
                .build());
    }

    @PostMapping("/documents/{documentId}/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<DocumentSummaryResponse> summarizeDocument(
            @PathVariable Long documentId,
            HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        documentService.assertDocumentAccessible(documentId, userId);
        String ip = getClientIp(httpRequest);
        Map<String, Object> result = aiService.summarizeDocument(documentId, userId, ip);
        return ResponseEntity.ok(DocumentSummaryResponse.builder()
                .documentId(documentId)
                .summary((String) result.get("summary"))
                .model((String) result.get("model"))
                .build());
    }

    @PostMapping("/documents/{documentId}/ask")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<DocumentAnswerResponse> askQuestion(
            @PathVariable Long documentId,
            @Valid @RequestBody AskDocumentRequest request,
            HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        documentService.assertDocumentAccessible(documentId, userId);
        String ip = getClientIp(httpRequest);
        Map<String, Object> result = aiService.askQuestion(documentId, request.getQuestion(), userId, ip);

        List<Map<String, Object>> rawSources = (List<Map<String, Object>>) result.get("sources");
        List<SourceChunkResponse> sources = rawSources.stream()
                .map(s -> SourceChunkResponse.builder()
                        .chunkId(((Number) s.get("chunkId")).longValue())
                        .chunkIndex((Integer) s.get("chunkIndex"))
                        .build())
                .toList();

        return ResponseEntity.ok(DocumentAnswerResponse.builder()
                .documentId(documentId)
                .question((String) result.get("question"))
                .answer((String) result.get("answer"))
                .sources(sources)
                .build());
    }

    @GetMapping("/documents/{documentId}/suggestions")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<SuggestionsResponse> getSuggestions(
            @PathVariable Long documentId,
            HttpServletRequest httpRequest) {
        Long userId = securityHelper.getCurrentUserId();
        documentService.assertDocumentAccessible(documentId, userId);
        String ip = getClientIp(httpRequest);
        Map<String, Object> result = aiService.suggestQuestions(documentId, userId, ip);

        @SuppressWarnings("unchecked")
        List<String> suggestions = (List<String>) result.get("suggestions");

        return ResponseEntity.ok(SuggestionsResponse.builder()
                .documentId(documentId)
                .suggestions(suggestions)
                .model((String) result.get("model"))
                .build());
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        return xff != null ? xff.split(",")[0].trim() : request.getRemoteAddr();
    }
}
