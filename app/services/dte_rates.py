"""DTE income rate engine — computes per-site DTE earnings.

Income is NOT the PO price. It is a fixed rate table (DT + Report components),
keyed by work category and (for SSV) layer tier.

HWT2304 is a TRUE project → use TRUE operator rates for Cluster/SSOA.

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
                   layers: int | None, site_count: int = 1) -> dict:
    """Return {dt, report, total, unit_total, category, site_count} for a tracking row.

    site_count multiplies Cluster/SSOA (rate is per site; a cluster may hold N sites).
    SSV is always 1 site.
    """
    text = (item_dis or "").lower()
    wt = (work_type or "").upper()

    # Category detection (most specific first)
    if "ssoa" in text:
        dt, rep = SSOA_TRUE
        n = max(1, site_count)
        return {"dt": dt * n, "report": rep * n, "total": (dt + rep) * n,
                "unit_total": dt + rep, "category": "SSOA DT Opt", "site_count": n}
    if "cluster" in text:
        dt, rep = CLUSTER_TRUE
        n = max(1, site_count)
        return {"dt": dt * n, "report": rep * n, "total": (dt + rep) * n,
                "unit_total": dt + rep, "category": "Cluster DT Opt", "site_count": n}
    if "pre dt" in text or "predrive" in text or "pre-dt" in text:
        dt, rep = PRE_DT
        return {"dt": dt, "report": rep, "total": dt + rep,
                "unit_total": dt + rep, "category": "Pre-DT", "site_count": 1}
    if "single site verification" in text or wt == "SSV":
        n_layers = layers if layers else _parse_layers(item_dis) or 1
        dt, rep, label = _ssv_tier(n_layers)
        return {"dt": dt, "report": rep, "total": dt + rep,
                "unit_total": dt + rep, "category": f"SSV {label} layers", "site_count": 1}
    # PAC fallback (no SSOA/Cluster keyword) → treat as Cluster
    if wt == "PAC":
        dt, rep = CLUSTER_TRUE
        n = max(1, site_count)
        return {"dt": dt * n, "report": rep * n, "total": (dt + rep) * n,
                "unit_total": dt + rep, "category": "Cluster DT Opt", "site_count": n}
    return {"dt": 0, "report": 0, "total": 0, "unit_total": 0, "category": "—", "site_count": 1}
