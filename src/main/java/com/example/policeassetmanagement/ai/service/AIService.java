package com.example.policeassetmanagement.ai.service;

import com.example.policeassetmanagement.ai.config.GroqConfig;
import com.example.policeassetmanagement.ai.entity.DocumentChunk;
import com.example.policeassetmanagement.ai.repository.DocumentChunkRepository;
import com.example.policeassetmanagement.entity.Document;
import com.example.policeassetmanagement.exception.BadRequestException;
import com.example.policeassetmanagement.exception.ResourceNotFoundException;
import com.example.policeassetmanagement.repository.DocumentRepository;
import com.example.policeassetmanagement.service.AuditService;
import com.example.policeassetmanagement.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private final GroqConfig groqConfig;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final TextExtractionService textExtractionService;
    private final TextChunker textChunker;
    private final GroqService groqService;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;

    // Common English stop words to exclude from keyword matching
    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
            "have", "has", "had", "do", "does", "did", "will", "would", "could",
            "should", "may", "might", "shall", "can", "to", "of", "in", "for",
            "on", "with", "at", "by", "from", "as", "into", "through", "during",
            "before", "after", "above", "below", "between", "out", "off", "over",
            "under", "again", "further", "then", "once", "and", "but", "or",
            "nor", "not", "so", "very", "just", "than", "too", "also",
            "that", "this", "these", "those", "it", "its", "he", "she",
            "they", "them", "their", "we", "our", "you", "your", "i", "my"
    );

    private static final Pattern WORD_PATTERN = Pattern.compile("[a-zA-Z0-9]{2,}");

    // --- Prompt Templates ---

    private static final String SUMMARIZE_PROMPT =
            "You are a document analysis assistant. Summarize the following document content concisely. " +
            "Provide a clear, structured summary covering the key points. " +
            "Do not add information not present in the document.";

    private static final String QA_PROMPT =
            "You are a document question-answering assistant. " +
            "Answer the user's question based ONLY on the provided document context. " +
            "If the answer cannot be found in the provided context, clearly state that the information is not available in the document. " +
            "Do not invent or assume information that is not in the context.\n\n" +
            "Document Context:\n%s\n\n" +
            "Question: %s";

    /**
     * Index a document: extract text → chunk → store.
     */
    @Transactional
    public Map<String, Object> indexDocument(Long documentId, Long userId, String ip) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        // Check if already indexed — delete existing chunks for re-indexing
        if (chunkRepository.existsByDocument(document)) {
            chunkRepository.deleteByDocument(document);
        }

        // Extract text
        Resource fileResource = fileStorageService.loadAsResource(document.getFilePath());
        String text = textExtractionService.extractText(fileResource, document.getContentType(), document.getFileName());

        if (text.isBlank()) {
            throw new BadRequestException("Document contains no extractable text for indexing");
        }

        // Chunk text
        List<String> chunks = textChunker.chunkText(text);

        if (chunks.isEmpty()) {
            throw new BadRequestException("Could not create chunks from document text");
        }

        // Store chunks (no embeddings — using keyword-based relevance instead)
        List<DocumentChunk> savedChunks = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            DocumentChunk chunk = DocumentChunk.builder()
                    .document(document)
                    .chunkIndex(i)
                    .content(chunks.get(i))
                    .embedding(null)  // No embeddings; keyword search used instead
                    .build();
            savedChunks.add(chunkRepository.save(chunk));
        }

        auditService.createAuditLog("DOCUMENT_INDEXED", "Document", documentId,
                userId, "Document indexed: " + chunks.size() + " chunks", ip);

        return Map.of(
                "documentId", documentId,
                "chunksCreated", savedChunks.size(),
                "indexed", true
        );
    }

    /**
     * Summarize a document using Groq LLM.
     */
    public Map<String, Object> summarizeDocument(Long documentId, Long userId, String ip) {
        if (!groqConfig.isConfigured()) {
            throw new IllegalStateException("Groq API key not configured. Set GROQ_API_KEY environment variable.");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        // Extract text
        Resource fileResource = fileStorageService.loadAsResource(document.getFilePath());
        String text = textExtractionService.extractText(fileResource, document.getContentType(), document.getFileName());

        // Limit text to avoid token limits (roughly 6000 chars ~ 1500 tokens)
        if (text.length() > 6000) {
            text = text.substring(0, 6000) + "\n\n[Document truncated for summarization]";
        }

        String summary = groqService.chatCompletion(SUMMARIZE_PROMPT, text);

        auditService.createAuditLog("DOCUMENT_SUMMARIZED", "Document", documentId,
                userId, "Document summarized", ip);

        return Map.of(
                "documentId", documentId,
                "summary", summary,
                "model", groqConfig.getChatModel()
        );
    }

    /**
     * Answer a question about a document using keyword-based RAG.
     * Groq does not provide an embedding endpoint, so we use keyword matching
     * to retrieve the most relevant chunks, then send them to Groq for answer generation.
     */
    public Map<String, Object> askQuestion(Long documentId, String question, Long userId, String ip) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        List<DocumentChunk> chunks = chunkRepository.findByDocumentOrderByChunkIndex(document);

        if (chunks.isEmpty()) {
            throw new BadRequestException("Document has not been indexed. Please index it first using POST /api/ai/documents/" + documentId + "/index");
        }

        if (!groqConfig.isConfigured()) {
            throw new IllegalStateException("Groq API key not configured. Set GROQ_API_KEY environment variable.");
        }

        // Find most relevant chunks via keyword-based relevance
        List<DocumentChunk> relevantChunks = findMostRelevantChunks(chunks, question, 5);

        // Build context from relevant chunks
        String context = relevantChunks.stream()
                .sorted(Comparator.comparingInt(DocumentChunk::getChunkIndex))
                .map(DocumentChunk::getContent)
                .collect(Collectors.joining("\n\n---\n\n"));

        // Generate answer via Groq LLM
        String prompt = String.format(QA_PROMPT, context, question);
        String answer = groqService.chatCompletion("You are a helpful document assistant.", prompt);

        // Build sources
        List<Map<String, Object>> sources = relevantChunks.stream()
                .map(c -> Map.<String, Object>of("chunkId", c.getId(), "chunkIndex", c.getChunkIndex()))
                .toList();

        auditService.createAuditLog("DOCUMENT_QUERIED", "Document", documentId,
                userId, "Question: " + question, ip);

        return Map.of(
                "documentId", documentId,
                "question", question,
                "answer", answer,
                "sources", sources
        );
    }

    /**
     * Find the most relevant chunks by keyword overlap with the query.
     * Scores each chunk by counting how many query keywords appear in it,
     * with frequency weighting.
     */
    private List<DocumentChunk> findMostRelevantChunks(List<DocumentChunk> chunks, String query, int topK) {
        Map<String, Integer> queryKeywords = extractKeywords(query);
        if (queryKeywords.isEmpty()) {
            return chunks.stream().limit(topK).toList();
        }

        return chunks.stream()
                .sorted((a, b) -> {
                    double scoreA = computeKeywordScore(a.getContent(), queryKeywords);
                    double scoreB = computeKeywordScore(b.getContent(), queryKeywords);
                    return Double.compare(scoreB, scoreA); // descending
                })
                .limit(topK)
                .toList();
    }

    /**
     * Compute a relevance score for a chunk against a set of query keywords.
     * Score = sum of (keyword frequency in chunk / total words in chunk) for each matching keyword.
     */
    private double computeKeywordScore(String chunkText, Map<String, Integer> queryKeywords) {
        Map<String, Integer> chunkWords = extractKeywords(chunkText);
        if (chunkWords.isEmpty()) return 0.0;

        double score = 0.0;
        int totalChunkWords = chunkWords.values().stream().mapToInt(Integer::intValue).sum();

        for (Map.Entry<String, Integer> entry : queryKeywords.entrySet()) {
            String keyword = entry.getKey();
            int queryFreq = entry.getValue();
            int chunkFreq = chunkWords.getOrDefault(keyword, 0);
            if (chunkFreq > 0) {
                // TF-weighted score: higher frequency in chunk = higher relevance
                score += queryFreq * ((double) chunkFreq / totalChunkWords);
            }
        }
        return score;
    }

    /**
     * Extract lowercase keywords from text, excluding stop words.
     * Returns a map of keyword → frequency.
     */
    private Map<String, Integer> extractKeywords(String text) {
        Map<String, Integer> keywords = new HashMap<>();
        Matcher matcher = WORD_PATTERN.matcher(text.toLowerCase());
        while (matcher.find()) {
            String word = matcher.group();
            if (!STOP_WORDS.contains(word) && word.length() >= 2) {
                keywords.merge(word, 1, Integer::sum);
            }
        }
        return keywords;
    }
}
