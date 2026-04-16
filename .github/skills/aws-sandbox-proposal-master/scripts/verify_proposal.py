#!/usr/bin/env python3
"""
verify_proposal.py — DOCX content verification for AWS Sandbox proposals.

Usage:
    python verify_proposal.py <Proposal.docx> <context.json>

Exit codes:
    0  — all checks passed
    1  — one or more checks failed
"""

import argparse
import io
import json
import re
import sys
import zipfile
from datetime import date
from pathlib import Path

# Force UTF-8 output on Windows where the default console encoding may be cp1252
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def strip_markdown(text: str) -> str:
    """Remove common markdown markers so we can match raw text in XML.

    Also collapses newlines to spaces so that fields whose first heading
    is immediately followed by a newline (e.g. "## Problem\\nFinancial...")
    don't produce a search string that contains a literal newline character,
    which would never match inside raw DOCX XML where newlines are encoded
    as <w:br/> elements or &#10; entities.
    """
    text = re.sub(r'\*\*', '', text)
    text = re.sub(r'^[-*] ', '', text, flags=re.MULTILINE)
    text = re.sub(r'^#{1,6} ', '', text, flags=re.MULTILINE)
    # Collapse newlines → single space so the search string has no \n
    text = re.sub(r'\s+', ' ', text)
    return text


def unescape_xml(xml: str) -> str:
    return (xml
            .replace('&amp;', '&')
            .replace('&lt;', '<')
            .replace('&gt;', '>')
            .replace('&quot;', '"')
            .replace('&apos;', "'"))


def normalize_for_search(text: str) -> str:
    """Normalize text for fuzzy XML search.

    docxtpl can replace special characters (e.g. '&') with spaces when
    rendering into DOCX XML.  To avoid false negatives we strip '&' and
    collapse runs of whitespace to a single space so both the search term
    and the XML fragment match the same normalized form.
    """
    text = text.replace('&', ' ')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def first25(value: str) -> str:
    """Return first 25 chars of a stripped value."""
    v = strip_markdown(value).strip()
    return v[:25] if v else ''


def get_nested(d: dict, *keys, default=None):
    """Safely navigate nested dict. Returns default on missing key."""
    cur = d
    for k in keys:
        if not isinstance(cur, dict):
            return default
        cur = cur.get(k, None)
        if cur is None:
            return default
    return cur


# ---------------------------------------------------------------------------
# Check runners
# ---------------------------------------------------------------------------

class CheckResult:
    def __init__(self, label: str, passed: bool, detail: str = ''):
        self.label = label
        self.passed = passed
        self.detail = detail  # shown in ISSUES section when failed

    def __str__(self):
        status = 'PASS' if self.passed else 'FAIL'
        return f'  [{status}] {self.label}'


