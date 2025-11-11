import uuid
from urllib.parse import quote

from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = f"test_{uuid.uuid4().hex}@example.com"

    # Signup
    signup = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert signup.status_code == 200, signup.text
    assert "Signed up" in signup.json().get("message", "")

    # Verify participant was added
    after = client.get("/activities").json()
    assert email in after[activity]["participants"]

    # Remove participant
    remove = client.delete(f"/activities/{quote(activity)}/participants?email={quote(email)}")
    assert remove.status_code == 200, remove.text
    assert "Unregistered" in remove.json().get("message", "")

    # Verify participant was removed
    final = client.get("/activities").json()
    assert email not in final[activity]["participants"]
