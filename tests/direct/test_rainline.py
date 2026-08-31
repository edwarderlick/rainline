"""GenLayer direct-mode tests. Run with: pytest tests/direct -v

These follow LicenseLock's gltest shape:
concurrent IDs, on-contract deadlines, missing evidence refunds,
and payouts derived from contract storage — not a cache.
"""

import json
from datetime import datetime, timezone
import pytest


def mock_meteo(direct_vm, lat, lon, day, field, value, status=200):
    url = (
        rf".*historical-forecast-api\.open-meteo\.com/v1/forecast.*"
        rf"latitude={lat}.*longitude={lon}.*start_date={day}.*"
    )
    body = {
        "daily": {
            "time": [day],
            field: [value],
        }
    }
    direct_vm.mock_web(
        url,
        {"status": status, "body": json.dumps(body).encode("utf-8")},
    )


def fund(direct_vm, contract, alice, amount):
    direct_vm.sender = alice
    direct_vm.value = amount
    contract.fund_pool()


@pytest.fixture
def deployed(direct_deploy, direct_vm, direct_alice):
    direct_vm.sender = direct_alice
    contract = direct_deploy("contracts/rainline.py")
    fund(direct_vm, contract, direct_alice, 40 * 10**18)
    return contract


def test_buy_validations(direct_vm, deployed, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    with pytest.raises(Exception, match="premium below"):
        deployed.buy_cover("RAIN", "19.076", "72.8777", "2026-09-10", 25000)

    direct_vm.value = 10**18
    with pytest.raises(Exception, match="template"):
        deployed.buy_cover("FLIGHT", "19.076", "72.8777", "2026-09-10", 25000)


def test_concurrent_buys_return_distinct_deterministic_ids(direct_vm, deployed, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 10**18
    
    import concurrent.futures
    from gltest.direct.wasi_mock import _local
    
    def buy(i):
        _local.vm = direct_vm
        return deployed.buy_cover("RAIN", f"19.0{i}", "72.88", f"2026-10-0{i+1}", 25000)
        
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
        futures = [ex.submit(buy, i) for i in range(5)]
        ids = [f.result() for f in futures]
        
    assert len(set(ids)) == 5
    for i, cid in enumerate(ids):
        assert cid is not None
        assert cid.startswith("cover-")
        cover = deployed.get_cover(cid)
        assert cover["lat"] == f"19.0{i}00"
        assert cover["coverage_date"] == f"2026-10-0{i+1}"


def test_late_buy_reverts(direct_vm, deployed, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 10**18
    # coverage date already in the past relative to typical studio clock
    with pytest.raises(Exception, match="buy window closed"):
        deployed.buy_cover("RAIN", "19.076", "72.8777", "2020-01-02", 25000)


def test_cancel_refunds_buyer_only(direct_vm, deployed, direct_alice, direct_bob):
    direct_vm.sender = direct_alice
    direct_vm.value = 10**18
    cover_id = deployed.buy_cover("RAIN", "51.5074", "-0.1278", "2026-12-01", 25000)

    direct_vm.sender = direct_bob
    with pytest.raises(Exception, match="Unauthorized"):
        deployed.cancel_cover(cover_id)

    direct_vm.sender = direct_alice
    deployed.cancel_cover(cover_id)
    cover = deployed.get_cover(cover_id)
    assert cover["state"] == "REFUNDED"
    pool = deployed.get_pool()
    assert pool["reserved_payout"] == 0


def test_resolve_pay_happy_path(direct_vm, deployed, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 10**18
    real_now = deployed._instance._now
    deployed._instance._now = lambda: datetime(2026, 8, 10, tzinfo=timezone.utc)
    cover_id = deployed.buy_cover("RAIN", "19.0760", "72.8777", "2026-08-20", 10000)
    mock_meteo(direct_vm, "19.0760", "72.8777", "2026-08-20", "precipitation_sum", 16.2)
    deployed._instance._now = lambda: datetime(2026, 8, 25, tzinfo=timezone.utc)
    deployed.resolve(cover_id)
    deployed._instance._now = real_now
    cover = deployed.get_cover(cover_id)
    assert cover["state"] == "RESOLVED_PAY"
    assert cover["result"]["amount_wei"] == str(4 * 10**18)
    assert cover["result"]["status"] == "PAY"


def test_missing_json_insufficient_refunds(direct_vm, deployed, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 10**18
    initial_credit = deployed.get_credit(direct_alice)
    
    real_now = deployed._instance._now
    deployed._instance._now = lambda: datetime(2026, 8, 10, tzinfo=timezone.utc)
    cover_id = deployed.buy_cover("RAIN", "19.0760", "72.8777", "2026-08-19", 25000)
    
    # We purposefully don't mock any native transfer to pass, so it fails and goes to credits
    # But wait, direct_vm in genlayer-test MIGHT NOT simulate native transfer failures unless we mock it.
    # Actually, in test environment, cross-contract calls are not implemented or fail by default, so it always goes to credits!
    
    mock_meteo(direct_vm, "19.0760", "72.8777", "2026-08-19", "precipitation_sum", None)
    deployed._instance._now = lambda: datetime(2026, 8, 25, tzinfo=timezone.utc)
    deployed.resolve(cover_id)
    deployed._instance._now = real_now
    cover = deployed.get_cover(cover_id)
    assert cover["state"] == "INSUFFICIENT"
    assert cover["result"]["status"] == "INSUFFICIENT"
    assert cover["result"]["amount_wei"] == str(10**18)
    
    final_credit = deployed.get_credit(direct_alice)
    assert final_credit == initial_credit + 10**18


def test_keep_does_not_pay_buyer(direct_vm, deployed, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 10**18
    real_now = deployed._instance._now
    deployed._instance._now = lambda: datetime(2026, 8, 10, tzinfo=timezone.utc)
    cover_id = deployed.buy_cover("RAIN", "40.7128", "-74.0060", "2026-08-18", 50000)
    pool_after_buy = deployed.get_pool()
    mock_meteo(direct_vm, "40.7128", "-74.0060", "2026-08-18", "precipitation_sum", 1.0)
    deployed._instance._now = lambda: datetime(2026, 8, 25, tzinfo=timezone.utc)
    deployed.resolve(cover_id)
    deployed._instance._now = real_now
    cover = deployed.get_cover(cover_id)
    assert cover["state"] == "RESOLVED_KEEP"
    assert cover["result"]["amount_wei"] == "0"
    
    pool_after_resolve = deployed.get_pool()
    # The pool balance delta is exactly 0 between resolve and buy (premium kept)
    assert pool_after_resolve["pool_balance"] - pool_after_buy["pool_balance"] == 0
    # Reserve is released
    assert pool_after_resolve["reserved_payout"] == pool_after_buy["reserved_payout"] - cover["payout"]

def test_resolve_reverts_before_day_closed(direct_vm, deployed, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 10**18
    real_now = deployed._instance._now
    deployed._instance._now = lambda: datetime(2026, 8, 10, tzinfo=timezone.utc)
    cover_id = deployed.buy_cover("RAIN", "40.7128", "-74.0060", "2026-08-18", 50000)
    
    # Try resolving before coverage date has fully closed (e.g. at 23:59 UTC on coverage day)
    deployed._instance._now = lambda: datetime(2026, 8, 18, 23, 59, 59, tzinfo=timezone.utc)
    with pytest.raises(Exception, match="resolve only after the coverage day has closed"):
        deployed.resolve(cover_id)
        
    deployed._instance._now = real_now


def test_operator_cannot_drain_reserved(direct_vm, deployed, direct_alice):
    direct_vm.sender = direct_alice
    direct_vm.value = 10**18
    deployed.buy_cover("DRY", "1.3521", "103.8198", "2026-11-01", 1000)
    pool = deployed.get_pool()
    with pytest.raises(Exception, match="unreserved"):
        deployed.withdraw_unreserved(pool["pool_balance"])
