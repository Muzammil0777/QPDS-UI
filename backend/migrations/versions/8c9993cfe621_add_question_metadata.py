"""add question metadata

Revision ID: 8c9993cfe621
Revises: 7b8882bfe510
Create Date: 2026-04-14 14:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '8c9993cfe621'
down_revision = '7b8882bfe510'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Add source and difficulty columns (initially nullable to avoid constraint errors)
    op.add_column('questions', sa.Column('source', sa.String(length=10), nullable=True))
    op.add_column('questions', sa.Column('difficulty', sa.String(length=10), nullable=True))
    
    # 2. Set default values for existing rows
    op.execute("UPDATE questions SET source = 'MANUAL' WHERE source IS NULL")
    op.execute("UPDATE questions SET difficulty = 'MEDIUM' WHERE difficulty IS NULL")
    
    # 3. Fix existing questions with no creator_id (fallback to first ADMIN user)
    op.execute('''
        UPDATE questions 
        SET creator_id = (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1) 
        WHERE creator_id IS NULL
    ''')

    # 4. Enforce NOT NULL constraints
    op.alter_column('questions', 'source', existing_type=sa.String(length=10), nullable=False)
    op.alter_column('questions', 'difficulty', existing_type=sa.String(length=10), nullable=False)
    # SQLAlchemy db.Uuid translates to postgresql.UUID
    op.alter_column('questions', 'creator_id', existing_type=postgresql.UUID(), nullable=False)

def downgrade():
    op.alter_column('questions', 'creator_id', existing_type=postgresql.UUID(), nullable=True)
    op.drop_column('questions', 'difficulty')
    op.drop_column('questions', 'source')
