"""add voting and resolve features

Revision ID: 002_add_features
Revises: 001_initial
Create Date: 2024-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_features'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('full_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('users', sa.Column('avatar', sa.String(), nullable=True))
    
    op.add_column('incidents', sa.Column('status', sa.String(), server_default='active', nullable=False))
    op.add_column('incidents', sa.Column('confirm_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('incidents', sa.Column('reject_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('incidents', sa.Column('resolved_at', sa.DateTime(), nullable=True))
    op.create_index('idx_incident_status', 'incidents', ['status'])
    
    op.create_table(
        'votes',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('incident_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('is_truthful', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['incident_id'], ['incidents.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.UniqueConstraint('incident_id', 'user_id', name='uq_vote_incident_user')
    )
    op.create_index('ix_votes_id', 'votes', ['id'])
    op.create_index('ix_votes_incident_id', 'votes', ['incident_id'])
    op.create_index('ix_votes_user_id', 'votes', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_votes_user_id', table_name='votes')
    op.drop_index('ix_votes_incident_id', table_name='votes')
    op.drop_index('ix_votes_id', table_name='votes')
    op.drop_table('votes')
    
    op.drop_index('idx_incident_status', table_name='incidents')
    op.drop_column('incidents', 'resolved_at')
    op.drop_column('incidents', 'reject_count')
    op.drop_column('incidents', 'confirm_count')
    op.drop_column('incidents', 'status')
    
    op.drop_column('users', 'avatar')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'full_name')

