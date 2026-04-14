"""add paper usage models

Revision ID: 9d1a2b3c4d5e
Revises: 8c9993cfe621
Create Date: 2026-04-14 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '9d1a2b3c4d5e'
down_revision = '8c9993cfe621'
branch_labels = None
depends_on = None

def upgrade():
    # Create papers table
    op.create_table('papers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create question_usages table
    op.create_table('question_usages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('paper_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subject_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('question_id', 'paper_id', name='unique_question_paper_usage')
    )
    
    # Add indexes for performance optimization
    op.create_index(op.f('ix_question_usages_question_id'), 'question_usages', ['question_id'], unique=False)
    op.create_index(op.f('ix_question_usages_subject_id'), 'question_usages', ['subject_id'], unique=False)
    op.create_index(op.f('ix_question_usages_used_at'), 'question_usages', ['used_at'], unique=False)


def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_question_usages_used_at'), table_name='question_usages')
    op.drop_index(op.f('ix_question_usages_subject_id'), table_name='question_usages')
    op.drop_index(op.f('ix_question_usages_question_id'), table_name='question_usages')
    
    # Drop tables
    op.drop_table('question_usages')
    op.drop_table('papers')
