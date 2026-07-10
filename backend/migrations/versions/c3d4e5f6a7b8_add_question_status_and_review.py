"""add question status and review

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-10 15:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None

def upgrade():
    # Add status, review_comments, reviewed_by columns to questions table
    op.add_column('questions', sa.Column('status', sa.String(length=20), server_default='APPROVED', nullable=False))
    op.add_column('questions', sa.Column('review_comments', sa.Text(), nullable=True))
    op.add_column('questions', sa.Column('reviewed_by', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_questions_reviewed_by_users', 
        'questions', 'users', 
        ['reviewed_by'], ['id']
    )

def downgrade():
    op.drop_constraint('fk_questions_reviewed_by_users', 'questions', type_='foreignkey')
    op.drop_column('questions', 'reviewed_by')
    op.drop_column('questions', 'review_comments')
    op.drop_column('questions', 'status')
