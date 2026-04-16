"""add sections structure

Revision ID: 9f1b2c3d4e5f
Revises: 9e2f3a4b5c6d
Create Date: 2026-04-16 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

revision = '9f1b2c3d4e5f'
down_revision = '9e2f3a4b5c6d'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Create sections table
    op.create_table('sections',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('paper_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('total_marks', sa.Integer(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['paper_id'], ['papers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Add section_id to paper_questions, nullable initially
    op.add_column('paper_questions', sa.Column('section_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_paper_questions_section_id', 'paper_questions', 'sections', ['section_id'], ['id'])

    # 3. Data Migration: Create a default section for each existing paper
    connection = op.get_bind()
    papers = connection.execute(sa.text("SELECT id FROM papers")).fetchall()
    
    for paper in papers:
        section_id = uuid.uuid4()
        # insert section A
        connection.execute(sa.text(
            "INSERT INTO sections (id, paper_id, title, order_index) VALUES (:id, :paper_id, 'Section A', 0)"
        ), {"id": section_id, "paper_id": paper[0]})
        
        # assign existing questions to this section
        connection.execute(sa.text(
            "UPDATE paper_questions SET section_id = :section_id WHERE paper_id = :paper_id"
        ), {"section_id": section_id, "paper_id": paper[0]})

    # 4. Alter section_id to be strictly NOT NULL
    op.alter_column('paper_questions', 'section_id', existing_type=postgresql.UUID(as_uuid=True), nullable=False)


def downgrade():
    op.drop_constraint('fk_paper_questions_section_id', 'paper_questions', type_='foreignkey')
    op.drop_column('paper_questions', 'section_id')
    op.drop_table('sections')
