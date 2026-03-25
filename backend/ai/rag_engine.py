"""
RAG (Retrieval Augmented Generation) Engine for Commander V3
Combines vector search with LLM for context-aware responses.
"""

import os
from typing import Dict, List, Optional
import pandas as pd
from .llm_client import LLMClient, LLMProvider


class RAGEngine:
    """
    RAG engine for natural language queries over inventory and jobs data.
    Uses ChromaDB for vector storage and retrieval.
    """
    
    def __init__(self, llm_provider: LLMProvider = LLMProvider.OPENAI):
        """Initialize RAG engine."""
        self.llm = LLMClient(provider=llm_provider)
        self.collection = None
        self.chroma_client = None
        
        try:
            import chromadb
            self.chroma_client = chromadb.Client()
            # Create or get collection
            self.collection = self.chroma_client.get_or_create_collection(
                name="commander_inventory",
                metadata={"description": "Commander inventory and jobs data"}
            )
        except ImportError:
            print("ChromaDB not installed")
        except Exception as e:
            print(f"ChromaDB initialization error: {e}")
    
    def index_data(self, data_type: str, records: List[Dict]):
        """
        Index data into vector store.
        
        Args:
            data_type: Type of data ('products', 'vendors', 'jobs', etc.)
            records: List of record dictionaries
        """
        if not self.collection or not records:
            return
        
        try:
            documents = []
            metadatas = []
            ids = []
            
            for i, record in enumerate(records):
                # Create searchable text representation
                doc_text = self._record_to_text(data_type, record)
                documents.append(doc_text)
                
                # Store metadata
                metadata = {
                    'type': data_type,
                    **{k: str(v) for k, v in record.items() if k != 'id'}
                }
                metadatas.append(metadata)
                
                # Generate ID
                record_id = record.get('id') or record.get('PRODUCT_ID') or record.get('VENDOR_ID') or f"{data_type}_{i}"
                ids.append(f"{data_type}_{record_id}")
            
            # Add to collection
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
        except Exception as e:
            print(f"Indexing error: {e}")
    
    def query(
        self,
        user_question: str,
        context: Optional[Dict] = None,
        n_results: int = 5
    ) -> Optional[str]:
        """
        Answer a user question using RAG.
        
        Args:
            user_question: Natural language question
            context: Optional context (current page, user role, etc.)
            n_results: Number of relevant documents to retrieve
            
        Returns:
            AI-generated answer or None if error
        """
        if not self.collection or not self.llm.is_available():
            return "AI assistant not available. Please configure API keys."
        
        try:
            # Retrieve relevant documents
            results = self.collection.query(
                query_texts=[user_question],
                n_results=n_results
            )
            
            # Build context from retrieved documents
            retrieved_docs = results['documents'][0] if results['documents'] else []
            context_text = "\n\n".join(retrieved_docs) if retrieved_docs else "No relevant data found."
            
            # Build prompt
            system_prompt = """You are an AI assistant for Commander Industries' inventory management system.
Answer questions based on the provided context data. Be concise and specific.
If the context doesn't contain enough information, say so clearly."""
            
            user_prompt = f"""Context data:
{context_text}

Question: {user_question}

Answer:"""
            
            # Add page context if available
            if context:
                page_info = context.get('current_page', '')
                if page_info:
                    user_prompt = f"Current page: {page_info}\n\n{user_prompt}"
            
            # Get LLM response
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            response = self.llm.chat(messages, temperature=0.3)
            return response
            
        except Exception as e:
            return f"Error processing query: {str(e)}"
    
    def suggest_action(
        self,
        user_question: str,
        available_actions: List[str]
    ) -> Optional[Dict]:
        """
        Suggest a quick action based on user query.
        
        Args:
            user_question: User's question or request
            available_actions: List of possible actions
            
        Returns:
            Dict with suggested action and parameters
        """
        if not self.llm.is_available():
            return None
        
        prompt = f"""Based on this user request: "{user_question}"

Available actions: {', '.join(available_actions)}

Suggest the most appropriate action and any parameters needed.
Respond in JSON format: {{"action": "action_name", "parameters": {{}}, "confidence": 0.0-1.0}}"""
        
        response = self.llm.generate_completion(prompt, temperature=0.2)
        
        try:
            import json
            return json.loads(response) if response else None
        except:
            return None
    
    def _record_to_text(self, data_type: str, record: Dict) -> str:
        """Convert a record to searchable text."""
        if data_type == 'products':
            return f"Product: {record.get('PRODUCT_NAME', '')} (ID: {record.get('PRODUCT_ID', '')}). Description: {record.get('DESCRIPTION', '')}. Location: {record.get('LOCATION', '')}."
        
        elif data_type == 'vendors':
            return f"Vendor: {record.get('VENDOR_NAME', '')} (ID: {record.get('VENDOR_ID', '')}). Contact: {record.get('CONTACT_NAME', '')}. Email: {record.get('EMAIL', '')}."
        
        elif data_type == 'jobs':
            return f"Job {record.get('JOB_ID', '')}: {record.get('JOB_TYPE', '')}. Priority: {record.get('PRIORITY', '')}. Due: {record.get('DUE_DATE', '')}. Status: {record.get('STATUS', '')}."
        
        else:
            # Generic representation
            return " ".join([f"{k}: {v}" for k, v in record.items() if v])
    
    def is_available(self) -> bool:
        """Check if RAG engine is properly configured."""
        return self.collection is not None and self.llm.is_available()
