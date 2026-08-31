import json
from datetime import datetime, timezone

import pytest

from contracts.rainline_logic import (
    buy_deadline,
    can_buy,
    can_cancel,
    can_resolve,
    compare_trigger,
    consensus_payload,
    decide_status,
    evidence_url,
    extract_observation,
    extra_reserve,
    format_coord,
    parse_coverage_date,
    parse_iso_datetime,
    payout_amount,
)


SAMPLE = {
    "daily": {
        "time": ["2026-08-20"],
        "precipitation_sum": [16.2],
        "temperature_2m_max": [29.0],
    }
}


def test_url_is_pinned_host_and_not_user_supplied():
    url = evidence_url("19.0760", "72.8777", "2026-08-20", "RAIN")
    assert url.startswith("https://historical-forecast-api.open-meteo.com/v1/forecast")
    assert "daily=precipitation_sum" in url
    assert "start_date=2026-08-20" in url
    assert "end_date=2026-08-20" in url


def test_heat_uses_temperature_field():
    url = evidence_url("19.0760", "72.8777", "2026-08-20", "HEAT")
    assert "daily=temperature_2m_max" in url


def test_buy_cutoff_is_24h_before_date():
    deadline = buy_deadline("2026-08-22")
    assert deadline.isoformat().startswith("2026-08-21T00:00:00")
    early = datetime(2026, 8, 20, 23, 59, tzinfo=timezone.utc)
    late = datetime(2026, 8, 21, 0, 0, 1, tzinfo=timezone.utc)
    assert can_buy(early, "2026-08-22")
    assert not can_buy(late, "2026-08-22")


def test_resolve_only_after_day_closes():
    before = datetime(2026, 8, 21, 23, 0, tzinfo=timezone.utc)
    during = datetime(2026, 8, 22, 23, 0, tzinfo=timezone.utc)
    after = datetime(2026, 8, 23, 0, 0, tzinfo=timezone.utc)
    assert not can_resolve(during, "2026-08-22")
    assert can_resolve(after, "2026-08-22")
    assert can_cancel(before, "2026-08-22")
    assert not can_cancel(during, "2026-08-22")
    assert not can_cancel(after, "2026-08-22")


def test_extract_and_compare_rain():
    observed = extract_observation(SAMPLE, "2026-08-20", "RAIN")
    assert observed == 16200
    assert compare_trigger("RAIN", observed, 25000) is False
    assert compare_trigger("RAIN", observed, 16000) is True
    assert compare_trigger("DRY", observed, 20000) is True
    assert compare_trigger("DRY", observed, 10000) is False


def test_missing_or_null_is_insufficient():
    bad = {"daily": {"time": ["2026-08-20"], "precipitation_sum": [None]}}
    with pytest.raises(ValueError):
        extract_observation(bad, "2026-08-20", "RAIN")
    assert decide_status(False, "RAIN", None, 1000) == "INSUFFICIENT"
    assert decide_status(True, "RAIN", 30000, 25000) == "PAY"
    assert decide_status(True, "RAIN", 10000, 25000) == "KEEP"


def test_payout_ratio_and_reserve():
    premium = 10**18
    assert payout_amount(premium) == 4 * 10**18
    assert extra_reserve(premium) == 3 * 10**18


def test_coords_normalized():
    assert format_coord("19.076", "lat") == "19.0760"
    with pytest.raises(ValueError):
        format_coord("91", "lat")


def test_consensus_object_excludes_essay():
    blob = consensus_payload("PAY", 16200, 4 * 10**18)
    data = json.loads(blob)
    assert set(data.keys()) == {"amount_wei", "observed_milli", "status"}


def test_parse_tx_datetime():
    dt = parse_iso_datetime("2026-08-26T06:52:00Z")
    assert dt.tzinfo is not None
    parse_coverage_date("2026-08-26")
    with pytest.raises(ValueError):
        parse_coverage_date("26-08-2026")
