package com.example.policeassetmanagement.ai.service;

import com.example.policeassetmanagement.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
public class TextExtractionService {

    /**
     * Extract text from a file based on its content type.
     */
    public String extractText(Resource fileResource, String contentType, String originalFilename) {
        try {
            if (contentType == null) {
                contentType = guessContentType(originalFilename);
            }

            return switch (contentType) {
                case "application/pdf" -> extractFromPdf(fileResource);
                case "text/plain", "text/csv" -> extractFromText(fileResource);
                default -> throw new BadRequestException(
                        "Unsupported document format for AI processing: " + contentType);
            };
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Text extraction failed", e);
            throw new BadRequestException("Failed to extract text from document: " + e.getMessage());
        }
    }

    private String extractFromPdf(Resource resource) throws Exception {
        byte[] bytes = resource.getInputStream().readAllBytes();
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);
            if (text == null || text.isBlank()) {
                throw new BadRequestException("PDF contains no extractable text");
            }
            return text.trim();
        }
    }

    private String extractFromText(Resource resource) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        String text = sb.toString().trim();
        if (text.isEmpty()) {
            throw new BadRequestException("Document contains no text");
        }
        return text;
    }

    private String guessContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".txt") || lower.endsWith(".csv")) return "text/plain";
        return "application/octet-stream";
    }
}
