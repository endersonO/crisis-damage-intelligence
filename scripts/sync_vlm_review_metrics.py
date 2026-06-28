#!/usr/bin/env python3
"""Synchronize VLM review metrics and summaries into the public catalog.

This keeps before/after VLM metrics distinct from lower-confidence post-event
only VLM. Public UI copy depends on this distinction to avoid implying a
temporal comparison where none exists.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "public" / "data" / "catalog.json"
AOI_DIR = ROOT / "public" / "data" / "aoi"


def public_path(path: str) -> Path:
    return ROOT / "public" / path.lstrip("/")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    records = []
    if not path.exists():
        return records
    for line in path.read_text().splitlines():
        if line.strip():
            records.append(json.loads(line))
    return records


def count_values(records: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for record in records:
        vlm = record.get("vlm") or {}
        value = vlm.get(key) or "unknown"
        counts[str(value)] = counts.get(str(value), 0) + 1
    return counts


def count_record_values(records: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for record in records:
        value = record.get(key) or "unknown"
        counts[str(value)] = counts.get(str(value), 0) + 1
    return counts


def write_post_event_summary(aoi_id: str, records: list[dict[str, Any]]) -> None:
    out_dir = AOI_DIR / aoi_id
    class_counts = count_values(records, "damage_class")
    priority_counts = count_values(records, "action_priority")
    summary = {
        "review_type": "post_event_only",
        "model": next((record.get("vlm", {}).get("vlm_model") for record in records if record.get("vlm", {}).get("vlm_model")), "unknown"),
        "reviewed": len(records),
        "official_ems_counts": count_record_values(records, "official_ems_damage_gra"),
        "vlm_damage_class_counts": class_counts,
        "vlm_action_priority_counts": priority_counts,
        "urgent_like_count": int(priority_counts.get("urgent_review") or 0),
        "warning": "VLM outputs are triage aids from post-event chips only; official EMS labels remain source of record; absence of visible VLM damage is not proof of no damage.",
    }
    (out_dir / "vlm_summary.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n")
    with (out_dir / "vlm_review_summary.csv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["id", "official_ems_damage_gra", "vlm_damage_class", "confidence", "action_priority", "post_event_chip", "google_maps_url"])
        writer.writeheader()
        for record in sorted(records, key=lambda item: item.get("id", "")):
            vlm = record.get("vlm") or {}
            writer.writerow({
                "id": record.get("id"),
                "official_ems_damage_gra": record.get("official_ems_damage_gra"),
                "vlm_damage_class": vlm.get("damage_class"),
                "confidence": vlm.get("confidence"),
                "action_priority": vlm.get("action_priority"),
                "post_event_chip": record.get("post_event_chip"),
                "google_maps_url": record.get("google_maps_url"),
            })


def apply_before_after_summary(aoi: dict[str, Any], summary: dict[str, Any]) -> None:
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


def apply_post_event(aoi: dict[str, Any], records: list[dict[str, Any]]) -> None:
    metrics = aoi.setdefault("metrics", {})
    classes = count_values(records, "damage_class")
    priorities = count_values(records, "action_priority")
    metrics.update({
        "vlmPostEventReviewed": len(records),
        "vlmPostEventUncertain": int(classes.get("uncertain_imagery_problem") or 0),
        "vlmPostEventLikelyDestroyed": int(classes.get("likely_destroyed") or 0),
        "vlmPostEventPossibleMajor": int(classes.get("possible_major_damage") or 0),
        "vlmPostEventMinor": int(classes.get("minor_visible_damage") or 0),
        "vlmPostEventNoVisibleDamage": int(classes.get("no_visible_damage") or 0),
        "vlmPostEventUrgentReview": int(priorities.get("urgent_review") or 0),
    })
    if not metrics.get("vlmBeforeAfterReviewed"):
        metrics["vlmReviewed"] = 0


def main() -> None:
    catalog = json.loads(CATALOG.read_text())
    before_after = 0
    post_event = 0
    for aoi in catalog.get("aois", []):
        aoi_id = aoi.get("id")
        downloads = aoi.setdefault("downloads", {})
        summary_url = downloads.get("vlm_before_after_summary")
        if summary_url and public_path(summary_url).exists():
            apply_before_after_summary(aoi, json.loads(public_path(summary_url).read_text()))
            before_after += 1

        review_path = AOI_DIR / str(aoi_id) / "vlm_review.jsonl"
        records = read_jsonl(review_path)
        if records and all((record.get("vlm") or {}).get("review_type") == "post_event_only" for record in records):
            write_post_event_summary(str(aoi_id), records)
            downloads.setdefault("vlm_jsonl", f"/data/aoi/{aoi_id}/vlm_review.jsonl")
            downloads.setdefault("vlm_csv", f"/data/aoi/{aoi_id}/vlm_review_summary.csv")
            downloads.setdefault("vlm_summary", f"/data/aoi/{aoi_id}/vlm_summary.json")
            apply_post_event(aoi, records)
            post_event += 1

    CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    print(f"Updated before/after metrics for {before_after} AOIs")
    print(f"Updated post-event metrics for {post_event} AOIs")


if __name__ == "__main__":
    main()