def run_checks(docx_path: Path, context_path: Path):
    # ---- Load context.json ------------------------------------------------
    try:
        with open(context_path, 'r', encoding='utf-8') as f:
            ctx = json.load(f)
    except Exception as e:
        print(f'ERROR: Cannot read context.json: {e}')
        sys.exit(1)

    sandbox = ctx.get('sandbox', {})

    # ---- Load raw DOCX XML ------------------------------------------------
    try:
        with zipfile.ZipFile(docx_path, 'r') as z:
            raw_xml = z.read('word/document.xml').decode('utf-8')
    except Exception as e:
        print(f'ERROR: Cannot read DOCX: {e}')
        sys.exit(1)

    xml_unescaped = unescape_xml(raw_xml)
    # Normalized XML: collapse whitespace and strip & for fuzzy phase matching
    xml_normalized = normalize_for_search(xml_unescaped)
    # Plain-text XML: tags stripped then whitespace collapsed — used for
    # multi-word fields whose content may be split across multiple <w:t> elements
    xml_text = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', xml_unescaped))

    results = []

    # ====================================================================
    # GROUP A — Rendering Artifacts
    # ====================================================================
    group_a = []

    # A1: No unrendered Jinja2 tags
    jinja_matches = re.findall(r'\{\{[^}]+\}\}|\{%[^%]+%\}', raw_xml)
    if jinja_matches:
        group_a.append(CheckResult(
            'No unrendered Jinja2 tags',
            False,
            f'Found {len(jinja_matches)} unrendered tag(s): {jinja_matches[:3]}'
        ))
    else:
        group_a.append(CheckResult('No unrendered Jinja2 tags', True))

    # A2: No unexpected <TODO> remaining (human-only fields are OK)
    # Human-only fields: contact.name, contact.title, contact.email, pdm, sa
    # We check the clean text of the document for <TODO> not in those fields
    # Strategy: strip XML tags, look for literal TODO text
    clean_text = re.sub(r'<[^>]+>', ' ', raw_xml)
    clean_text = re.sub(r'\s+', ' ', clean_text)
    # Find all TODO occurrences
    todo_matches = re.findall(r'<TODO\s*>', clean_text)
    if todo_matches:
        group_a.append(CheckResult(
            'No unexpected <TODO> in output',
            False,
            f'Found {len(todo_matches)} <TODO> occurrence(s) in document text'
        ))
    else:
        group_a.append(CheckResult('No unexpected <TODO> in output', True))

    results.append(('GROUP A — Rendering Artifacts', group_a))

    # ====================================================================
    # GROUP B — Mandatory Field Content
    # ====================================================================
    group_b = []

    mandatory_fields = [
        ('details.summary',               ['sandbox', 'details', 'summary'],               True),
        ('details.features',              ['sandbox', 'details', 'features'],              True),
        ('details.pain_point',            ['sandbox', 'details', 'pain_point'],            True),
        ('details.solution_type',         ['sandbox', 'details', 'solution_type'],         False),
        ('details.customer_type',         ['sandbox', 'details', 'customer_type'],         False),
        ('business.justification',        ['sandbox', 'business', 'justification'],        True),
        ('business.aws_funding',          ['sandbox', 'business', 'aws_funding'],          False),
        ('business.labor_cost',           ['sandbox', 'business', 'labor_cost'],           False),
        ('business.total_cost',           ['sandbox', 'business', 'total_cost'],           False),
        ('business.calculator_link',      ['sandbox', 'business', 'calculator_link'],      False),
        ('business.start_date',           ['sandbox', 'business', 'start_date'],           False),
        ('business.end_date',             ['sandbox', 'business', 'end_date'],             False),
        ('business.release_date',         ['sandbox', 'business', 'release_date'],         False),
        ('architecture.description',      ['sandbox', 'architecture', 'description'],      True),
        # NOTE: sandbox.plan.total_mandays is stored in context.json but is NOT a
        # direct template placeholder — only {{phase.mandays}} per phase is used.
        # The total_mandays value is checked indirectly via Group D phase checks.
    ]

    for display_name, key_path, do_strip_md in mandatory_fields:
        value = get_nested(ctx, *key_path)
        if value is None:
            group_b.append(CheckResult(
                f'{display_name:<30}— (missing in context.json)',
                False,
                f'Key {".".join(key_path)} not found in context.json'
            ))
            continue

        str_value = str(value).strip()
        if not str_value:
            group_b.append(CheckResult(
                f'{display_name:<30}— (empty value)',
                False,
                f'Field {display_name} is an empty string in context.json'
            ))
            continue

        # Build search string: strip markdown if needed, take first 25 chars
        if do_strip_md:
            search_raw = strip_markdown(str_value).strip()[:25]
        else:
            search_raw = str_value[:25]

        # Show truncated value in label
        display_val = str_value[:40] + ('...' if len(str_value) > 40 else '')
        label = f'{display_name:<30}— "{display_val}"'

        # Three-tier search:
        # 1) exact in unescaped raw XML  (simple values like dates, costs)
        # 2) normalized (& → space) in normalized XML  (phase names with &)
        # 3) in plain-text XML (tags stripped) — catches multi-word fields split
        #    across <w:t> elements e.g. architecture.description after a heading
        search_norm = normalize_for_search(search_raw)
        found = (search_raw and search_raw in xml_unescaped) or \
                (search_norm and search_norm in xml_normalized) or \
                (search_norm and search_norm in xml_text)

        if found:
            group_b.append(CheckResult(label, True))
        else:
            group_b.append(CheckResult(
                label,
                False,
                f'First 25 chars of {display_name} not found in document XML. '
                f'Expected: "{search_raw}"'
            ))

    results.append(('GROUP B — Mandatory Field Content', group_b))

    # ====================================================================
    # GROUP C — Architecture Diagram
    # ====================================================================
    group_c = []

    has_drawing = '<w:drawing>' in raw_xml or '<pic:pic' in raw_xml
    group_c.append(CheckResult(
        'Diagram image embedded',
        has_drawing,
        'No <w:drawing> or <pic:pic found in document XML — diagram not embedded' if not has_drawing else ''
    ))

    results.append(('GROUP C — Architecture Diagram', group_c))

    # ====================================================================
    # GROUP D — Phases Table
    # ====================================================================
    group_d = []

    total_phases = get_nested(ctx, 'sandbox', 'plan', 'total_phases', default=[])
    phase_count = len(total_phases) if isinstance(total_phases, list) else 0

    group_d.append(CheckResult(
        f'Phase count: {phase_count} phase(s) declared',
        phase_count >= 1,
        'sandbox.plan.total_phases is empty or missing' if phase_count < 1 else ''
    ))

    # Check activities in document
    all_activities_found = True
    missing_activities = []
    all_dates_found = True
    missing_dates = []
    all_mandays_found = True
    missing_mandays = []

    for i, phase in enumerate(total_phases if isinstance(total_phases, list) else []):
        if not isinstance(phase, dict):
            continue
        activity = phase.get('activity', '')
        delivery_date = phase.get('delivery_date', '')
        mandays = phase.get('mandays', '')

        if activity:
            search_act = activity[:25]
            search_act_norm = normalize_for_search(search_act)
            act_found = (search_act in xml_unescaped) or \
                        (search_act_norm and search_act_norm in xml_normalized) or \
                        (search_act_norm and search_act_norm in xml_text)
            if not act_found:
                all_activities_found = False
                missing_activities.append(f'Phase {i+1}: "{search_act}"')

        if delivery_date:
            search_date = str(delivery_date)[:25]
            if search_date not in xml_unescaped and search_date not in xml_text:
                all_dates_found = False
                missing_dates.append(f'Phase {i+1}: "{search_date}"')

        if mandays:
            search_md = str(mandays)[:10]
            if search_md not in xml_unescaped and search_md not in xml_text:
                all_mandays_found = False
                missing_mandays.append(f'Phase {i+1}: "{search_md}" mandays')

    group_d.append(CheckResult(
        'Phase activities in document',
        all_activities_found,
        f'Missing activities: {missing_activities}' if missing_activities else ''
    ))

    group_d.append(CheckResult(
        'Phase delivery dates in document',
        all_dates_found,
        f'Missing dates: {missing_dates}' if missing_dates else ''
    ))

    group_d.append(CheckResult(
        'Phase mandays in document',
        all_mandays_found,
        f'Missing mandays: {missing_mandays}' if missing_mandays else ''
    ))

    results.append(('GROUP D — Phases Table', group_d))

    # ====================================================================
    # GROUP E — Calculator Link
    # ====================================================================
    group_e = []

    calc_link = get_nested(ctx, 'sandbox', 'business', 'calculator_link', default='')
    calc_link = str(calc_link).strip() if calc_link else ''

    # E1: not empty
    group_e.append(CheckResult(
        'Link not empty',
        bool(calc_link),
        'sandbox.business.calculator_link is empty or missing'
    ))

    # E2: format validation
    calc_pattern = r'^https://calculator\.aws/#/estimate\?id=[A-Za-z0-9_-]+$'
    format_valid = bool(calc_link and re.match(calc_pattern, calc_link))
    group_e.append(CheckResult(
        'Link format valid',
        format_valid,
        f'calculator_link does not match expected format. Got: "{calc_link}"'
    ))

    results.append(('GROUP E — Calculator Link', group_e))

    # ====================================================================
    # GROUP F — Service Lists
    # ====================================================================
    group_f = []

    service_list = get_nested(ctx, 'sandbox', 'business', 'service_list', default=[])
    svc_count = len(service_list) if isinstance(service_list, list) else 0
    group_f.append(CheckResult(
        f'service_list has {svc_count} service(s)',
        svc_count >= 1,
        'sandbox.business.service_list is empty or missing'
    ))

    biz_applied = get_nested(ctx, 'sandbox', 'business', 'applied_services', default=None)
    if biz_applied is None:
        # applied_services may live only in architecture — check there
        group_f.append(CheckResult(
            'business.applied_services has N/A (field lives in architecture)',
            True,  # not a hard failure — field may not be required in business
            ''
        ))
    else:
        biz_app_count = len(biz_applied) if isinstance(biz_applied, list) else 0
        group_f.append(CheckResult(
            f'business.applied_services has {biz_app_count} service(s)',
            biz_app_count >= 1,
            'sandbox.business.applied_services is empty or missing'
        ))

    arch_applied = get_nested(ctx, 'sandbox', 'architecture', 'applied_services', default=[])
    arch_app_count = len(arch_applied) if isinstance(arch_applied, list) else 0
    group_f.append(CheckResult(
        f'architecture.applied_services has {arch_app_count} service(s)',
        arch_app_count >= 1,
        'sandbox.architecture.applied_services is empty or missing'
    ))

    results.append(('GROUP F — Service Lists', group_f))

    return results


