import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ADMIN_TOKEN_SECRET"] = "test-admin-secret"
os.environ["CASHIER_TOKEN_SECRET"] = "test-cashier-secret"
os.environ["CUSTOMER_TOKEN_SECRET"] = "test-customer-secret"

from app import app as flask_app  # noqa: E402
from extensions import db  # noqa: E402


@pytest.fixture()
def app():
    flask_app.config.update(
        TESTING=True,
        SQLALCHEMY_ENGINE_OPTIONS={},
    )

    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def register(client, name, email):
    response = client.post("/api/auth/register-business", json={
        "business_name": name,
        "owner_name": "Owner",
        "email": email,
        "password": "correct-horse-1",
        "business_type": "general_retail",
    })
    assert response.status_code == 201, response.get_json()

    return response.get_json()
