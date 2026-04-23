"""add bloom_level to questions

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-23 23:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None

def upgrade():
    # Add bloom_level column with default 'understand'
    op.add_column('questions', sa.Column('bloom_level', sa.String(length=20), server_default='understand', nullable=False))

def downgrade():
    op.drop_column('questions', 'bloom_level')
