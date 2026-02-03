"""Add advanced search features and saved searches

Revision ID: 005_add_advanced_search_features
Revises: 004_add_collections_sharing
Create Date: 2024-02-10 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005_add_advanced_search_features'
down_revision = '004_add_collections_sharing'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Saved searches
    op.create_table('saved_searches',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('query_params', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=True),
        sa.Column('last_executed_at', sa.DateTime(), nullable=True),
        sa.Column('execution_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_saved_searches_user_id'), 'saved_searches', ['user_id'], unique=False)
    op.create_index(op.f('ix_saved_searches_created_at'), 'saved_searches', ['created_at'], unique=False)
    
    # Search result caching
    op.create_table('search_cache',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('query_hash', sa.String(length=64), nullable=False),
        sa.Column('query_params', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('results', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('result_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('query_hash')
    )
    op.create_index(op.f('ix_search_cache_query_hash'), 'search_cache', ['query_hash'], unique=True)
    op.create_index(op.f('ix_search_cache_expires_at'), 'search_cache', ['expires_at'], unique=False)
    
    # Search filters presets
    op.create_table('search_filters',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('filters', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_search_filters_user_id'), 'search_filters', ['user_id'], unique=False)
    
    # Add search-specific columns to document_chunks
    op.add_column('document_chunks',
        sa.Column('has_equations', sa.Boolean(), nullable=True))
    op.add_column('document_chunks',
        sa.Column('has_tables', sa.Boolean(), nullable=True))
    op.add_column('document_chunks',
        sa.Column('has_references', sa.Boolean(), nullable=True))
    op.add_column('document_chunks',
        sa.Column('academic_score', sa.Float(), nullable=True))
    
    # Add document-level search metadata
    op.add_column('documents',
        sa.Column('has_abstract', sa.Boolean(), nullable=True))
    op.add_column('documents',
        sa.Column('has_conclusion', sa.Boolean(), nullable=True))
    op.add_column('documents',
        sa.Column('reference_count', sa.Integer(), nullable=True))
    op.add_column('documents',
        sa.Column('equation_count', sa.Integer(), nullable=True))
    op.add_column('documents',
        sa.Column('table_count', sa.Integer(), nullable=True))
    
    # Add search ranking factors
    op.add_column('documents',
        sa.Column('relevance_score', sa.Float(), nullable=True))
    op.add_column('documents',
        sa.Column('quality_score', sa.Float(), nullable=True))
    op.add_column('documents',
        sa.Column('popularity_score', sa.Float(), nullable=True))
    
    # Create function for search relevance calculation
    op.execute("""
        CREATE OR REPLACE FUNCTION calculate_search_relevance(
            query_vector FLOAT[],
            chunk_vector FLOAT[],
            academic_score FLOAT,
            popularity_score FLOAT
        ) RETURNS FLOAT AS $$
        DECLARE
            similarity FLOAT;
            relevance FLOAT;
        BEGIN
            -- Calculate cosine similarity
            similarity := 
                (SELECT SUM(q * c) FROM unnest(query_vector, chunk_vector) AS t(q, c)) /
                (sqrt((SELECT SUM(q * q) FROM unnest(query_vector) AS q)) * 
                 sqrt((SELECT SUM(c * c) FROM unnest(chunk_vector) AS c)));
            
            -- Combine with other factors
            relevance := similarity * 0.7 + 
                         academic_score * 0.2 + 
                         popularity_score * 0.1;
            
            RETURN relevance;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Create search statistics view
    op.execute("""
        CREATE MATERIALIZED VIEW search_statistics AS
        SELECT 
            DATE(created_at) as date,
            query_type,
            COUNT(*) as query_count,
            AVG(results_count) as avg_results,
            COUNT(DISTINCT user_id) as unique_users
        FROM search_queries
        GROUP BY DATE(created_at), query_type
        ORDER BY date DESC, query_count DESC;
    """)
    
    op.execute("CREATE INDEX ix_search_statistics_date_type ON search_statistics (date, query_type);")


def downgrade() -> None:
    # Drop materialized view
    op.execute("DROP MATERIALIZED VIEW IF EXISTS search_statistics;")
    
    # Drop function
    op.execute("DROP FUNCTION IF EXISTS calculate_search_relevance;")
    
    # Drop columns from documents
    op.drop_column('documents', 'popularity_score')
    op.drop_column('documents', 'quality_score')
    op.drop_column('documents', 'relevance_score')
    op.drop_column('documents', 'table_count')
    op.drop_column('documents', 'equation_count')
    op.drop_column('documents', 'reference_count')
    op.drop_column('documents', 'has_conclusion')
    op.drop_column('documents', 'has_abstract')
    
    # Drop columns from document_chunks
    op.drop_column('document_chunks', 'academic_score')
    op.drop_column('document_chunks', 'has_references')
    op.drop_column('document_chunks', 'has_tables')
    op.drop_column('document_chunks', 'has_equations')
    
    # Drop tables
    op.drop_index(op.f('ix_search_filters_user_id'), table_name='search_filters')
    op.drop_table('search_filters')
    
    op.drop_index(op.f('ix_search_cache_expires_at'), table_name='search_cache')
    op.drop_index(op.f('ix_search_cache_query_hash'), table_name='search_cache')
    op.drop_table('search_cache')
    
    op.drop_index(op.f('ix_saved_searches_created_at'), table_name='saved_searches')
    op.drop_index(op.f('ix_saved_searches_user_id'), table_name='saved_searches')
    op.drop_table('saved_searches')