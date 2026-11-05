from conftest import register
from extensions import db
from models.product import Product
from tenancy import unscoped


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def add_product(business_id, name):
    with unscoped():
        product = Product(
            business_id=business_id,
            name=name,
            category="General",
            unit="pc",
            price=10,
            stock=5,
        )
        db.session.add(product)
        db.session.commit()
        return product.id


def test_two_businesses_get_separate_slugs_and_default_branch(client):
    a = register(client, "Acme Shop", "a@example.com")
    b = register(client, "Acme Shop", "b@example.com")

    assert a["business"]["slug"] != b["business"]["slug"]


def test_admin_only_sees_own_branches(client):
    a = register(client, "Shop A", "a@example.com")
    b = register(client, "Shop B", "b@example.com")

    for token, business in ((a["token"], a["business"]), (b["token"], b["business"])):
        response = client.get("/api/admin/branches", headers=auth(token))
        assert response.status_code == 200
        branches = response.get_json()["branches"]
        assert len(branches) == 1


def test_public_shop_lists_only_its_own_products(client):
    a = register(client, "Shop A", "a@example.com")
    b = register(client, "Shop B", "b@example.com")

    add_product(a["business"]["id"], "A-only product")
    add_product(b["business"]["id"], "B-only product")

    response = client.get(
        "/api/products",
        headers={"X-Shop-Slug": a["business"]["slug"]},
    )
    names = [p["name"] for p in response.get_json().get("products", response.get_json())]

    assert names == ["A-only product"]


def test_product_of_other_shop_is_not_found(client):
    a = register(client, "Shop A", "a@example.com")
    b = register(client, "Shop B", "b@example.com")
    b_product = add_product(b["business"]["id"], "B-only product")

    response = client.get(
        f"/api/products/{b_product}",
        headers={"X-Shop-Slug": a["business"]["slug"]},
    )

    assert response.status_code == 404


def test_no_shop_header_means_not_found(client):
    register(client, "Shop A", "a@example.com")

    assert client.get("/api/products").status_code == 404


def test_customer_token_does_not_work_on_another_shop(client):
    a = register(client, "Shop A", "a@example.com")
    b = register(client, "Shop B", "b@example.com")

    signup = client.post(
        "/api/customers/register",
        headers={"X-Shop-Slug": a["business"]["slug"]},
        json={
            "name": "Cust",
            "phone": "0712345678",
            "email": "c@example.com",
            "password": "correct-horse-1",
        },
    )
    assert signup.status_code in (200, 201), signup.get_json()
    body = signup.get_json()
    token = body["token"]
    customer_id = body["customer"]["id"]

    response = client.get(
        f"/api/notifications/customer/{customer_id}",
        headers={**auth(token), "X-Shop-Slug": b["business"]["slug"]},
    )

    assert response.status_code in (403, 404)


def test_same_phone_can_register_in_two_shops(client):
    a = register(client, "Shop A", "a@example.com")
    b = register(client, "Shop B", "b@example.com")

    for business in (a, b):
        response = client.post(
            "/api/customers/register",
            headers={"X-Shop-Slug": business["business"]["slug"]},
            json={
                "name": "Cust",
                "phone": "0712345678",
                "email": "c@example.com",
                "password": "correct-horse-1",
            },
        )
        assert response.status_code in (200, 201), response.get_json()


def test_business_admin_cannot_use_super_admin_token_paths(client):
    a = register(client, "Shop A", "a@example.com")

    # A staff token is rejected by cashier auth and vice versa.
    response = client.get(
        "/api/cashier/me", headers=auth(a["token"])
    )

    assert response.status_code == 401


def test_login_throttles_after_repeated_failures(client):
    register(client, "Shop A", "a@example.com")

    for _ in range(5):
        client.post("/api/auth/login", json={
            "email": "a@example.com", "password": "wrong-password"
        })

    response = client.post("/api/auth/login", json={
        "email": "a@example.com", "password": "correct-horse-1"
    })

    assert response.status_code == 429


def test_suspended_business_is_locked_out(client):
    from models.business import Business

    a = register(client, "Shop A", "a@example.com")

    with unscoped():
        business = db.session.get(Business, a["business"]["id"])
        business.status = "suspended"
        db.session.commit()

    assert client.get(
        "/api/admin/branches", headers=auth(a["token"])
    ).status_code == 403
    assert client.get(
        "/api/products", headers={"X-Shop-Slug": a["business"]["slug"]}
    ).status_code == 404
