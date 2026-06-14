"""DTE income rate engine — computes per-site DTE earnings.

Income is NOT the PO price. It is a fixed rate table (DT + Report components),
keyed by work category and (for SSV) layer tier.

Operator (TRUE vs AIS) is read from the item_dis prefix, matching
scripts/classify_ace_project.py:
    A_… → AIS   (HWT2604)
    B_… → TRUE  (HWT2304 / HWT2601)
PAC Cluster/SSOA rates differ by operator; SSV/Pre-DT are TRUE-rated only
(the rate sheet has no AIS column for them).

DTE rate table (THB). SSV earns DT + Report; PAC (Cluster/SSOA) earns DT only
(the DTE rate sheet leaves the Report column blank for Cluster/SSOA):
    Pre-DT (Macro)        DT 250  + Report 50   = 300
    SSV  1-3 layers       DT 800  + Report 100  = 900
    SSV  4-7 layers       DT 1300 + Report 150  = 1450
    SSV  8+ layers        DT 1900 + Report 200  = 2100
    Cluster DT Opt (TRUE) DT 800  + Report 0    = 800    (per site)
    SSOA DT Opt    (TRUE) DT 1600 + Report 0    = 1600   (per site)
    Cluster DT Opt (AIS)  DT 550  + Report 0    = 550
    SSOA DT Opt    (AIS)  DT 750  + Report 0    = 750
"""
import re

# (dt, report) per unit
SSV_TIERS = [
    (3,  800, 100),    # 1-3 layers
    (7,  1300, 150),   # 4-7 layers
    (10**9, 1900, 200) # 8+ layers
]
# PAC: DTE rate sheet has NO Report component for Cluster/SSOA (DT only)
CLUSTER_TRUE = (800, 0)
SSOA_TRUE    = (1600, 0)
CLUSTER_AIS  = (550, 0)
SSOA_AIS     = (750, 0)
PRE_DT       = (250, 50)


def detect_operator(item_dis: str | None, operator: str | None = None) -> str:
    """Resolve TRUE vs AIS for a line. Explicit operator wins; else item_dis prefix.

    A_ → AIS, B_ → TRUE (per classify_ace_project.py). Anything else → TRUE
    (TRUE is the default/legacy operator; AIS lines always carry the A_ prefix).
    """
    if operator:
        return operator.upper()
    t = (item_dis or "").strip().lower()
    if t.startswith("a_"):
        return "AIS"
    return "TRUE"


def _parse_layers(item_dis: str | None) -> int | None:
    """Extract the (upper-bound) layer count from item_dis text."""
    if not item_dis:
        return None
    # "for 4~7 layer", "for 4-7 layers" → upper bound 7
    m = re.search(r"for\s+\d+\s*[~\-]\s*(\d+)\s*layer", item_dis, re.IGNORECASE)
    if m:
        return int(m.group(1))
    # "for 8 or more than 8 layers" / "for 10 or more than 10 layers" → that number
    m = re.search(r"for\s+(\d+)\s+or\s+more", item_dis, re.IGNORECASE)
    if m:
        return int(m.group(1))
    # "for 8 layers"
    m = re.search(r"for\s+(\d+)\s+layer", item_dis, re.IGNORECASE)
    if m:
        return int(m.group(1))
    return None


def _ssv_tier(layers: int) -> tuple[int, int, str]:
    for upper, dt, rep in SSV_TIERS:
        if layers <= upper:
            label = "1-3" if upper == 3 else ("4-7" if upper == 7 else "8+")
            return dt, rep, label
    return SSV_TIERS[-1][1], SSV_TIERS[-1][2], "8+"