# ---------------------------------------------------------------------------
# Report formatter
# ---------------------------------------------------------------------------

DIVIDER = '━' * 64


def print_report(docx_path: Path, context_path: Path, results):
    today = date.today().isoformat()

    print(DIVIDER)
    print('DOCX CONTENT VERIFICATION REPORT')
    print(f'Document : {docx_path}')
    print(f'Context  : {context_path}')
    print(f'Date     : {today}')
    print(DIVIDER)
    print()

    all_checks = []
    issues = []

    for group_label, checks in results:
        print(group_label)
        for c in checks:
            print(str(c))
            all_checks.append(c)
            if not c.passed and c.detail:
                issues.append(f'  • {c.label.strip()} — {c.detail}')
        print()

    total = len(all_checks)
    failed = sum(1 for c in all_checks if not c.passed)
    passed = total - failed

    print(DIVIDER)
    if failed == 0:
        print(f'RESULT: ✅  ALL {total} CHECKS PASSED')
    else:
        print(f'RESULT: ❌  {failed} CHECK(S) FAILED  ({passed}/{total} passed)')
        print()
        print('ISSUES:')
        for issue in issues:
            print(issue)
    print(DIVIDER)

    return failed


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description='Verify a rendered AWS Sandbox Proposal DOCX against its context.json'
    )
    parser.add_argument('docx', help='Path to the rendered Proposal.docx')
    parser.add_argument('context', help='Path to context.json used to generate the proposal')
    args = parser.parse_args()

    docx_path = Path(args.docx)
    context_path = Path(args.context)

    if not docx_path.exists():
        print(f'ERROR: DOCX not found: {docx_path}')
        sys.exit(1)
    if not context_path.exists():
        print(f'ERROR: context.json not found: {context_path}')
        sys.exit(1)

    results = run_checks(docx_path, context_path)
    failed = print_report(docx_path, context_path, results)

    sys.exit(0 if failed == 0 else 1)


if __name__ == '__main__':
    main()
