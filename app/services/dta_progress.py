"""DTA cluster progress derivation — shared by the self-service PUT endpoint and (logically)
the Excel ETL.

This is the **Python mirror** of the client-side `recompute()` in
frontend/DtaUpdatePage.jsx. Keep the two in sync — same phase/health/status math so a cluster
shows the same numbers whether it's EXCEL-sourced or edited in-app (system-native).

Phase is driven by the milestone dates + PA-loop rounds ONLY; `status` is then *derived* from
that phase (never typed), so it can never push the phase past the stamped milestones.
"""
from datetime import date

# milestone key -> lifecycle id (id 7 "pa_loop" is computed from rounds, not a stored date)
MILESTONE_IDS = {
    "site_onair": 1, "cluster_ready": 2, "dt_gen": 3, "dt_approved": 4,
    "init_test": 5, "pa_open": 6, "tuning_closed": 8, "pac_report": 9,
    "pac_submit": 10, "pac_approved": 11,
}

# status label per phase. Prefixes chosen so status_phase(label) <= phase → status never inflates phase.
STATUS_BY_PHASE = {
    1: "Not started",
    2: "Cluster readiness",
    3: "DT route generated",
    4: "DT route approved",
    5: "Initial test done",
    6: "PA Open — discussion",
    7: "07. PA loop — tuning & discuss",
    8: "Tuning report approved",
    9: "PAC test done",
    10: "PAC report submitted to HW",
    11: "14. PAC Approved (TRUE)",
}

_STATUS_PHASE_MAP = {14: 11, 13: 11, 12: 10, 11: 10, 10: 10, 9: 9, 8: 8,
                     7: 7, 6: 7, 5: 7, 4: 7, 3: 7, 2: 7, 1: 5, 0: 1}


def status_phase(status: str | None) -> int:
    if not status:
        return 1
    try:
        n = int(str(status).strip()[:2])
    except ValueError:
        return 1
    return _STATUS_PHASE_MAP.get(n, 1)


def health_of(status: str | None, age_at_phase: int | None) -> str:
    s = (status or "")[:2]
    if s == "14":
        return "green"
    if s == "00":
        return "red"
    if age_at_phase is not None and age_at_phase > 21:
        return "red"
    if s in ("08", "11", "12", "13"):
        return "green"
    return "amber"


def recompute(milestones: dict, rounds: list, status: str | None, as_of: date | None = None) -> dict:
    """milestones: {key: date|None}; rounds: list of objects/dicts with .cr_date.
    Returns {current_phase, pa_round, health, age_at_phase, age_total}."""
    as_of = as_of or date.today()

    def cr_of(r):
        return getattr(r, "cr_date", None) if not isinstance(r, dict) else r.get("cr_date")

    dates: dict[int, date] = {}
    for key, mid in MILESTONE_IDS.items():
        v = milestones.get(key)
        if v:
            dates[mid] = v
    crs = sorted([d for d in (cr_of(r) for r in rounds) if d])
    pa_round = len(crs)
    if crs:
        dates[7] = crs[-1]
    if dates.get(2) and not dates.get(1):
        dates[1] = dates.get(3) or dates[2]

    date_phase = max([1] + list(dates.keys()))
    phase = min(max(date_phase, status_phase(status), 1), 11)

    started = dates.get(2) or dates.get(3) or dates.get(5) or dates.get(1)
    dvals = sorted(dates.values())
    last = dvals[-1] if dvals else started
    age = max((as_of - last).days, 0) if last else None
    if phase >= 11 and (status or "")[:2] == "14" and age is not None:
        age = min(age, 3)
    age_total = (as_of - started).days if started else age

    return {"current_phase": phase, "pa_round": pa_round,
            "health": health_of(status, age), "age_at_phase": age, "age_total": age_total}


def derived_status(milestones: dict, rounds: list) -> str:
    """Status label auto-derived from the milestone-driven phase (status='' so it can't inflate)."""
    phase = recompute(milestones, rounds, "")["current_phase"]
    return STATUS_BY_PHASE.get(phase, "")


def recompute_auto(milestones: dict, rounds: list, as_of: date | None = None) -> dict:
    """recompute using the auto-derived status; returns derived fields + the status string."""
    status = derived_status(milestones, rounds)
    out = recompute(milestones, rounds, status, as_of=as_of)
    out["status"] = status
    return out
