#!/usr/bin/env python3
"""Smoke test: boots index.html in headless Chromium, cycles all skins and both languages,
opens the DECK sheet and the intro tour, and fails on any page error.

  pip install playwright && playwright install chromium
  python3 tests/smoke.py
"""
import os, sys
from playwright.sync_api import sync_playwright

URL = "file://" + os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "index.html")
SKINS = ["sonic", "kami", "nashville", "kiiro", "akane", "kuro"]

with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    errs = []
    for lang in ("en", "ru"):
        ctx = b.new_context(viewport={"width": 390, "height": 844})
        ctx.add_init_script("localStorage.setItem('tape4.lang','%s')" % lang)
        page = ctx.new_page()
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.goto(URL + "#dev")
        page.wait_for_timeout(900)
        assert page.locator("#intro.on").count() == 1, "intro tour should open on first run"
        page.click("#tSkip")
        for s in SKINS:
            page.evaluate("t=>__tape4.applyTheme(t)", s)
            page.wait_for_timeout(120)
        page.click("#dkBtn")
        assert page.locator("#dk.on").count() == 1, "DECK sheet should open"
        page.click("#dkX")
        ctx.close()
    b.close()

if errs:
    print("FAIL", errs)
    sys.exit(1)
print("OK: boot, tour, 6 skins, DECK in EN and RU")
