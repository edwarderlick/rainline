# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
import re
import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from genlayer import *


ERROR_EXPECTED = "[EXPECTED]"
ERROR_EXTERNAL = "[EXTERNAL]"

TEMPLATES = ("RAIN", "DRY", "HEAT")
TEMPLATE_FIELD = {
    "RAIN": "precipitation_sum",
    "DRY": "precipitation_sum",
    "HEAT": "temperature_2m_max",
}
SOURCE_HOST = "historical-forecast-api.open-meteo.com"
PAYOUT_RATIO = 4
MIN_PREMIUM_WEI = u256(10**16)
MAX_PREMIUM_WEI = u256(10 * 10**18)
BUY_CUTOFF_HOURS = 24
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class CoverCreated(gl.Event):
    def __init__(self, cover_id: str, template: str, premium: u256, /):
        pass


class CoverResolved(gl.Event):
    def __init__(self, cover_id: str, status: str, /):
        pass


class CoverCanceled(gl.Event):
    def __init__(self, cover_id: str, /):
        pass


class PoolFunded(gl.Event):
    def __init__(self, amount: u256, /):
        pass


@allow_storage
@dataclass
class Cover:
    id: str
    buyer: Address
    template: str
    lat: str
    lon: str
    coverage_date: str
    threshold_milli: u256
    premium: u256
    payout: u256
    state: str
    evidence_url: str
    result_json: str
    observed_milli: str
    created_at: str


