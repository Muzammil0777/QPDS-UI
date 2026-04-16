"""add ai log table

Revision ID: a1b2c3d4e5f6
Revises: 9f1b2c3d4e5f
Create Date: 2026-04-16 11:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

revision = 'a1b2c3d4e5f6'
down_revision = '9f1b2c3d4e5f'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('ai_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('admin_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('input_prompt', sa.Text(), nullable=False),
        sa.Column('generated_text', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['admin_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_logs_admin_user_id'), 'ai_logs', ['admin_user_id'], unique=False)
    op.create_index(op.f('ix_ai_logs_question_id'), 'ai_logs', ['question_id'], unique=False)
    op.create_index(op.f('ix_ai_logs_timestamp'), 'ai_logs', ['timestamp'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_ai_logs_timestamp'), table_name='ai_logs')
    op.drop_index(op.f('ix_ai_logs_question_id'), table_name='ai_logs')
    op.drop_index(op.f('ix_ai_logs_admin_user_id'), table_name='ai_logs')
    op.drop_table('ai_logs')
