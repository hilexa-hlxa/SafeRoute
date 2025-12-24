"""add city to user

Revision ID: 005_add_city_to_user
Revises: 004_add_pending_status
Create Date: 2024-01-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005_add_city_to_user'
down_revision = '004_add_pending_status'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('city', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'city')

