# Product Requirements Document: AI Health Insurance Recommendation System

## Executive Summary
An AI-powered health insurance recommendation system that provides transparent, grounded, and personalized policy recommendations using RAG (Retrieval-Augmented Generation) to ensure all recommendations are based on actual policy documents.

## Core Objectives
1. Provide explainable, data-grounded insurance recommendations
2. Enable transparent reasoning through RAG pipeline
3. Maintain empathetic, user-friendly communication
4. Ensure zero hallucination through strict document retrieval

## User Inputs (Exactly 6)
1. **Full Name** (text)
2. **Age** (number)
3. **Lifestyle** (dropdown: Sedentary, Moderate, Active, Athlete)
4. **Pre-existing Conditions** (multi-select: Diabetes, Hypertension, Asthma, Cardiac, None, Other)
5. **Income Band** (under 3L, 3-8L, 8-15L, 15L+)
6. **City Tier** (Metro, Tier-2, Tier-3)

## Technical Architecture

### RAG Pipeline
- **Chunking Strategy**: 400 tokens per chunk, 50 token overlap
- **Vector Store**: ChromaDB for persistent storage
- **Embedding Model**: OpenAI text-embedding-3-small
- **Retrieval**: Top-k semantic search with relevance scoring

### AI Agent Design
- **LLM**: OpenAI GPT-4 (or Gemini as fallback)
- **System Prompt**: Empathetic tone, no medical advice, explain insurance terms
- **Tools**: retrieve_policy_chunks for grounded responses
- **Memory**: Conversation history + user profile context

### Recommendation Engine Output
1. **Peer Comparison Table**: 2-3 policies with suitability scores
2. **Coverage Detail Table**: Inclusions, exclusions, sub-limits, co-pay
3. **"Why This Policy" Explanation**: 150-250 words referencing user inputs

## Success Criteria
- All policy data sourced from retrieved documents
- Recommendations reference at least 3 user inputs
- Chat maintains context across conversation
- Admin can upload/delete documents with vector DB sync
- Zero hardcoded recommendations

## Non-Goals
- Medical diagnosis or advice
- Real-time policy price updates
- Payment processing
- Complex authentication beyond basic admin access
