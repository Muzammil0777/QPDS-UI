"""add paper questions and status

Revision ID: 9e2f3a4b5c6d
Revises: 9d1a2b3c4d5e
Create Date: 2026-04-14 15:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '9e2f3a4b5c6d'
down_revision = '9d1a2b3c4d5e'
branch_labels = None
depends_on = None

def upgrade():
    # add status column to papers
    op.add_column('papers', sa.Column('status', sa.String(length=20), server_default='DRAFT', nullable=False))
    
    # create paper_questions table
    op.create_table('paper_questions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('paper_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('paper_id', 'question_id', name='unique_paper_question')
    )

def downgrade():
    op.drop_table('paper_questions')
    op.drop_column('papers', 'status')
