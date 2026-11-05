"""Vercel serverless entrypoint for the MyDuka Flask API.

Vercel routes /api/* here (see vercel.json). The Flask app lives in
backend/, so that folder is added to the import path first.
"""

import os
import sys

BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "backend")
)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import app  # noqa: E402,F401
