"""Operator commands. Run from the backend folder:

    flask --app app seed-plans
    flask --app app create-super-admin you@example.com

The password is read from the SUPER_ADMIN_PASSWORD environment variable
or prompted for, never taken from the command line.
"""

import os

import click

from extensions import db
from models.user import User
from plans import ensure_default_plans
from tenancy import unscoped


def register(app):
    @app.cli.command("seed-plans")
    def seed_plans():
        """Create the default subscription plans (idempotent)."""
        ensure_default_plans()
        db.session.commit()
        click.echo("Plans are in place.")

    @app.cli.command("create-super-admin")
    @click.argument("email")
    @click.option("--name", default="Platform Admin")
    def create_super_admin(email, name):
        """Create the platform owner login."""
        email = email.strip().lower()
        password = os.getenv("SUPER_ADMIN_PASSWORD") or click.prompt(
            "Password", hide_input=True, confirmation_prompt=True
        )

        if len(password) < 12:
            raise click.ClickException(
                "Use at least 12 characters for the platform admin."
            )

        with unscoped():
            if User.query.filter_by(email=email).first():
                raise click.ClickException("That email already exists.")

            user = User(
                email=email,
                full_name=name,
                role="super_admin",
                business_id=None,
            )
            user.set_password(password)
            db.session.add(user)
            db.session.commit()

        click.echo(f"Super admin {email} created.")