def compute_income(work_type: str | None, item_dis: str | None,
                   layers: int | None, site_count: int = 1,
                   operator: str | None = None) -> dict:
    """Return {dt, report, total, unit_total, category, site_count, operator,
    needs_review} for a tracking row.

    site_count multiplies Cluster/SSOA (rate is per site; a cluster may hold N
    sites). SSV is always 1 site. operator overrides the item_dis-prefix
    detection. needs_review=True flags an SSV line whose layer tier could not be
    determined (rate is a best-guess default, not an asserted value).
    """
    text = (item_dis or "").lower()
    wt = (work_type or "").upper()
    op = detect_operator(item_dis, operator)

    # Category detection (most specific first)
    if "ssoa" in text:
        dt, rep = SSOA_AIS if op == "AIS" else SSOA_TRUE
        n = max(1, site_count)
        return {"dt": dt * n, "report": rep * n, "total": (dt + rep) * n,
                "unit_total": dt + rep, "category": f"SSOA DT Opt ({op})",
                "site_count": n, "operator": op, "needs_review": False}
    if "cluster" in text:
        dt, rep = CLUSTER_AIS if op == "AIS" else CLUSTER_TRUE
        n = max(1, site_count)
        return {"dt": dt * n, "report": rep * n, "total": (dt + rep) * n,
                "unit_total": dt + rep, "category": f"Cluster DT Opt ({op})",
                "site_count": n, "operator": op, "needs_review": False}
    if "pre dt" in text or "predrive" in text or "pre-dt" in text:
        dt, rep = PRE_DT
        return {"dt": dt, "report": rep, "total": dt + rep,
                "unit_total": dt + rep, "category": "Pre-DT", "site_count": 1,
                "operator": op, "needs_review": False}
    if "single site verification" in text or wt == "SSV":
        parsed = layers if layers else _parse_layers(item_dis)
        n_layers = parsed if parsed else 1
        dt, rep, label = _ssv_tier(n_layers)
        return {"dt": dt, "report": rep, "total": dt + rep,
                "unit_total": dt + rep, "category": f"SSV {label} layers",
                "site_count": 1, "operator": op,
                # layers unknown → defaulted to the cheapest tier; surface for review
                "needs_review": not parsed,
                **({"review_reason": "layer tier unknown — defaulted to 1-3"} if not parsed else {})}
    # PAC fallback (no SSOA/Cluster keyword) → treat as Cluster (operator-aware)
    if wt == "PAC":
        dt, rep = CLUSTER_AIS if op == "AIS" else CLUSTER_TRUE
        n = max(1, site_count)
        return {"dt": dt * n, "report": rep * n, "total": (dt + rep) * n,
                "unit_total": dt + rep, "category": f"Cluster DT Opt ({op})",
                "site_count": n, "operator": op,
                "needs_review": True, "review_reason": "PAC without Cluster/SSOA keyword — assumed Cluster"}
    return {"dt": 0, "report": 0, "total": 0, "unit_total": 0, "category": "—",
            "site_count": 1, "operator": op, "needs_review": False}


# ── DTA (drive-test analyst) income ──────────────────────────────────────────
# DTA is paid a single fixed rate per cluster/site on PAC (Cluster/SSOA) work
# only — they run the cluster drive-test + log-file check. SSV/Pre-DT is DTE
# work, so DTA earns 0 there. Rate is operator-aware (TRUE vs AIS), per site,
# multiplied by the cluster's child-site count (mirrors DTE PAC).
#     Cluster (TRUE) 1,100   SSOA (TRUE) 1,700
#     Cluster (AIS)    600   SSOA (AIS)    800
DTA_CLUSTER_TRUE = 1100
DTA_SSOA_TRUE    = 1700
DTA_CLUSTER_AIS  = 600
DTA_SSOA_AIS     = 800


def compute_dta_income(work_type: str | None, item_dis: str | None,
                       site_count: int = 1, operator: str | None = None) -> dict:
    """Return {rate, total, category, site_count, operator, needs_review} for a
    tracking row's DTA earnings. Non-PAC (SSV/Pre-DT) → 0 (not DTA work)."""
    text = (item_dis or "").lower()
    wt = (work_type or "").upper()
    op = detect_operator(item_dis, operator)
    n = max(1, site_count)
    if "ssoa" in text:
        rate = DTA_SSOA_AIS if op == "AIS" else DTA_SSOA_TRUE
        return {"rate": rate, "total": rate * n, "category": f"SSOA ({op})",
                "site_count": n, "operator": op, "needs_review": False}
    if "cluster" in text:
        rate = DTA_CLUSTER_AIS if op == "AIS" else DTA_CLUSTER_TRUE
        return {"rate": rate, "total": rate * n, "category": f"Cluster ({op})",
                "site_count": n, "operator": op, "needs_review": False}
    if wt == "PAC":
        # PAC without a Cluster/SSOA keyword → assume Cluster, flag for review
        rate = DTA_CLUSTER_AIS if op == "AIS" else DTA_CLUSTER_TRUE
        return {"rate": rate, "total": rate * n, "category": f"Cluster ({op})",
                "site_count": n, "operator": op, "needs_review": True,
                "review_reason": "PAC without Cluster/SSOA keyword — assumed Cluster"}
    # SSV / Pre-DT / unknown → DTA earns nothing on this row
    return {"rate": 0, "total": 0, "category": "—", "site_count": 1,
            "operator": op, "needs_review": False}

