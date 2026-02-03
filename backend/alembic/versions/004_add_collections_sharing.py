"""Add document collections and sharing features

Revision ID: 004_add_collections_sharing
Revises: 003_add_analytics_tables
Create Date: 2024-02-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004_add_collections_sharing'
down_revision = '003_add_analytics_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Document collections
    op.create_table('collections',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_collections_user_id'), 'collections', ['user_id'], unique=False)
    op.create_index(op.f('ix_collections_created_at'), 'collections', ['created_at'], unique=False)
    
    # Collection documents mapping
    op.create_table('collection_documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('collection_id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.Column('added_by', sa.UUID(), nullable=True),
        sa.Column('added_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['added_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['collection_id'], ['collections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('collection_id', 'document_id', name='uq_collection_document')
    )
    op.create_index(op.f('ix_collection_documents_collection_id'), 'collection_documents', ['collection_id'], unique=False)
    op.create_index(op.f('ix_collection_documents_document_id'), 'collection_documents', ['document_id'], unique=False)
    
    # Document sharing (individual document permissions)
    op.create_table('document_shares',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.Column('shared_by', sa.UUID(), nullable=False),
        sa.Column('shared_with', sa.UUID(), nullable=False),
        sa.Column('permission_level', sa.String(length=50), nullable=False),  # view, edit, manage
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_by'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_with'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_id', 'shared_with', name='uq_document_share')
    )
    op.create_index(op.f('ix_document_shares_document_id'), 'document_shares', ['document_id'], unique=False)
    op.create_index(op.f('ix_document_shares_shared_with'), 'document_shares', ['shared_with'], unique=False)
    
    # Collection sharing
    op.create_table('collection_shares',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('collection_id', sa.UUID(), nullable=False),
        sa.Column('shared_by', sa.UUID(), nullable=False),
        sa.Column('shared_with', sa.UUID(), nullable=False),
        sa.Column('permission_level', sa.String(length=50), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['collection_id'], ['collections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_by'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['shared_with'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('collection_id', 'shared_with', name='uq_collection_share')
    )
    op.create_index(op.f('ix_collection_shares_collection_id'), 'collection_shares', ['collection_id'], unique=False)
    op.create_index(op.f('ix_collection_shares_shared_with'), 'collection_shares', ['shared_with'], unique=False)
    
    # Add tags support to documents
    op.create_table('tags',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_user_tag')
    )
    op.create_index(op.f('ix_tags_user_id'), 'tags', ['user_id'], unique=False)
    
    # Document tags mapping
    op.create_table('document_tags',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.Column('tag_id', sa.UUID(), nullable=False),
        sa.Column('added_by', sa.UUID(), nullable=True),
        sa.Column('added_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['added_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_id', 'tag_id', name='uq_document_tag')
    )
    op.create_index(op.f('ix_document_tags_document_id'), 'document_tags', ['document_id'], unique=False)
    op.create_index(op.f('ix_document_tags_tag_id'), 'document_tags', ['tag_id'], unique=False)
    
    # Add favorites support
    op.add_column('documents',
        sa.Column('favorite_count', sa.Integer(), nullable=True, default=0))
    
    # User favorites
    op.create_table('user_favorites',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'document_id', name='uq_user_favorite')
    )
    op.create_index(op.f('ix_user_favorites_user_id'), 'user_favorites', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_favorites_document_id'), 'user_favorites', ['document_id'], unique=False)


def downgrade() -> None:
    # Drop favorites tables and columns
    op.drop_index(op.f('ix_user_favorites_document_id'), table_name='user_favorites')
    op.drop_index(op.f('ix_user_favorites_user_id'), table_name='user_favorites')
    op.drop_table('user_favorites')
    op.drop_column('documents', 'favorite_count')
    
    # Drop tags tables
    op.drop_index(op.f('ix_document_tags_tag_id'), table_name='document_tags')
    op.drop_index(op.f('ix_document_tags_document_id'), table_name='document_tags')
    op.drop_table('document_tags')
    op.drop_index(op.f('ix_tags_user_id'), table_name='tags')
    op.drop_table('tags')
    
    # Drop sharing tables
    op.drop_index(op.f('ix_collection_shares_shared_with'), table_name='collection_shares')
    op.drop_index(op.f('ix_collection_shares_collection_id'), table_name='collection_shares')
    op.drop_table('collection_shares')
    op.drop_index(op.f('ix_document_shares_shared_with'), table_name='document_shares')
    op.drop_index(op.f('ix_document_shares_document_id'), table_name='document_shares')
    op.drop_table('document_shares')
    
    # Drop collections tables
    op.drop_index(op.f('ix_collection_documents_document_id'), table_name='collection_documents')
    op.drop_index(op.f('ix_collection_documents_collection_id'), table_name='collection_documents')
    op.drop_table('collection_documents')
    op.drop_index(op.f('ix_collections_created_at'), table_name='collections')
    op.drop_index(op.f('ix_collections_user_id'), table_name='collections')
    op.drop_table('collections')