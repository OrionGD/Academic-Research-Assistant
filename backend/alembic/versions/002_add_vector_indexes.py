"""Add vector indexes for faster similarity search

Revision ID: 002_add_vector_indexes
Revises: 001_initial_schema
Create Date: 2024-01-20 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_vector_indexes'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add embedding vector dimension
    op.add_column('document_chunks', 
        sa.Column('embedding_dimension', sa.Integer(), nullable=True))
    
    # Add vector index metadata
    op.add_column('documents',
        sa.Column('vector_indexed', sa.Boolean(), nullable=True, default=False))
    op.add_column('documents',
        sa.Column('vector_indexed_at', sa.DateTime(), nullable=True))
    
    # Add GIN indexes for JSONB fields
    op.create_index('ix_documents_metadata', 'documents', ['metadata'], 
        postgresql_using='gin')
    op.create_index('ix_document_chunks_metadata', 'document_chunks', ['metadata'], 
        postgresql_using='gin')
    
    # Add composite indexes for common queries
    op.create_index('ix_documents_created_user', 'documents', 
        ['user_id', 'created_at'], unique=False)
    op.create_index('ix_chunks_document_page', 'document_chunks', 
        ['document_id', 'page_number'], unique=False)
    
    # Add full-text search columns
    op.add_column('document_chunks',
        sa.Column('content_tsvector', postgresql.TSVECTOR(), nullable=True))
    
    # Create GIN index for full-text search
    op.execute("""
        CREATE INDEX ix_document_chunks_content_fts 
        ON document_chunks 
        USING GIN (to_tsvector('english', content));
    """)
    
    # Create function to update tsvector
    op.execute("""
        CREATE OR REPLACE FUNCTION update_document_chunks_tsvector() 
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.content_tsvector := to_tsvector('english', NEW.content);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Create trigger for tsvector updates
    op.execute("""
        CREATE TRIGGER document_chunks_tsvector_update 
        BEFORE INSERT OR UPDATE ON document_chunks
        FOR EACH ROW EXECUTE FUNCTION update_document_chunks_tsvector();
    """)


def downgrade() -> None:
    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS document_chunks_tsvector_update ON document_chunks;")
    op.execute("DROP FUNCTION IF EXISTS update_document_chunks_tsvector();")
    
    # Drop full-text search index
    op.execute("DROP INDEX IF EXISTS ix_document_chunks_content_fts;")
    
    # Drop columns
    op.drop_column('document_chunks', 'content_tsvector')
    op.drop_column('documents', 'vector_indexed_at')
    op.drop_column('documents', 'vector_indexed')
    op.drop_column('document_chunks', 'embedding_dimension')
    
    # Drop indexes
    op.drop_index('ix_chunks_document_page', table_name='document_chunks')
    op.drop_index('ix_documents_created_user', table_name='documents')
    op.drop_index('ix_document_chunks_metadata', table_name='document_chunks')
    op.drop_index('ix_documents_metadata', table_name='documents')