"""add is_active and creator_id

Revision ID: 7b8882bfe510
Revises: 6a9971afd409
Create Date: 2026-04-14 13:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7b8882bfe510'
down_revision = '6a9971afd409'
branch_labels = None
depends_on = None

def upgrade():
    # Add is_active to users
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True))
    
    # Add creator_id to questions
    op.add_column('questions', sa.Column('creator_id', sa.Uuid(), nullable=True))
    op.create_foreign_key(
        'fk_questions_creator_id_users', 
        'questions', 'users', 
        ['creator_id'], ['id']
    )

def downgrade():
    # Drop constraints and columns
    op.drop_constraint('fk_questions_creator_id_users', 'questions', type_='foreignkey')
    op.drop_column('questions', 'creator_id')
    op.drop_column('users', 'is_active')
