package com.example.policeassetmanagement.ai.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TextChunker {

    private static final int DEFAULT_CHUNK_SIZE = 800;  // words
    private static final int OVERLAP_SIZE = 100;         // words

    /**
     * Split text into overlapping chunks.
     */
    public List<String> chunkText(String text) {
        return chunkText(text, DEFAULT_CHUNK_SIZE, OVERLAP_SIZE);
    }

    public List<String> chunkText(String text, int chunkSizeWords, int overlapWords) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        String[] words = text.split("\\s+");
        if (words.length <= chunkSizeWords) {
            return List.of(text.trim());
        }

        List<String> chunks = new ArrayList<>();
        int start = 0;

        while (start < words.length) {
            int end = Math.min(start + chunkSizeWords, words.length);
            StringBuilder chunk = new StringBuilder();
            for (int i = start; i < end; i++) {
                if (chunk.length() > 0) chunk.append(" ");
                chunk.append(words[i]);
            }
            chunks.add(chunk.toString().trim());
            start += chunkSizeWords - overlapWords;
        }

        return chunks;
    }
}
