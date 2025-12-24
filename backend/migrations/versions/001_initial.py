"""initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='student'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    
    op.create_table(
        'incidents',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    op.create_index('ix_incidents_id', 'incidents', ['id'])
    op.create_index('ix_incidents_user_id', 'incidents', ['user_id'])
    op.create_index('idx_incident_location', 'incidents', ['lat', 'lng'])
    
    op.create_table(
        'sos_logs',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
    )
    op.create_index('ix_sos_logs_id', 'sos_logs', ['id'])
    op.create_index('ix_sos_logs_user_id', 'sos_logs', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_sos_logs_user_id', table_name='sos_logs')
    op.drop_index('ix_sos_logs_id', table_name='sos_logs')
    op.drop_table('sos_logs')
    
    op.drop_index('idx_incident_location', table_name='incidents')
    op.drop_index('ix_incidents_user_id', table_name='incidents')
    op.drop_index('ix_incidents_id', table_name='incidents')
    op.drop_table('incidents')
    
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_id', table_name='users')
    op.drop_table('users')

