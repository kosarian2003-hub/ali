"""
sync_watcher.py — keeps a HOSTED Khorshid site in sync with an Excel file that
lives only on YOUR computer.

Why this exists
----------------
A server sitting on the internet has no way to reach into your laptop's
filesystem by itself — nothing can "watch" a file it can't see. So this small
script runs on your machine, watches products.xlsx for changes (by checking
its last-modified time every few seconds), and — the moment you save an edit
in Excel — uploads the new file to your hosted site's
POST /api/admin/upload-products endpoint. The site then picks up the change
on its very next 10-second poll, exactly like a local run would.

Usage
-----
    pip install requests
    python sync_watcher.py --file "C:\\path\\to\\products.xlsx" --url https://your-site.com

Leave it running in the background (or set it up as a scheduled task /
launchd job / systemd service) for continuous live sync.
"""

import argparse
import time
from pathlib import Path

import requests


def watch(file_path: Path, site_url: str, interval: int):
    upload_url = site_url.rstrip("/") + "/api/admin/upload-products"
    last_mtime = None
    print(f"Watching {file_path} — pushing to {upload_url} every {interval}s on change.")

    while True:
        try:
            if not file_path.exists():
                print(f"[!] File not found: {file_path}")
            else:
                mtime = file_path.stat().st_mtime
                if mtime != last_mtime:
                    with open(file_path, "rb") as f:
                        resp = requests.post(
                            upload_url,
                            files={"file": ("products.xlsx", f,
                                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
                            timeout=15,
                        )
                    if resp.ok:
                        print(f"[✓] Synced change at {time.strftime('%H:%M:%S')}")
                        last_mtime = mtime
                    else:
                        print(f"[!] Upload failed ({resp.status_code}): {resp.text}")
        except Exception as exc:
            print(f"[!] Sync error: {exc}")

        time.sleep(interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync a local products.xlsx to a hosted Khorshid site.")
    parser.add_argument("--file", required=True, help="Path to your local products.xlsx")
    parser.add_argument("--url", required=True, help="Base URL of the hosted site, e.g. https://khorshid.example.com")
    parser.add_argument("--interval", type=int, default=5, help="Seconds between checks (default: 5)")
    args = parser.parse_args()

    watch(Path(args.file), args.url, args.interval)
