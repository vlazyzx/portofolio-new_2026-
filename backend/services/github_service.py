from datetime import datetime, timedelta, timezone
import logging
import time

import requests


GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
GITHUB_CONTRIBUTIONS_DAYS = 365
GITHUB_REQUEST_TIMEOUT = 20
GITHUB_MAX_ATTEMPTS = 2
LOGGER = logging.getLogger(__name__)


def _github_datetime(value: datetime) -> str:
    return value.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _build_contribution_window() -> tuple[str, str]:
    to = datetime.now(timezone.utc)
    from_time = to - timedelta(days=GITHUB_CONTRIBUTIONS_DAYS)
    return _github_datetime(from_time), _github_datetime(to)


def _build_query_payload(username: str) -> dict:
    from_time, to = _build_contribution_window()
    return {
        "query": """
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
        """,
        "variables": {
            "username": username,
            "from": from_time,
            "to": to,
        },
    }


def _request_github_graphql(username: str, token: str) -> dict:
    last_error = None

    for attempt in range(1, GITHUB_MAX_ATTEMPTS + 1):
        try:
            LOGGER.info("GitHub live fetch attempt=%s username=%s", attempt, username)
            response = requests.post(
                GITHUB_GRAPHQL_URL,
                json=_build_query_payload(username),
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "User-Agent": "ikhsan-portfolio-backend",
                },
                timeout=GITHUB_REQUEST_TIMEOUT,
            )
            LOGGER.info(
                "GitHub live fetch response status=%s username=%s ratelimit_remaining=%s ratelimit_reset=%s retry_after=%s",
                response.status_code,
                username,
                response.headers.get("x-ratelimit-remaining", "-"),
                response.headers.get("x-ratelimit-reset", "-"),
                response.headers.get("retry-after", "-"),
            )
            response.raise_for_status()
            payload = response.json()

            if payload.get("errors"):
                LOGGER.error(
                    "GitHub GraphQL returned errors username=%s attempt=%s errors=%s",
                    username,
                    attempt,
                    str(payload["errors"])[:800],
                )
                raise RuntimeError(f"GitHub GraphQL errors: {payload['errors']}")

            data = payload.get("data") or {}
            user = data.get("user")
            if not isinstance(user, dict):
                LOGGER.error(
                    "GitHub user response kosong username=%s attempt=%s data=%s",
                    username,
                    attempt,
                    str(data)[:800],
                )
                raise RuntimeError(f"GitHub user response kosong untuk '{username}'.")

            LOGGER.info("GitHub live fetch success username=%s attempt=%s", username, attempt)
            return payload
        except requests.RequestException as error:
            response = getattr(error, "response", None)
            body_preview = "-"
            if response is not None:
                try:
                    body_preview = response.text[:800]
                except Exception:
                    body_preview = "<body-unavailable>"
            LOGGER.error(
                "GitHub live fetch request error username=%s attempt=%s error=%s body=%s",
                username,
                attempt,
                error,
                body_preview,
            )
            last_error = error
            if attempt < GITHUB_MAX_ATTEMPTS:
                LOGGER.info("GitHub live fetch retrying username=%s next_attempt=%s", username, attempt + 1)
                time.sleep(0.8)
        except (ValueError, RuntimeError) as error:
            LOGGER.error(
                "GitHub live fetch parse/runtime error username=%s attempt=%s error=%s",
                username,
                attempt,
                error,
            )
            last_error = error
            if attempt < GITHUB_MAX_ATTEMPTS:
                LOGGER.info("GitHub live fetch retrying username=%s next_attempt=%s", username, attempt + 1)
                time.sleep(0.8)

    raise RuntimeError(f"GitHub fetch gagal setelah {GITHUB_MAX_ATTEMPTS} percobaan: {last_error}")


def fetch_github_contributions(username: str, token: str) -> dict:
    payload = _request_github_graphql(username, token)
    user = payload["data"]["user"]
    contributions = user.get("contributionsCollection") or {}
    calendar = contributions.get("contributionCalendar") or {}
    weeks = calendar.get("weeks") if isinstance(calendar.get("weeks"), list) else []

    days = [
        {
            "date": day.get("date", ""),
            "count": day.get("contributionCount", 0),
            "color": day.get("color", "#1f2937"),
        }
        for week in weeks
        if isinstance(week, dict)
        for day in week.get("contributionDays", [])
        if isinstance(day, dict)
    ]

    return {
        "user": {
            "login": user.get("login", username),
            "name": user.get("name"),
            "avatarUrl": user.get("avatarUrl"),
        },
        "totalContributions": calendar.get("totalContributions", 0),
        "days": days,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "source": "live",
    }
