"""Print the PostgreSQL DDL for every model, for review before migrating.

Needs no database connection:

    cd backend && python scripts/print_schema.py > schema_review.sql
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost/x")

from sqlalchemy.dialects import postgresql  # noqa: E402
from sqlalchemy.schema import CreateIndex, CreateTable  # noqa: E402

from app import db  # noqa: E402

for table in db.metadata.sorted_tables:
    print(str(CreateTable(table).compile(dialect=postgresql.dialect())).strip() + ";")

    for index in sorted(table.indexes, key=lambda i: i.name or ""):
        print(str(CreateIndex(index).compile(dialect=postgresql.dialect())).strip() + ";")

    print()
