"""
Document processing service
"""
import os
import fitz  # PyMuPDF
from docx import Document as DocxDocument
from typing import List, Dict, Any, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.db.mongodb import documents, chunks
from app.models.document import DocumentStatus, Chunk
from app.services.embedding_service import EmbeddingService
from app.services.vector_store import VectorStoreService


class DocumentProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStoreService()
    
    async def process_document(self, document_id: str, file_path: str):
        """Process a document: extract text, chunk, generate embeddings"""
        from bson import ObjectId
        
        try:
            # Update document status
            await documents.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": {"status": DocumentStatus.PROCESSING}}
            )
            
            # Extract text based on file type
            text = await self.extract_text(file_path)
            
            if not text:
                raise ValueError("Failed to extract text from document")
            
            # Chunk the text
            chunk_texts = self.text_splitter.split_text(text)
            
            # Get document info
            doc = await documents.find_one({"_id": ObjectId(document_id)})
            user_id = doc["user_id"]
            
            # Process chunks
            chunk_objects = []
            for i, chunk_text in enumerate(chunk_texts):
                chunk = Chunk(
                    document_id=ObjectId(document_id),
                    user_id=user_id,
                    content=chunk_text,
                    chunk_index=i,
                    metadata={
                        "document_title": doc["title"],
                        "chunk_length": len(chunk_text),
                        "total_chunks": len(chunk_texts)
                    }
                )
                chunk_objects.append(chunk)
            
            # Generate embeddings for all chunks
            chunk_texts_list = [chunk.content for chunk in chunk_objects]
            embeddings = await self.embedding_service.generate_embeddings(chunk_texts_list)
            
            # Update chunks with embeddings and save to database
            for i, (chunk, embedding) in enumerate(zip(chunk_objects, embeddings)):
                chunk.embedding_vector = embedding
                chunk.token_count = len(chunk.content.split())
                
                # Insert chunk into database
                chunk_dict = chunk.dict(by_alias=True)
                await chunks.insert_one(chunk_dict)
                
                # Add to vector store
                await self.vector_store.add_chunk(
                    chunk_id=str(chunk.id),
                    embedding=embedding,
                    metadata={
                        "document_id": document_id,
                        "user_id": str(user_id),
                        "content": chunk.content,
                        "chunk_index": i,
                        "title": doc["title"]
                    }
                )
            
            # Update document status
            await documents.update_one(
                {"_id": ObjectId(document_id)},
                {
                    "$set": {
                        "status": DocumentStatus.INDEXED,
                        "chunk_count": len(chunk_objects),
                        "processed_at": datetime.utcnow()
                    }
                }
            )
            
            print(f"Processed document {document_id} with {len(chunk_objects)} chunks")
            
        except Exception as e:
            # Update document status to failed
            await documents.update_one(
                {"_id": ObjectId(document_id)},
                {"$set": {"status": DocumentStatus.FAILED}}
            )
            print(f"Failed to process document {document_id}: {e}")
            raise
    
    async def extract_text(self, file_path: str) -> str:
        """Extract text from various file formats"""
        if not os.path.exists(file_path):
            return ""
        
        file_extension = file_path.split(".")[-1].lower()
        
        try:
            if file_extension == "pdf":
                return self.extract_text_from_pdf(file_path)
            elif file_extension == "docx":
                return self.extract_text_from_docx(file_path)
            elif file_extension in ["txt", "md"]:
                return self.extract_text_from_txt(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
        
        except Exception as e:
            print(f"Text extraction error: {e}")
            return ""
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        doc = DocxDocument(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    
    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text from TXT or MD"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
