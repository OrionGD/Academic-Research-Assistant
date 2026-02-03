"""Add analytics and usage tracking tables

Revision ID: 003_add_analytics_tables
Revises: 002_add_vector_indexes
Create Date: 2024-01-25 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_analytics_tables'
down_revision = '002_add_vector_indexes'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # User activity logs
    op.create_table('user_activities',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('activity_type', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=100), nullable=True),
        sa.Column('resource_id', sa.UUID(), nullable=True),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_activities_created_at'), 'user_activities', ['created_at'], unique=False)
    op.create_index(op.f('ix_user_activities_user_id'), 'user_activities', ['user_id'], unique=False)
    op.create_index('ix_user_activities_type_date', 'user_activities', 
        ['activity_type', 'created_at'], unique=False)
    
    # Document usage statistics
    op.create_table('document_usage',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('document_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('page_views', sa.Integer(), nullable=True),
        sa.Column('search_queries', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_document_usage_document_id'), 'document_usage', ['document_id'], unique=False)
    op.create_index('ix_document_usage_date_action', 'document_usage', 
        ['created_at', 'action'], unique=False)
    
    # System metrics table
    op.create_table('system_metrics',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('metric_name', sa.String(length=100), nullable=False),
        sa.Column('metric_value', sa.Float(), nullable=False),
        sa.Column('metric_type', sa.String(length=50), nullable=True),
        sa.Column('labels', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('recorded_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_metrics_metric_name'), 'system_metrics', ['metric_name'], unique=False)
    op.create_index(op.f('ix_system_metrics_recorded_at'), 'system_metrics', ['recorded_at'], unique=False)
    op.create_index('ix_system_metrics_name_date', 'system_metrics', 
        ['metric_name', 'recorded_at'], unique=False)
    
    # LLM usage tracking
    op.create_table('llm_usage',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=False),
        sa.Column('input_tokens', sa.Integer(), nullable=False),
        sa.Column('output_tokens', sa.Integer(), nullable=False),
        sa.Column('total_tokens', sa.Integer(), nullable=False),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('request_duration', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_llm_usage_created_at'), 'llm_usage', ['created_at'], unique=False)
    op.create_index(op.f('ix_llm_usage_user_id'), 'llm_usage', ['user_id'], unique=False)
    op.create_index('ix_llm_usage_provider_model', 'llm_usage', 
        ['provider', 'model'], unique=False)
    
    # Add usage columns to users table
    op.add_column('users',
        sa.Column('document_count', sa.Integer(), nullable=True, default=0))
    op.add_column('users',
        sa.Column('total_queries', sa.Integer(), nullable=True, default=0))
    op.add_column('users',
        sa.Column('last_active_at', sa.DateTime(), nullable=True))
    
    # Create materialized view for daily statistics
    op.execute("""
        CREATE MATERIALIZED VIEW daily_statistics AS
        SELECT 
            DATE(created_at) as date,
            COUNT(DISTINCT user_id) as active_users,
            COUNT(*) as total_activities,
            COUNT(DISTINCT document_id) as documents_accessed,
            SUM(CASE WHEN activity_type = 'search' THEN 1 ELSE 0 END) as search_count,
            SUM(CASE WHEN activity_type = 'document_upload' THEN 1 ELSE 0 END) as upload_count
        FROM user_activities
        GROUP BY DATE(created_at)
        ORDER BY date DESC;
    """)
    
    op.execute("CREATE INDEX ix_daily_statistics_date ON daily_statistics (date);")


def downgrade() -> None:
    # Drop materialized view
    op.execute("DROP MATERIALIZED VIEW IF EXISTS daily_statistics;")
    
    # Drop columns from users table
    op.drop_column('users', 'last_active_at')
    op.drop_column('users', 'total_queries')
    op.drop_column('users', 'document_count')
    
    # Drop tables
    op.drop_index('ix_llm_usage_provider_model', table_name='llm_usage')
    op.drop_index(op.f('ix_llm_usage_user_id'), table_name='llm_usage')
    op.drop_index(op.f('ix_llm_usage_created_at'), table_name='llm_usage')
    op.drop_table('llm_usage')
    
    op.drop_index('ix_system_metrics_name_date', table_name='system_metrics')
    op.drop_index(op.f('ix_system_metrics_recorded_at'), table_name='system_metrics')
    op.drop_index(op.f('ix_system_metrics_metric_name'), table_name='system_metrics')
    op.drop_table('system_metrics')
    
    op.drop_index('ix_document_usage_date_action', table_name='document_usage')
    op.drop_index(op.f('ix_document_usage_document_id'), table_name='document_usage')
    op.drop_table('document_usage')
    
    op.drop_index('ix_user_activities_type_date', table_name='user_activities')
    op.drop_index(op.f('ix_user_activities_user_id'), table_name='user_activities')
    op.drop_index(op.f('ix_user_activities_created_at'), table_name='user_activities')
    op.drop_table('user_activities')