"""Add is_parent_only manually

Revision ID: 6bab4e0a0a40
Revises: 
Create Date: 2026-02-15 03:57:48.653888

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6bab4e0a0a40'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('budget_categories', sa.Column('is_parent_only', sa.Boolean(), nullable=True))
    op.execute("UPDATE budget_categories SET is_parent_only = false WHERE is_parent_only IS NULL")
    op.alter_column('budget_categories', 'is_parent_only', nullable=False)


def downgrade():
    op.drop_column('budget_categories', 'is_parent_only')
