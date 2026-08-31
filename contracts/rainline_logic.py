"""Pure helpers shared with tests. The Intelligent Contract inlines the same rules."""

from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
from typing import Any

TEMPLATES = ("RAIN", "DRY", "HEAT")
TEMPLATE_FIELD = {
    "RAIN": "precipitation_sum",
    "DRY": "precipitation_sum",
    "HEAT": "temperature_2m_max",
}
TEMPLATE_UNIT = {
    "RAIN": "mm",
    "DRY": "mm",
    "HEAT": "C",
}

SOURCE_HOST = "historical-forecast-api.open-meteo.com"
SOURCE_PATH = "/v1/forecast"
PAYOUT_RATIO = 4
MIN_PREMIUM_WEI = 10**16  # 0.01 GEN
MAX_PREMIUM_WEI = 10 * 10**18  # 10 GEN
BUY_CUTOFF_HOURS = 24
LAT_MIN, LAT_MAX = -90.0, 90.0
LON_MIN, LON_MAX = -180.0, 180.0
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def parse_iso_datetime(raw: str) -> datetime:
    text = (raw or "").strip()
    if not text:
        raise ValueError("empty datetime")
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    dt = datetime.fromisoformat(text)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def parse_coverage_date(value: str) -> datetime:
    if not DATE_RE.match(value or ""):
        raise ValueError("coverage_date must be YYYY-MM-DD")
    return datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)


def format_coord(raw: str, kind: str) -> str:
    try:
        num = float(str(raw).strip())
    except (TypeError, ValueError) as exc:
        raise ValueError(f"invalid {kind}") from exc
    lo, hi = (LAT_MIN, LAT_MAX) if kind == "lat" else (LON_MIN, LON_MAX)
    if num < lo or num > hi:
        raise ValueError(f"{kind} out of range")
    return f"{num:.4f}"


def evidence_url(lat: str, lon: str, coverage_date: str, template: str) -> str:
    field = TEMPLATE_FIELD[template]
    return (
        f"https://{SOURCE_HOST}{SOURCE_PATH}"
        f"?latitude={lat}&longitude={lon}"
        f"&start_date={coverage_date}&end_date={coverage_date}"
        f"&daily={field}&timezone=UTC"
    )


def buy_deadline(coverage_date: str) -> datetime:
    start = parse_coverage_date(coverage_date)
    return start - timedelta(hours=BUY_CUTOFF_HOURS)


def resolve_opens_at(coverage_date: str) -> datetime:
    start = parse_coverage_date(coverage_date)
    return start + timedelta(days=1)


def can_buy(now: datetime, coverage_date: str) -> bool:
    return now <= buy_deadline(coverage_date)


def can_resolve(now: datetime, coverage_date: str) -> bool:
    return now >= resolve_opens_at(coverage_date)


def can_cancel(now: datetime, coverage_date: str) -> bool:
    return now < parse_coverage_date(coverage_date)


def payout_amount(premium_wei: int) -> int:
    return premium_wei * PAYOUT_RATIO


def extra_reserve(premium_wei: int) -> int:
    return payout_amount(premium_wei) - premium_wei


def compare_trigger(template: str, observed_milli: int, threshold_milli: int) -> bool:
    if template in ("RAIN", "HEAT"):
        return observed_milli >= threshold_milli
    if template == "DRY":
        return observed_milli <= threshold_milli
    raise ValueError("unknown template")


def milli_from_number(value: Any) -> int:
    if value is None:
        raise ValueError("null observation")
    num = float(value)
    if num != num:  # NaN
        raise ValueError("nan observation")
    return int(round(num * 1000))


def extract_observation(payload: Any, coverage_date: str, template: str) -> int:
    if not isinstance(payload, dict):
        raise ValueError("payload is not an object")
    daily = payload.get("daily")
    if not isinstance(daily, dict):
        raise ValueError("missing daily block")
    times = daily.get("time") or []
    field = TEMPLATE_FIELD[template]
    values = daily.get(field)
    if not isinstance(times, list) or not isinstance(values, list):
        raise ValueError("daily arrays missing")
    if coverage_date not in times:
        raise ValueError("coverage date not in series")
    idx = times.index(coverage_date)
    if idx >= len(values):
        raise ValueError("value array shorter than time array")
    return milli_from_number(values[idx])


def decide_status(fetch_ok: bool, template: str, observed_milli: int | None, threshold_milli: int) -> str:
    if not fetch_ok or observed_milli is None:
        return "INSUFFICIENT"
    hit = compare_trigger(template, observed_milli, threshold_milli)
    return "PAY" if hit else "KEEP"


def parse_llm_extract(raw: str) -> dict:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        text = re.sub(r"```$", "", text).strip()
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("llm extract is not an object")
    return data


def consensus_payload(status: str, observed_milli: int | None, amount_wei: int) -> str:
    body = {
        "amount_wei": str(amount_wei),
        "observed_milli": None if observed_milli is None else int(observed_milli),
        "status": status,
    }
    return json.dumps(body, sort_keys=True, separators=(",", ":"))
