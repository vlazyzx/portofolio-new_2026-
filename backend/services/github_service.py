from datetime import datetime, timezone

import requests


GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
GITHUB_CONTRIBUTIONS_FROM = "2024-06-17T00:00:00Z"


def fetch_github_contributions(username: str, token: str) -> dict:
    query = """
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        login
        name
        avatarUrl
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
    """

    response = requests.post(
        GITHUB_GRAPHQL_URL,
        json={
            "query": query,
            "variables": {
                "username": username,
                "from": GITHUB_CONTRIBUTIONS_FROM,
                "to": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            },
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=15,
    )
    response.raise_for_status()
    payload = response.json()

    if payload.get("errors"):
        raise RuntimeError(payload["errors"])

    user = payload["data"]["user"]
    calendar = user["contributionsCollection"]["contributionCalendar"]
    days = [
        {
            "date": day["date"],
            "count": day["contributionCount"],
            "color": day["color"],
        }
        for week in calendar["weeks"]
        for day in week["contributionDays"]
    ]

    return {
        "user": {
            "login": user["login"],
            "name": user["name"],
            "avatarUrl": user["avatarUrl"],
        },
        "totalContributions": calendar["totalContributions"],
        "days": days,
    }
