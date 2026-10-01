"""Export frozen OpenAPI specification from FastAPI application."""

import json
import os
import sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root not in sys.path:
    sys.path.insert(0, root)

from backend.app.api.main import app


def export_openapi():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    docs_dir = os.path.join(root, "docs")
    os.makedirs(docs_dir, exist_ok=True)
    out_file = os.path.join(docs_dir, "openapi.json")

    spec = app.openapi()
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(spec, f, indent=2)

    print(f"Exported OpenAPI spec to {out_file} (title: {spec['info']['title']}, version: {spec['info']['version']})")


if __name__ == "__main__":
    export_openapi()
