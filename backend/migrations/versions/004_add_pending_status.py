"""add pending status for incidents

Revision ID: 004_add_pending_status
Revises: 002_add_features
Create Date: 2024-01-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '004_add_pending_status'
down_revision = '002_add_features'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("UPDATE incidents SET status = 'pending' WHERE status = 'active'")
    op.execute("UPDATE incidents SET status = 'active' WHERE status = 'active' AND id IN (SELECT id FROM incidents LIMIT 0)")


def downgrade() -> None:
    op.execute("UPDATE incidents SET status = 'active' WHERE status = 'pending'")

