#!/usr/bin/env python3
"""Batch-fix light theme violations across all dashboard pages."""

import re
import os
import sys

BASE_DIR = "/Users/grubby/Desktop/SecMind/frontend/src/app/(dashboard)"

FILES = [
    "ai-analysis/page.tsx",
    "ai-chat/page.tsx",
    "assets/page.tsx",
    "audit/page.tsx",
    "cases/page.tsx",
    "dashboard/page.tsx",
    "datasource/page.tsx",
    "hunting/page.tsx",
    "integrations/page.tsx",
    "investigate/page.tsx",
    "knowledge/page.tsx",
    "learning/page.tsx",
    "metrics/page.tsx",
    "notifications/page.tsx",
    "onboarding/page.tsx",
    "playbooks/editor/page.tsx",
    "reports/page.tsx",
    "response/page.tsx",
    "screen/page.tsx",
    "signals/page.tsx",
    "situation-room/page.tsx",
    "system/billing/page.tsx",
    "system/compliance/page.tsx",
    "system/page.tsx",
    "system/rbac/page.tsx",
    "system/tenants/page.tsx",
    "users/page.tsx",
    "workflows/page.tsx",
]

# Replacement rules - order matters: more specific first
RULES = [
    # 1. bg-white (standalone, NOT followed by / or [)
    (r'bg-white(?!/|\[)', 'bg-[#131316]'),
    # 2. bg-slate-50 → bg-[#09090b]
    (r'bg-slate-50', 'bg-[#09090b]'),
    # 3-7. text-slate replacements
    (r'text-slate-900', 'text-white'),
    (r'text-slate-800', 'text-zinc-100'),
    (r'text-slate-700', 'text-zinc-200'),
    (r'text-slate-600', 'text-zinc-400'),
    (r'text-slate-500', 'text-zinc-500'),
    # 8-9. border-slate replacements
    (r'border-slate-200', 'border-white/6'),
    (r'border-slate-100', 'border-white/4'),
]

def count_replacements(original, modified):
    """Count how many individual replacements were made."""
    # Count occurrences of each pattern in original and modified
    count = 0
    for pattern, replacement in RULES:
        matches = re.findall(pattern, original)
        count += len(matches)
    return count

def process_file(filepath):
    """Process a single file, applying all replacement rules."""
    full_path = os.path.join(BASE_DIR, filepath)
    
    if not os.path.exists(full_path):
        return {"file": filepath, "status": "NOT_FOUND", "replacements": 0}
    
    with open(full_path, 'r', encoding='utf-8') as f:
        original = f.read()
    
    modified = original
    for pattern, replacement in RULES:
        modified = re.sub(pattern, replacement, modified)
    
    if modified == original:
        return {"file": filepath, "status": "NO_CHANGE", "replacements": 0}
    
    # Count actual replacements
    total_count = 0
    for pattern, replacement in RULES:
        matches = re.findall(pattern, original)
        total_count += len(matches)
    
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(modified)
    
    return {"file": filepath, "status": "MODIFIED", "replacements": total_count}

def main():
    results = []
    for filepath in FILES:
        result = process_file(filepath)
        results.append(result)
        status_icon = "✅" if result["status"] == "MODIFIED" else ("⚠️" if result["status"] == "NOT_FOUND" else "⏭️")
        print(f"{status_icon} {result['file']}: {result['status']} ({result['replacements']} replacements)")
    
    modified_count = sum(1 for r in results if r["status"] == "MODIFIED")
    total_replacements = sum(r["replacements"] for r in results)
    not_found = sum(1 for r in results if r["status"] == "NOT_FOUND")
    
    print(f"\n{'='*60}")
    print(f"Summary: {modified_count} files modified, {total_replacements} total replacements")
    if not_found:
        print(f"WARNING: {not_found} files not found")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()