class Rainline(gl.Contract):
    operator: Address
    pool_balance: u256
    reserved_payout: u256
    covers: TreeMap[str, Cover]
    credits: TreeMap[Address, u256]
    next_cover_id: u256
    cover_list: DynArray[str]

    def __init__(self):
        self.operator = gl.message.sender_address
        self.pool_balance = u256(0)
        self.reserved_payout = u256(0)
        self.next_cover_id = u256(1)

    def _now(self) -> datetime:
        try:
            raw = str(gl.message_raw["datetime"])
        except Exception:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} missing datetime in message context")
        text = raw.strip()
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        dt = datetime.fromisoformat(text)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    def _parse_date(self, value: str) -> datetime:
        if not DATE_RE.match(value or ""):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} coverage_date must be YYYY-MM-DD")
        return datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)

    def _fmt_coord(self, raw: str, kind: str) -> str:
        try:
            num = float(str(raw).strip())
        except Exception:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} invalid {kind}")
        if kind == "lat" and (num < -90.0 or num > 90.0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} lat out of range")
        if kind == "lon" and (num < -180.0 or num > 180.0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} lon out of range")
        return f"{num:.4f}"

    def _evidence_url(self, lat: str, lon: str, coverage_date: str, template: str) -> str:
        field = TEMPLATE_FIELD[template]
        return (
            f"https://{SOURCE_HOST}/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&start_date={coverage_date}&end_date={coverage_date}"
            f"&daily={field}&timezone=UTC"
        )

    def _pay(self, recipient: Address, amount: u256) -> None:
        if amount == u256(0):
            return
        success = False
        try:
            res = gl.get_contract_at(Address(str(recipient))).emit_transfer(value=amount)
            if res:
                success = True
        except Exception:
            pass
            
        if not success:
            current = self.credits.get(recipient, u256(0))
            self.credits[recipient] = current + amount

    def _extract_observation(self, payload: dict, coverage_date: str, template: str) -> int:
        daily = payload.get("daily") if isinstance(payload, dict) else None
        if not isinstance(daily, dict):
            raise ValueError("missing daily")
        times = daily.get("time") or []
        values = daily.get(TEMPLATE_FIELD[template])
        if not isinstance(times, list) or not isinstance(values, list):
            raise ValueError("daily arrays missing")
        if coverage_date not in times:
            raise ValueError("date missing")
        idx = times.index(coverage_date)
        if idx >= len(values) or values[idx] is None:
            raise ValueError("null observation")
        num = float(values[idx])
        if num != num:
            raise ValueError("nan observation")
        return int(round(num * 1000))

    @gl.public.write.payable
    def fund_pool(self) -> None:
        value = gl.message.value
        if value == u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Value must be greater than 0")
        self.pool_balance = self.pool_balance + value
        PoolFunded(value).emit()

    @gl.public.write.payable
    def buy_cover(
        self,
        template: str,
        lat: str,
        lon: str,
        coverage_date: str,
        threshold_milli: int,
    ) -> str:
        template = str(template or "").strip().upper()
        if template not in TEMPLATES:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} template must be RAIN, DRY, or HEAT")

        premium = gl.message.value
        if premium < MIN_PREMIUM_WEI:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} premium below 0.01 GEN")
        if premium > MAX_PREMIUM_WEI:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} premium above 10 GEN")

        threshold = u256(int(threshold_milli))
        if threshold == u256(0) and template != "DRY":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} threshold must be > 0")

        lat_s = self._fmt_coord(lat, "lat")
        lon_s = self._fmt_coord(lon, "lon")
        day = self._parse_date(coverage_date)
        now = self._now()
        if now > day - timedelta(hours=BUY_CUTOFF_HOURS):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} buy window closed 24h before coverage date 00:00 UTC")

        payout = premium * u256(PAYOUT_RATIO)
        unreserved = self.pool_balance
        if unreserved < self.reserved_payout:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} pool accounting broken")
        available = unreserved - self.reserved_payout
        if available + premium < payout:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} pool cannot reserve payout")

        cover_id = f"cover-{self.next_cover_id}"
        if cover_id in self.covers:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} ID collision: {cover_id} already exists")
        self.next_cover_id = self.next_cover_id + u256(1)
        self.cover_list.append(cover_id)

        self.pool_balance = self.pool_balance + premium
        self.reserved_payout = self.reserved_payout + payout

        url = self._evidence_url(lat_s, lon_s, coverage_date, template)
        self.covers[cover_id] = Cover(
            id=cover_id,
            buyer=gl.message.sender_address,
            template=template,
            lat=lat_s,
            lon=lon_s,
            coverage_date=coverage_date,
            threshold_milli=threshold,
            premium=premium,
            payout=payout,
            state="OPEN",
            evidence_url=url,
            result_json="",
            observed_milli="",
            created_at=str(gl.message_raw.get("datetime", "")),
        )
        CoverCreated(cover_id, template, premium).emit()
        return cover_id

    @gl.public.write
    def cancel_cover(self, cover_id: str) -> None:
        if cover_id not in self.covers:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Cover not found")
        cover = self.covers[cover_id]
        if cover.state != "OPEN":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Cannot cancel a cover that is already {cover.state}")
        if str(gl.message.sender_address).lower() != str(cover.buyer).lower():
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Unauthorized: only buyer can cancel")
        now = self._now()
        if now >= self._parse_date(cover.coverage_date):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} cancel window closed once coverage day starts")

        cover.state = "CANCELED"
        cover.result_json = json.dumps(
            {
                "status": "CANCELED",
                "reason": "Buyer canceled before the coverage day. Premium refunded.",
            }
        )
        self.covers[cover_id] = cover
        self.pool_balance = self.pool_balance - cover.premium
        self.reserved_payout = self.reserved_payout - cover.payout
        CoverCanceled(cover_id).emit()
        self._pay(cover.buyer, cover.premium)

    @gl.public.write
    def resolve(self, cover_id: str) -> None:
        if cover_id not in self.covers:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Cover not found")
        cover = self.covers[cover_id]
        if cover.state != "OPEN":
            raise gl.vm.UserError(f"{ERROR_EXPECTED} Cover already {cover.state}")

        now = self._now()
        if now < self._parse_date(cover.coverage_date) + timedelta(days=1):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} resolve only after the coverage day has closed (00:00 UTC next day)")

        url = cover.evidence_url
        coverage_date = cover.coverage_date
        template = cover.template
        threshold = int(cover.threshold_milli)

        field_name = TEMPLATE_FIELD[template]

        def fetch_and_extract() -> str:
            reason = ""
            observed = None
            raw_body = ""
            try:
                res = gl.nondet.web.get(url)
                status_code = getattr(res, "status", None)
                body = getattr(res, "body", res)
                if isinstance(body, bytes):
                    raw_body = body.decode("utf-8", errors="replace")
                else:
                    raw_body = str(body)
                if status_code is not None and int(status_code) >= 400:
                    reason = f"http_{status_code}"
                else:
                    payload = json.loads(raw_body)
                    daily = payload.get("daily") if isinstance(payload, dict) else None
                    if not isinstance(daily, dict):
                        raise ValueError("missing daily")
                    times = daily.get("time") or []
                    values = daily.get(field_name)
                    if coverage_date not in times:
                        raise ValueError("date missing")
                    idx = times.index(coverage_date)
                    if idx >= len(values) or values[idx] is None:
                        raise ValueError("null observation")
                    observed = int(round(float(values[idx]) * 1000))
            except Exception as exc:
                reason = f"parse_failed:{type(exc).__name__}"

            prompt = f"""
You extract one numeric observation from Open-Meteo JSON for parametric cover.
URL: {url}
Coverage date: {coverage_date}
Template: {template}
Field: {TEMPLATE_FIELD[template]}
JSON:
{raw_body[:4000]}

Return ONLY JSON with keys:
- fetch_ok: true if the field exists and is a finite number for that date, else false
- observed: number or null
- reason: short string
Do not invent a value if the field is missing or null.
"""
            llm_observed = None
            llm_ok = False
            try:
                llm_raw = gl.nondet.exec_prompt(prompt)
                text = str(llm_raw).strip()
                if text.startswith("```"):
                    text = re.sub(r"^```(?:json)?", "", text).strip()
                    text = re.sub(r"```$", "", text).strip()
                parsed = json.loads(text)
                llm_ok = bool(parsed.get("fetch_ok"))
                if parsed.get("observed") is not None:
                    llm_observed = int(round(float(parsed["observed"]) * 1000))
            except Exception:
                llm_ok = False

            fetch_ok = observed is not None
            if fetch_ok and llm_ok and llm_observed is not None:
                if abs(llm_observed - observed) > 500:
                    fetch_ok = False
                    reason = "extract_disagreement"
                    observed = None

            if not fetch_ok:
                status = "INSUFFICIENT"
            else:
                hit = (
                    observed >= threshold
                    if template in ("RAIN", "HEAT")
                    else observed <= threshold
                )
                status = "PAY" if hit else "KEEP"

            return json.dumps(
                {
                    "observed_milli": observed,
                    "status": status,
                },
                sort_keys=True,
                separators=(",", ":"),
            )

        raw = gl.eq_principle.strict_eq(fetch_and_extract)
        if isinstance(raw, str):
            result = json.loads(raw)
        else:
            result = raw

        status = str(result.get("status") or "INSUFFICIENT")
        observed_milli = result.get("observed_milli")
        reason = str(result.get("reason") or "")

        if status not in ("PAY", "KEEP", "INSUFFICIENT"):
            status = "INSUFFICIENT"

        # 1. State Updates (Checks & Effects)
        if status == "PAY":
            cover.state = "RESOLVED_PAY"
            amount_wei = int(cover.payout)
            self.pool_balance = self.pool_balance - cover.payout
            self.reserved_payout = self.reserved_payout - cover.payout
        elif status == "KEEP":
            cover.state = "RESOLVED_KEEP"
            amount_wei = 0
            self.reserved_payout = self.reserved_payout - cover.payout
        else:
            status = "INSUFFICIENT"
            cover.state = "INSUFFICIENT"
            amount_wei = int(cover.premium)
            self.pool_balance = self.pool_balance - cover.premium
            self.reserved_payout = self.reserved_payout - cover.payout

        cover.observed_milli = "" if observed_milli is None else str(int(observed_milli))
        cover.result_json = json.dumps(
            {
                "amount_wei": str(amount_wei),
                "evidence_url": url,
                "observed_milli": None if observed_milli is None else int(observed_milli),
                "reason": reason,
                "source": SOURCE_HOST,
                "status": status,
                "template": template,
                "threshold_milli": int(cover.threshold_milli),
            }
        )
        
        # 2. Write to Storage
        self.covers[cover_id] = cover
        CoverResolved(cover_id, status).emit()
        
        # 3. Interactions (External Calls)
        if status == "PAY":
            self._pay(cover.buyer, cover.payout)
        elif status == "INSUFFICIENT":
            self._pay(cover.buyer, cover.premium)

    @gl.public.write
    def withdraw(self) -> None:
        caller = gl.message.sender_address
        amount = self.credits.get(caller, u256(0))
        if amount == u256(0):
            raise gl.vm.UserError(f"{ERROR_EXPECTED} no credit")
        self.credits[caller] = u256(0)
        
        success = False
        try:
            res = gl.get_contract_at(Address(str(caller))).emit_transfer(value=amount)
            if res:
                success = True
        except Exception:
            pass
            
        if not success:
            self.credits[caller] = amount
            raise gl.vm.UserError(f"{ERROR_EXPECTED} native transfer failed")

    @gl.public.write
    def withdraw_unreserved(self, amount_wei: int) -> None:
        if str(gl.message.sender_address).lower() != str(self.operator).lower():
            raise gl.vm.UserError(f"{ERROR_EXPECTED} only operator")
        amount = u256(int(amount_wei))
        available = self.pool_balance - self.reserved_payout
        if amount == u256(0) or amount > available:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} amount exceeds unreserved pool")
        self.pool_balance = self.pool_balance - amount
        self._pay(self.operator, amount)

    @gl.public.view
    def get_cover(self, cover_id: str) -> dict:
        if cover_id not in self.covers:
            raise gl.vm.UserError("Cover not found")
        cover = self.covers[cover_id]
        result_obj = None
        if cover.result_json:
            try:
                result_obj = json.loads(cover.result_json)
            except Exception:
                result_obj = None
        return {
            "id": cover.id,
            "buyer": str(cover.buyer),
            "template": cover.template,
            "lat": cover.lat,
            "lon": cover.lon,
            "coverage_date": cover.coverage_date,
            "threshold_milli": int(cover.threshold_milli),
            "premium": int(cover.premium),
            "payout": int(cover.payout),
            "state": cover.state,
            "evidence_url": cover.evidence_url,
            "observed_milli": cover.observed_milli,
            "result": result_obj,
            "created_at": cover.created_at,
        }


    @gl.public.view
    def get_pool(self) -> dict:
        return {
            "operator": str(self.operator),
            "pool_balance": int(self.pool_balance),
            "reserved_payout": int(self.reserved_payout),
            "unreserved": int(self.pool_balance - self.reserved_payout),
            "payout_ratio": PAYOUT_RATIO,
            "source_host": SOURCE_HOST,
            "buy_cutoff_hours": BUY_CUTOFF_HOURS,
        }

    @gl.public.view
    def get_credit(self, account: str) -> int:
        addr = Address(account)
        return int(self.credits.get(addr, u256(0)))

    @gl.public.view
    def preview_url(self, template: str, lat: str, lon: str, coverage_date: str) -> str:
        template = str(template or "").strip().upper()
        if template not in TEMPLATES:
            raise gl.vm.UserError(f"{ERROR_EXPECTED} bad template")
        return self._evidence_url(
            self._fmt_coord(lat, "lat"),
            self._fmt_coord(lon, "lon"),
            coverage_date,
            template,
        )

    @gl.public.view
    def list_cover_ids(self) -> list:
        return self.cover_list
