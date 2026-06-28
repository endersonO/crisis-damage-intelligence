#!/usr/bin/env python3
"""Compatibility wrapper for VLM metric sync.

Use sync_vlm_review_metrics.py for the actual implementation. This filename is
kept so older runbooks do not reintroduce ambiguous VLM metrics.
"""

from sync_vlm_review_metrics import main


if __name__ == "__main__":
    main()
