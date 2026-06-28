#!/usr/bin/env python3
"""Sync public catalog VLM metrics from per-AOI summary JSON files."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "public" / "data" / "catalog.json"


def public_path(path: str) -> Path:
    return ROOT / "public" / path.lstrip("/")


def apply_summary(aoi: dict[str, Any], summary: dict[str, Any]) -> None:
    classes = summary.get("damage_classes", {})
    priorities = summary.get("action_priorities", {})
    metrics = aoi.setdefault("metrics", {})
    reviewed = int(summary.get("reviewed") or 0)
    uncertain = int(classes.get("uncertain_comparison_problem") or 0)
    likely_destroyed = int(classes.get("likely_destroyed") or 0)
    possible_major = int(classes.get("possible_major_damage") or 0)
    minor = int(classes.get("minor_visible_damage") or 0)
    no_change = int(classes.get("no_change_visible") or 0)
    urgent = int(priorities.get("urgent_review") or 0)
    skipped = int(metrics.get("vlmBeforeAfterSkippedNoBefore") or 0)
    metrics.update({
        "vlmReviewed": reviewed,
        "vlmBeforeAfterReviewed": reviewed,
        "vlmBeforeAfterSkippedNoBefore": skipped,
        "vlmBeforeAfterUncertain": uncertain,
        "vlmBeforeAfterLikelyDestroyed": likely_destroyed,
        "vlmBeforeAfterPossibleMajor": possible_major,
        "vlmBeforeAfterMinor": minor,
        "vlmBeforeAfterNoChange": no_change,
        "vlmBeforeAfterUrgentReview": urgent,
        "vlmBeforeAfterActionable": likely_destroyed + possible_major + minor,
    })


def main() -> None:
    catalog = json.loads(CATALOG.read_text())
    changed = 0
    for aoi in catalog.get("aois", []):
        summary_url = aoi.get("downloads", {}).get("vlm_before_after_summary")
        if not summary_url:
            continue
        summary_path = public_path(summary_url)
        if not summary_path.exists():
            continue
        apply_summary(aoi, json.loads(summary_path.read_text()))
        changed += 1
    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    print(f"Updated VLM metrics for {changed} AOIs")


if __name__ == "__main__":
    main()
