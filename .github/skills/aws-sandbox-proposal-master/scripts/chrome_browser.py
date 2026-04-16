#!/usr/bin/env python3
"""
Step 3B runtime loop coordinator, contract validator, and context writer.

This script does NOT drive a browser directly. Browser actions for Step 3B are
executed by the Copilot agent in the VS Code built-in browser context, while
this script provides:

- A runtime action loop payload (`--run-loop`) with perception reuse metadata
- Contract validation for share link and applied service set
- Context JSON write-back for calculator results

Usage examples:
    python chrome_browser.py \
        --context output/my_context.json \
        --start-url "https://calculator.aws/#/" \
        --run-loop \
        --loop-log output/step3b_execution_log.json

    python chrome_browser.py \
        --context output/my_context.json \
        --share-link "https://calculator.aws/#/estimate?id=abc123" \
        --applied-services "Amazon S3,AWS DMS"

    python chrome_browser.py \
        --context output/my_context.json \
        --result-json output/step3b_result.json

Result JSON format:
{
    "share_link": "https://calculator.aws/#/estimate?id=abc123",
    "applied_services": ["Amazon S3", "AWS DMS"]
}
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple
from urllib.parse import urlparse

DEFAULT_CACHE_TTL_SECONDS = 300
PERCEPTION_INVALIDATE_ON = [
    "url_changed",
    "region_changed",
    "signature_changed",
    "ttl_expired",
    "forced_after_save",
    "forced_after_navigate",
]


class WebAutomationError(RuntimeError):
    """Generic failure for browser automation planning and validation."""


# Backward-compatible alias for existing callers.
CalculatorError = WebAutomationError


@dataclass
class ServiceSpec:
    service_name: str
    calculator_config: Dict[str, Any]
    # Optional shorter term to type into the Find Service search box.
    # The AWS Calculator card labels often differ from the canonical service
    # name (e.g. "Amazon S3" may appear on a card as "S3" or
    # "Simple Storage Service (S3)").  Supply a short, unambiguous keyword
    # (e.g. "S3", "Lambda", "Step Functions") to avoid search-result misses.
    # Defaults to service_name when not provided.
    search_keyword: str = ""


@dataclass
class PagePerception:
    cache_key: str
    current_url: str
    url_pattern: str
    page_signature: str
    region: str
    selector_hints: Dict[str, str]
    captured_at_epoch: int
    ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS


@dataclass
class URLConfiguration:
    start_url: str
    origin: str
    home_url: str
    add_service_url: str
    summary_url: str
    home_url_pattern: str
    add_service_url_pattern: str
    summary_url_pattern: str
    share_link_example: str


@dataclass
class ActionSpec:
    """Scenario-agnostic action description for browser automation."""

    action_type: str
    selector: str = ""
    text: str = ""
    note: str = ""
    selector_candidates: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TaskSpec:
    """Scenario-agnostic task model that can be mapped to browser tools."""

    task_name: str
    actions: List[ActionSpec]
    expected_state: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PageState:
    """Observed page state used for perception cache reuse checks."""

    current_url: str
    page_signature: str = ""
    region: str = ""
    observed_at_epoch: int = 0
    observations: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ExecutionPolicy:
    """Execution guardrails for retry, fallback, and cache behavior."""

    cache_ttl_seconds: int = DEFAULT_CACHE_TTL_SECONDS
    max_retries: int = 2
    invalidate_on: List[str] = field(default_factory=lambda: list(PERCEPTION_INVALIDATE_ON))
    fallback_priority: List[str] = field(default_factory=lambda: ["role+name", "visible_text", "aria_label"])


@dataclass
class LoopSessionState:
    """State threaded across runtime loop iterations."""

    current_state: PageState
    perception: Optional[PagePerception]
    selector_history: Dict[str, str] = field(default_factory=dict)
    task_index: int = 0
    action_index: int = 0
    retries_for_action: int = 0
    max_steps: int = 200
    loop_epoch: int = 0


@dataclass
class ToolResult:
    """Agent-submitted execution outcome for one action."""

    action_id: str
    ok: bool
    current_url: str
    dom_signature: str
    observed_region: str = ""
    selector_used: str = ""
    error_type: str = ""
    error_message: str = ""
    timestamp: int = 0
    observations: Dict[str, Any] = field(default_factory=dict)


def _serialize_calculator_config(config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert calculator_config dict to a list of field definitions."""
    fields = []
    for field_name, value in config.items():
        fields.append({
            "field_name": field_name,
            "value": value
        })
    return fields


def _normalize_origin(raw_base_url: str) -> str:
    """Normalize origin/base URL for predictable hash-route construction."""
    parsed = urlparse(raw_base_url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise CalculatorError("Invalid start URL. Expected a valid http(s) URL")

    path = parsed.path.rstrip("/")
    return f"{parsed.scheme}://{parsed.netloc}{path}"


def _build_hash_url(origin: str, hash_path: str) -> str:
    cleaned_hash_path = hash_path if hash_path.startswith("/") else f"/{hash_path}"
    return f"{origin}/#{cleaned_hash_path}"


def build_url_config(start_url: str) -> URLConfiguration:
    """Build URL configuration from start_url to avoid domain hardcoding."""
    normalized_start_url = resolve_start_url(start_url)
    base_url = normalized_start_url.split("#", 1)[0]
    origin = _normalize_origin(base_url)

    home_url = _build_hash_url(origin, "/")
    add_service_url = _build_hash_url(origin, "/addService")
    summary_url = _build_hash_url(origin, "/estimate")

    escaped_origin = re.escape(origin)
    home_url_pattern = rf"^{escaped_origin}/?#/?$"
    add_service_url_pattern = rf"^{escaped_origin}/?#/addService"
    summary_url_pattern = rf"^{escaped_origin}/?#/estimate"

    return URLConfiguration(
        start_url=normalized_start_url,
        origin=origin,
        home_url=home_url,
        add_service_url=add_service_url,
        summary_url=summary_url,
        home_url_pattern=home_url_pattern,
        add_service_url_pattern=add_service_url_pattern,
        summary_url_pattern=summary_url_pattern,
        share_link_example=f"{summary_url}?id=<hash>",
    )


def resolve_start_url(cli_start_url: str) -> str:
    """Validate explicit CLI start URL for runtime loop execution."""
    text = str(cli_start_url or "").strip()
    if not text:
        raise CalculatorError("Missing start URL. Provide --start-url for Step 3B runtime loop")
    parsed = urlparse(text)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise CalculatorError(
            "Invalid start URL. Expected a valid http(s) URL"
        )
    if "#" not in text:
        raise CalculatorError("Invalid start URL. Expected hash-router format, such as https://host/#/")
    return text


def build_page_action_profile(page_kind: str, url_config: URLConfiguration) -> Dict[str, Any]:
    """Return selector profile for each page kind."""
    profiles: Dict[str, Dict[str, Any]] = {
        "home": {
            "url_pattern": url_config.home_url_pattern,
            "create_estimate": {
                "selector": "button:has-text('Create estimate')",
                "fallback": [{"tool": "click_element", "input": {"selector": "text=Create estimate"}}],
            },
        },
        "add_service": {
            "url_pattern": url_config.add_service_url_pattern,
            # Use "Search all services" mode so every service is discoverable
            # regardless of regional availability.  The region is set inside
            # each service's individual configuration form instead.
            "search_all_services": "label:has-text('Search all services')",
            "search_all_services_fallbacks": [
                "input[type='radio']:near(:text('Search all services'))",
                "text=Search all services",
            ],
            # Kept for reference; used only inside per-service config forms.
            "choose_region": "button:has-text('Choose a Region')",
            "find_service_input": "input[placeholder*='Find Service']",
            # Selector fallback chain for the Configure button on a service card.
            # Tokens substituted at task-build time:
            #   {service_name}   — canonical name from service_list (e.g. "Amazon S3")
            #   {search_keyword} — short search term (e.g. "S3"), used for card scoping
            #                      because card labels often differ from service_name.
            # Ordered from most-specific (least drift risk) to least-specific.
            "configure_fallbacks_template": [
                "button:has-text('Configure {service_name}')",               # exact full-name button
                "button:has-text('Configure {search_keyword}')",             # exact short-name button
                "[aria-label='Configure {service_name}']",                   # exact aria-label
                "[aria-label*='{service_name}']",                            # partial aria-label (full name)
                "[aria-label*='{search_keyword}']",                          # partial aria-label (short name)
                "[data-testid*='{search_keyword}'] button:has-text('Configure')",  # testid-scoped
                "article:has-text('{search_keyword}') >> button:has-text('Configure')",  # card article-scoped
                "li:has-text('{search_keyword}') >> button:has-text('Configure')",       # card li-scoped
                "div[class*='card']:has-text('{search_keyword}') >> button:has-text('Configure')",
                "button:has-text('Configure')",                              # generic last resort
            ],
            # Kept for direct use when only one result is on screen
            "configure_template": "button:has-text('Configure {service_name}')",
            "configure_generic": "button:has-text('Configure')",
            "save_add": "button:has-text('Save and add service')",
            "save_summary": "button:has-text('Save and view summary')",
            "view_summary": "button:has-text('View summary')",
        },
        "estimate_summary": {
            "url_pattern": url_config.summary_url_pattern,
            "share": "button:has-text('Share')",
        },
    }

    if page_kind not in profiles:
        raise CalculatorError(f"Unsupported page profile: {page_kind}")

    return profiles[page_kind]


def build_navigation_steps(
    region: str,
    start_url: str,
    home_profile: Dict[str, Any],
    add_service_profile: Dict[str, Any],
    summary_profile: Dict[str, Any],
    url_config: URLConfiguration,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Build navigation steps for entering calculator and collecting share link."""
    base_steps: List[Dict[str, Any]] = [
        {
            "step": "open_calculator",
            "tool": "open_browser_page",
            "input": {"url": start_url},
            "expected": "Calculator homepage opened in VS Code built-in browser tab",
        },
        {
            "step": "start_estimate",
            "tool": "click_element",
            "input": {"selector": home_profile["create_estimate"]["selector"]},
            "fallback": home_profile["create_estimate"]["fallback"],
            "expected": "Add Service page displayed",
        },
        {
            "step": "select_search_all_services",
            "tool": "click_element",
            "input": {"selector": add_service_profile["search_all_services"]},
            "fallback": [
                {"tool": "click_element", "input": {"selector": s}}
                for s in add_service_profile["search_all_services_fallbacks"]
            ],
            "expected": (
                "'Search all services' mode selected so every service is discoverable "
                "regardless of regional availability. Region will be set per-service "
                f"inside each configuration form (target: {region})."
            ),
        },
    ]

    tail_steps: List[Dict[str, Any]] = [
        {
            "step": "open_summary",
            "tool": "click_element",
            "input": {"selector": add_service_profile["view_summary"]},
            "fallback": [
                {
                    "tool": "navigate_page",
                    "input": {"type": "url", "url": url_config.summary_url},
                }
            ],
            "expected": "Estimate summary page visible",
        },
        {
            "step": "open_share_dialog",
            "tool": "click_element",
            "input": {"selector": summary_profile["share"]},
            "expected": "Share dialog opened",
        },
        {
            "step": "extract_share_link",
            "tool": "read_page",
            "input": {},
            "expected": f"Extract URL matching {url_config.share_link_example}",
        },
    ]
    return base_steps, tail_steps


def derive_page_signature(snapshot: Dict[str, Any]) -> str:
    """Build a stable signature from page snapshot metadata."""
    canonical = json.dumps(snapshot, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]
    return f"sha256:{digest}"


def build_perception_cache_key(current_url: str, region: str, page_signature: str) -> str:
    """Construct cache key from URL + region + page signature."""
    raw = f"{current_url.strip().lower()}|{region.strip().lower()}|{page_signature.strip().lower()}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()[:20]
    return f"pcache:{digest}"


def should_refresh_perception(
    previous: PagePerception,
    now_url: str,
    now_region: str,
    now_signature: str,
    action_type: str,
    now_epoch: Optional[int] = None,
) -> Tuple[bool, str]:
    """Decide whether perception cache should be invalidated and refreshed."""
    action = action_type.strip().lower()
    if action == "save":
        return True, "forced_after_save"
    if action == "navigate":
        return True, "forced_after_navigate"

    if previous.current_url and now_url and previous.current_url.strip() != now_url.strip():
        return True, "url_changed"

    if previous.region.strip().lower() != now_region.strip().lower():
        return True, "region_changed"

    if previous.page_signature.strip().lower() != now_signature.strip().lower():
        return True, "signature_changed"

    check_epoch = now_epoch if now_epoch is not None else int(time.time())
    age = max(0, check_epoch - int(previous.captured_at_epoch))
    if age > int(previous.ttl_seconds):
        return True, "ttl_expired"

    return False, "cache_valid"


def capture_or_reuse_perception(
    current_state: PageState,
    cached_perception: Optional[PagePerception],
    policy: ExecutionPolicy,
    action_type: str,
) -> Dict[str, Any]:
    """Generic cache decision helper reusable across different web scenarios."""
    now_epoch = current_state.observed_at_epoch or int(time.time())
    current_signature = current_state.page_signature
    if not current_signature:
        current_signature = derive_page_signature(current_state.observations or {"current_url": current_state.current_url})

    if cached_perception is None:
        new_cache = PagePerception(
            cache_key=build_perception_cache_key(current_state.current_url, current_state.region, current_signature),
            current_url=current_state.current_url,
            url_pattern=".*",
            page_signature=current_signature,
            region=current_state.region,
            selector_hints={},
            captured_at_epoch=now_epoch,
            ttl_seconds=policy.cache_ttl_seconds,
        )
        return {
            "perception": new_cache,
            "reused": False,
            "reason": "initial_capture",
        }

    should_refresh, reason = should_refresh_perception(
        previous=cached_perception,
        now_url=current_state.current_url,
        now_region=current_state.region,
        now_signature=current_signature,
        action_type=action_type,
        now_epoch=now_epoch,
    )

    if should_refresh:
        refreshed = PagePerception(
            cache_key=build_perception_cache_key(current_state.current_url, current_state.region, current_signature),
            current_url=current_state.current_url,
            url_pattern=cached_perception.url_pattern,
            page_signature=current_signature,
            region=current_state.region,
            selector_hints=dict(cached_perception.selector_hints),
            captured_at_epoch=now_epoch,
            ttl_seconds=policy.cache_ttl_seconds,
        )
        return {
            "perception": refreshed,
            "reused": False,
            "reason": reason,
        }

    return {
        "perception": cached_perception,
        "reused": True,
        "reason": reason,
    }


def _tool_name_for_action(action_type: str) -> str:
    action = action_type.strip().lower()
    mapping = {
        "navigate": "navigate_page",
        "click": "click_element",
        "type": "type_in_page",
        "read": "read_page",
        "hover": "hover_element",
    }
    return mapping.get(action, "read_page")


def apply_fallbacks(action: ActionSpec, selector_candidates: List[str]) -> ActionSpec:
    """Attach selector fallback candidates in a deterministic order."""
    cleaned = [s.strip() for s in selector_candidates if s and s.strip()]
    deduped: List[str] = []
    for selector in cleaned:
        if selector not in deduped:
            deduped.append(selector)
    action.selector_candidates = deduped
    return action


def plan_actions(
    task_spec: TaskSpec,
    initial_state: PageState,
    policy: ExecutionPolicy,
    cached_perception: Optional[PagePerception] = None,
) -> Dict[str, Any]:
    """Generate a generic, scenario-agnostic browser action plan for a task."""
    planned_actions: List[Dict[str, Any]] = []
    working_perception = cached_perception

    for action in task_spec.actions:
        decision = capture_or_reuse_perception(
            current_state=initial_state,
            cached_perception=working_perception,
            policy=policy,
            action_type=action.action_type,
        )
        working_perception = decision["perception"]
        action_payload: Dict[str, Any] = {
            "tool": _tool_name_for_action(action.action_type),
            "note": action.note,
            "input": {},
            "perception": {
                "cache_key": working_perception.cache_key,
                "reused": decision["reused"],
                "reason": decision["reason"],
                "max_retries": policy.max_retries,
                "fallback_priority": list(policy.fallback_priority),
            },
        }

        if action.selector:
            action_payload["input"]["selector"] = action.selector
        if action.text:
            action_payload["input"]["text"] = action.text
        if action.selector_candidates:
            action_payload["fallback"] = [
                {"tool": _tool_name_for_action(action.action_type), "input": {"selector": s}}
                for s in action.selector_candidates
            ]

        if action.metadata:
            action_payload["metadata"] = action.metadata

        planned_actions.append(action_payload)

    return {
        "task": task_spec.task_name,
        "actions": planned_actions,
        "expected_state": task_spec.expected_state,
        "metadata": task_spec.metadata,
    }


def verify_outcome(expected_state: Dict[str, Any], observed_state: Dict[str, Any]) -> Dict[str, Any]:
    """Generic key-based outcome verification for scenario-agnostic tasks."""
    mismatches: List[Dict[str, Any]] = []
    for key, expected_value in expected_state.items():
        observed_value = observed_state.get(key)
        if key.endswith("_pattern") and isinstance(expected_value, str) and isinstance(observed_value, str):
            if re.search(expected_value, observed_value):
                continue
        if observed_value != expected_value:
            mismatches.append(
                {
                    "key": key,
                    "expected": expected_value,
                    "observed": observed_value,
                }
            )

    return {
        "ok": len(mismatches) == 0,
        "mismatches": mismatches,
    }


def perceive_page(
    session: LoopSessionState,
    policy: ExecutionPolicy,
    action_type: str,
) -> Dict[str, Any]:
    """Perceive current page and decide whether to reuse cached perception."""
    decision = capture_or_reuse_perception(
        current_state=session.current_state,
        cached_perception=session.perception,
        policy=policy,
        action_type=action_type,
    )
    session.perception = decision["perception"]
    return decision


def infer_next_action(tasks: List[TaskSpec], session: LoopSessionState) -> Optional[Tuple[TaskSpec, ActionSpec]]:
    """Return next action from current loop cursor."""
    if session.task_index >= len(tasks):
        return None

    task = tasks[session.task_index]
    if session.action_index >= len(task.actions):
        session.task_index += 1
        session.action_index = 0
        session.retries_for_action = 0
        return infer_next_action(tasks, session)

    action = task.actions[session.action_index]
    return task, action


def execute_action(
    action: ActionSpec,
    perception_decision: Dict[str, Any],
    policy: ExecutionPolicy,
    selector_override: str = "",
) -> Dict[str, Any]:
    """Build executable tool payload for the agent runtime."""
    payload: Dict[str, Any] = {
        "tool": _tool_name_for_action(action.action_type),
        "input": {},
        "note": action.note,
        "perception": {
            "cache_key": perception_decision["perception"].cache_key,
            "reused": perception_decision["reused"],
            "reason": perception_decision["reason"],
            "max_retries": policy.max_retries,
            "fallback_priority": list(policy.fallback_priority),
        },
    }

    selected_selector = selector_override.strip() or action.selector
    if selected_selector:
        payload["input"]["selector"] = selected_selector
    if action.text:
        payload["input"]["text"] = action.text
    if action.selector_candidates:
        fallback_selectors = [s for s in action.selector_candidates if s and s.strip() and s.strip() != selected_selector]
        if fallback_selectors:
            payload["fallback"] = [
                {"tool": _tool_name_for_action(action.action_type), "input": {"selector": s}}
                for s in fallback_selectors
            ]
    if action.metadata:
        payload["metadata"] = action.metadata

    return payload


def handle_action_failure(
    action: ActionSpec,
    session: LoopSessionState,
    policy: ExecutionPolicy,
    failure_reason: str,
) -> Dict[str, Any]:
    """Apply mixed retry strategy for same-page acceleration."""
    action_type = action.action_type.strip().lower()
    failure = (failure_reason or "").strip().lower()
    force_refresh = action_type in {"save", "navigate"} or failure in {"navigation_drift", "stale_dom", "forced_after_save", "forced_after_navigate"}

    if force_refresh:
        session.current_state.observed_at_epoch = int(time.time())
        refreshed = perceive_page(session=session, policy=policy, action_type=action_type)
        return {
            "strategy": "force_reperceive",
            "reason": failure_reason,
            "perception": {
                "cache_key": refreshed["perception"].cache_key,
                "reused": refreshed["reused"],
                "reason": refreshed["reason"],
            },
            "retry": session.retries_for_action < policy.max_retries,
        }

    retry_allowed = session.retries_for_action < policy.max_retries
    if retry_allowed:
        session.retries_for_action += 1
        return {
            "strategy": "fallback_then_retry",
            "reason": failure_reason,
            "retry": True,
        }

    session.current_state.observed_at_epoch = int(time.time())
    refreshed = perceive_page(session=session, policy=policy, action_type="read")
    session.retries_for_action = 0
    return {
        "strategy": "reperceive_then_retry",
        "reason": failure_reason,
        "perception": {
            "cache_key": refreshed["perception"].cache_key,
            "reused": refreshed["reused"],
            "reason": refreshed["reason"],
        },
        "retry": True,
    }


def _action_key(session: LoopSessionState, action: ActionSpec) -> str:
    selector_anchor = action.selector.strip() or action.note.strip() or action.action_type.strip()
    return f"{session.task_index}:{session.action_index}:{selector_anchor}"


def _choose_selector(action: ActionSpec, session: LoopSessionState) -> str:
    key = _action_key(session, action)
    ordered: List[str] = []
    learned = session.selector_history.get(key, "").strip()
    if learned:
        ordered.append(learned)
    if action.selector.strip():
        ordered.append(action.selector.strip())
    for candidate in action.selector_candidates:
        if candidate and candidate.strip():
            ordered.append(candidate.strip())

    deduped: List[str] = []
    for selector in ordered:
        if selector not in deduped:
            deduped.append(selector)

    if not deduped:
        return ""
    idx = min(session.retries_for_action, len(deduped) - 1)
    return deduped[idx]


def _observed_state_from_result(session: LoopSessionState, result: ToolResult) -> Dict[str, Any]:
    observed = {
        "current_url": result.current_url,
        "current_url_pattern": result.current_url,
        "region": result.observed_region or session.current_state.region,
    }
    if isinstance(result.observations, dict):
        observed.update(result.observations)
    return observed


def _failure_reason_from_result(result: ToolResult, verify: Dict[str, Any]) -> str:
    if result.error_type.strip():
        return result.error_type.strip().lower()
    if not result.ok:
        return "tool_failed"
    if not verify.get("ok", False):
        return "verification_failed"
    return "unknown_failure"


def _tool_result_from_dict(payload: Dict[str, Any]) -> ToolResult:
    action_id = str(payload.get("action_id", "")).strip()
    if not action_id:
        raise CalculatorError("loop result missing required field: action_id")

    if "ok" not in payload:
        raise CalculatorError("loop result missing required field: ok")
    ok = bool(payload.get("ok"))

    current_url = str(payload.get("current_url", "")).strip()
    if not current_url:
        raise CalculatorError("loop result missing required field: current_url")

    dom_signature = str(payload.get("dom_signature", "")).strip()
    observations = payload.get("observations", {})
    if observations is None:
        observations = {}
    if not isinstance(observations, dict):
        raise CalculatorError("loop result field 'observations' must be an object")

    if not dom_signature:
        dom_signature = derive_page_signature(observations or {"current_url": current_url})

    timestamp_raw = payload.get("timestamp", int(time.time()))
    try:
        timestamp = int(timestamp_raw)
    except (TypeError, ValueError):
        timestamp = int(time.time())

    return ToolResult(
        action_id=action_id,
        ok=ok,
        current_url=current_url,
        dom_signature=dom_signature,
        observed_region=str(payload.get("observed_region", "")).strip(),
        selector_used=str(payload.get("selector_used", "")).strip(),
        error_type=str(payload.get("error_type", "")).strip(),
        error_message=str(payload.get("error_message", "")).strip(),
        timestamp=timestamp,
        observations=observations,
    )


def _read_loop_results_json(path: Path) -> List[ToolResult]:
    if not path.exists():
        raise CalculatorError(f"Loop result JSON file not found: {path}")
    payload = json.loads(path.read_text(encoding="utf-8-sig"))

    if isinstance(payload, list):
        return [_tool_result_from_dict(item) for item in payload if isinstance(item, dict)]

    if isinstance(payload, dict):
        if isinstance(payload.get("tool_results"), list):
            arr = payload.get("tool_results") or []
            return [_tool_result_from_dict(item) for item in arr if isinstance(item, dict)]
        if "action_id" in payload:
            return [_tool_result_from_dict(payload)]

    raise CalculatorError(
        "Invalid loop result JSON format. Expected one object with action_id, a list of results, or {tool_results:[...]}"
    )


def integrate_browser_outcome(session: LoopSessionState, result: ToolResult) -> None:
    """Update loop state from an executed tool result."""
    session.current_state.current_url = result.current_url
    session.current_state.page_signature = result.dom_signature
    if result.observed_region:
        session.current_state.region = result.observed_region
    session.current_state.observed_at_epoch = result.timestamp or int(time.time())
    session.current_state.observations = dict(result.observations)


def _build_runtime_tasks(services: List[ServiceSpec], region: str, add_service_profile: Dict[str, Any], url_config: URLConfiguration) -> List[TaskSpec]:
    """Build runtime task graph for loop-based orchestration."""
    tasks: List[TaskSpec] = [
        TaskSpec(
            task_name="open_calculator",
            actions=[ActionSpec(action_type="navigate", selector="", note="Open calculator home", metadata={"url": url_config.start_url})],
            expected_state={"current_url_pattern": url_config.home_url_pattern},
        ),
        TaskSpec(
            task_name="start_estimate",
            actions=[
                ActionSpec(
                    action_type="click",
                    selector="button:has-text('Create estimate')",
                    note="Enter Add Service page",
                    selector_candidates=["text=Create estimate"],
                ),
                # Select "Search all services" so every service is discoverable
                # even if it is not listed under the chosen region's location
                # filter.  Region is configured per-service in each config form.
                ActionSpec(
                    action_type="click",
                    selector=add_service_profile["search_all_services"],
                    note=(
                        "Select 'Search all services' mode — ensures all services are "
                        "visible regardless of regional availability. "
                        f"Region '{region}' will be set inside each service config form."
                    ),
                    selector_candidates=add_service_profile["search_all_services_fallbacks"],
                ),
            ],
            expected_state={},
        ),
    ]

    total = len(services)
    for i, service in enumerate(services):
        is_last = i == (total - 1)
        tasks.append(_service_to_task_spec(service, is_last=is_last, add_service_profile=add_service_profile, region=region))

    expected_service_names = [s.service_name for s in services]
    tasks.append(
        TaskSpec(
            task_name="verify_all_services_before_share",
            actions=[
                ActionSpec(
                    action_type="click",
                    selector=add_service_profile["view_summary"],
                    note="Navigate to the estimate summary page",
                    selector_candidates=["text=View summary"],
                ),
                # STEP A: set page size to 50 so all services fit on one page.
                # The gear icon (⚙) in the top-right of the table header opens
                # the Preferences dialog which has 10 / 30 / 50 rows options.
                ActionSpec(
                    action_type="click",
                    selector="button[aria-label='Preferences']",
                    note=(
                        "Click the gear / Preferences icon (⚙) in the top-right corner of "
                        "the service table header to open the Preferences dialog. "
                        "Fallback selectors: button:has-text('Preferences'), "
                        "[aria-label='Preferences'], [title='Preferences'], "
                        "any button containing a gear icon near the pagination controls."
                    ),
                    selector_candidates=[
                        "button:has-text('Preferences')",
                        "[aria-label='Preferences']",
                        "[title='Preferences']",
                        "button[class*='gear']",
                        "button[class*='preferences']",
                    ],
                ),
                ActionSpec(
                    action_type="click",
                    selector="label:has-text('50 rows')",
                    note=(
                        "Inside the Preferences dialog, select '50 rows' as the page size. "
                        "This ensures all services (up to 50) appear on a single page, "
                        "eliminating the need to paginate when verifying the full service list. "
                        "Fallback: input[type='radio']:near(:text('50 rows')), "
                        "text=50 rows."
                    ),
                    selector_candidates=[
                        "input[type='radio']:near(:text('50 rows'))",
                        "text=50 rows",
                        "[value='50']",
                    ],
                ),
                ActionSpec(
                    action_type="click",
                    selector="button:has-text('Confirm')",
                    note=(
                        "Click 'Confirm' to apply the 50-row page size. "
                        "The table will reload showing up to 50 services on a single page."
                    ),
                    selector_candidates=["button:has-text('Confirm')", "button[type='submit']"],
                ),
                # STEP B: read the full table — now all services are on one page.
                ActionSpec(
                    action_type="read",
                    note=(
                        f"Read the summary table — it is now set to 50 rows per page, so ALL "
                        f"services should be visible without pagination. "
                        f"List every service name you can see in the table. "
                        f"If a pagination indicator (e.g. '1 of 2') is still visible, the "
                        f"estimate has more than 50 services — click 'Next' and collect the "
                        f"remaining names from subsequent pages before proceeding. "
                        f"Report: total row count + the full list of service names seen."
                    ),
                    metadata={
                        "purpose": "full_table_read_after_page_size_50",
                        "expected_service_count": total,
                    },
                ),
                # STEP C: strict exact-count + name-by-name verification.
                ActionSpec(
                    action_type="read",
                    note=(
                        f"⚠️ STRICT EXACT-COUNT VERIFICATION — expected exactly {total} services.\n"
                        f"Expected list: {expected_service_names}\n\n"
                        f"Using the complete list you just collected:\n\n"
                        f"CASE 1 — actual count > {total} (TOO MANY / DUPLICATES):\n"
                        f"  • Identify which service(s) appear more than once.\n"
                        f"  • For each DUPLICATE row: check the checkbox on that row, then "
                        f"    click the 'Delete' button in the toolbar above the table to "
                        f"    remove it. Remove ALL extra copies — keep exactly one of each.\n"
                        f"  • After deleting, read the table again to confirm count == {total}.\n"
                        f"  • DO NOT proceed to Share while any duplicate exists.\n\n"
                        f"CASE 2 — actual count < {total} (TOO FEW / MISSING):\n"
                        f"  • Identify which expected service(s) are absent.\n"
                        f"  • Click 'Add service', add ONLY the missing ones (do NOT re-add "
                        f"    any service already present).\n"
                        f"  • Return to this verification step and re-read the table.\n\n"
                        f"CASE 3 — actual count == {total} AND all names match (PASS):\n"
                        f"  • Proceed to the screenshot action.\n\n"
                        f"Report: actual count, names found, names missing, names duplicated."
                    ),
                    metadata={
                        "expected_service_count": total,
                        "expected_services": expected_service_names,
                        "require_exact_count": True,
                        "require_name_match": True,
                        "block_on_over_count": True,
                        "block_on_under_count": True,
                    },
                ),
                ActionSpec(
                    action_type="screenshot",
                    note=(
                        f"Take a screenshot of the summary table showing ALL {total} services "
                        f"on a single page (50-row view). "
                        f"This is required evidence before Share. "
                        f"The screenshot must show exactly {total} rows — no duplicates, no missing entries."
                    ),
                    metadata={"purpose": "pre_share_service_count_evidence", "expected_count": total},
                ),
            ],
            expected_state={"service_count_verified": True, "expected_count": total},
        )
    )
    tasks.append(
        TaskSpec(
            task_name="collect_share_link",
            actions=[
                ActionSpec(
                    action_type="click",
                    selector="button:has-text('Share')",
                    note=(
                        f"GUARD: Only click Share if the previous verify step confirmed "
                        f"EXACTLY {total} service(s) — no more, no fewer. "
                        f"If count was over or under {total}, do NOT click Share."
                    ),
                ),
                ActionSpec(
                    action_type="read",
                    note=(
                        "Read the 'Save estimate' dialog. Wait for the progress bar to "
                        "complete (up to 15 s). Extract the full URL from the input field "
                        "inside the dialog. The URL must match "
                        "https://calculator.aws/#/estimate?id=<alphanumeric-hash>. "
                        "Copy it exactly — do NOT fabricate, shorten, or guess this URL. "
                        "If no URL appears after 15 s, close the dialog and re-click Share."
                    ),
                ),
            ],
            expected_state={"summary_opened": True},
        )
    )
    # Round-trip verification: navigate to the extracted link and confirm the
    # estimate loads with the expected services.  This is the only way to prove
    # the link is real and not fabricated.
    tasks.append(
        TaskSpec(
            task_name="verify_share_link_round_trip",
            actions=[
                ActionSpec(
                    action_type="navigate",
                    note=(
                        "Navigate to the share link URL you just extracted from the "
                        "dialog. Use the exact URL — do not modify it."
                    ),
                    metadata={
                        "url_source": "share_link_from_collect_share_link_task",
                        "purpose": "Round-trip verification that the link is real and loads a valid estimate",
                    },
                ),
                ActionSpec(
                    action_type="read",
                    note=(
                        f"Read the loaded estimate page. "
                        f"The table may paginate — read ALL pages (click 'Next' if present) "
                        f"to collect the complete service list before counting. "
                        f"Confirm the total across all pages equals exactly {total} service(s): "
                        f"{expected_service_names}. "
                        "If the page shows an error, is empty, count != expected, or any "
                        "expected service is missing — the link is invalid or the estimate "
                        "has duplicates. DO NOT write it to context. "
                        "Return to the start of Step 3B and repeat the full browser flow."
                    ),
                    metadata={
                        "expected_service_count": total,
                        "expected_services": expected_service_names,
                        "halt_on_mismatch": True,
                        "paginate_all_pages": True,
                    },
                ),
            ],
            expected_state={"link_round_trip_verified": True, "expected_count": total},
        )
    )
    return tasks


def run_agent_loop(
    context_data: Dict[str, Any],
    start_url: str,
    max_steps: int = 200,
    policy: Optional[ExecutionPolicy] = None,
    tool_results: Optional[List[ToolResult]] = None,
) -> Dict[str, Any]:
    """Run runtime loop orchestration and emit callable tool actions.

    This does not execute browser tools directly. It emits sequential tool calls
    with perception metadata so an agent runtime can execute and feed outcomes.
    """
    region, services = _extract_contract(context_data)
    url_config = build_url_config(start_url)
    add_service_profile = build_page_action_profile("add_service", url_config)

    exec_policy = policy or ExecutionPolicy()
    initial_state = PageState(
        current_url=start_url,
        page_signature=derive_page_signature({"url": start_url, "phase": "bootstrap"}),
        region=region,
        observed_at_epoch=int(time.time()),
        observations={"phase": "bootstrap"},
    )
    session = LoopSessionState(
        current_state=initial_state,
        perception=None,
        max_steps=max_steps,
        loop_epoch=int(time.time()),
    )

    tasks = _build_runtime_tasks(services=services, region=region, add_service_profile=add_service_profile, url_config=url_config)
    execution_log: List[Dict[str, Any]] = []
    consumed_results = tool_results or []

    for idx, result in enumerate(consumed_results, start=1):
        inferred = infer_next_action(tasks, session)
        if inferred is None:
            break
        task, action = inferred

        integrate_browser_outcome(session, result)
        observed_state = _observed_state_from_result(session, result)
        verify = verify_outcome(task.expected_state, observed_state)
        failure_reason = _failure_reason_from_result(result, verify)

        log_entry: Dict[str, Any] = {
            "feedback_index": idx,
            "task": task.task_name,
            "action_type": action.action_type,
            "action_id": result.action_id,
            "result_ok": result.ok,
            "verification": verify,
        }

        if result.ok and verify["ok"]:
            session.retries_for_action = 0
            selector = result.selector_used.strip() or action.selector.strip()
            if selector:
                session.selector_history[_action_key(session, action)] = selector
            session.action_index += 1
            log_entry["status"] = "advanced"
        else:
            recovery = handle_action_failure(
                action=action,
                session=session,
                policy=exec_policy,
                failure_reason=failure_reason,
            )
            log_entry["status"] = "recovery"
            log_entry["recovery"] = recovery
            if not recovery.get("retry", False):
                session.action_index += 1
                session.retries_for_action = 0

        execution_log.append(log_entry)

    inferred_next = infer_next_action(tasks, session)
    next_action: Optional[Dict[str, Any]] = None
    loop_status = "completed"

    if inferred_next is not None:
        task, action = inferred_next
        action_type = action.action_type.strip().lower()
        selector_probe = _choose_selector(action, session)
        perception_action_type = "save" if action_type == "click" and "save" in selector_probe.lower() else action_type
        perception_decision = perceive_page(session=session, policy=exec_policy, action_type=perception_action_type)
        tool_payload = execute_action(
            action=action,
            perception_decision=perception_decision,
            policy=exec_policy,
            selector_override=selector_probe,
        )

        next_action = {
            "task": task.task_name,
            "task_index": session.task_index,
            "action_index": session.action_index,
            "action_id": f"t{session.task_index}_a{session.action_index}",
            "tool_call": tool_payload,
            "retry_count": session.retries_for_action,
        }
        loop_status = "awaiting_action"

    return {
        "ok": True,
        "mode": "runtime-loop",
        "status": loop_status,
        "start_url": start_url,
        "region": region,
        "service_count": len(services),
        "processed_feedback_count": len(consumed_results),
        "max_steps": max_steps,
        "perception_cache_contract": {
            "ttl_seconds": exec_policy.cache_ttl_seconds,
            "invalidate_on": exec_policy.invalidate_on,
            "strategy": "mixed",
            "click_type_policy": "fallback_then_retry_before_reperceive",
            "navigate_save_policy": "force_reperceive",
        },
        "execution_log": execution_log,
        "next_action": next_action,
    }


def _service_to_task_spec(service: ServiceSpec, is_last: bool, add_service_profile: Dict[str, Any], region: str = "") -> TaskSpec:
    """Legacy adapter: convert calculator service model into generic TaskSpec."""
    save_selector = add_service_profile["save_summary"] if is_last else add_service_profile["save_add"]
    cfg_fields = _serialize_calculator_config(service.calculator_config)

    # The exact canonical name from aws_services.json is typed into the search
    # box, so the first result card is always the correct service.
    # Use service_name as the search term (it is already the exact calculator name).
    # search_keyword is kept for backward-compatibility but defaults to service_name.
    search_kw = service.search_keyword or service.service_name

    # Simple selector: after typing the exact name only one matching card appears,
    # so the generic Configure button is unambiguous.
    configure_selector = add_service_profile["configure_generic"]
    configure_fallback_selectors = [
        add_service_profile["configure_template"].replace("{service_name}", service.service_name),
    ]

    task_actions = [
        # PRE-ADD DUPLICATE GUARD: before searching, glance at the page header
        # or mini-summary to check if this service is already in the estimate.
        # If the estimate counter in the header already includes this service name
        # (or the service was marked as added in a prior save confirmation), skip
        # this entire configure flow — do NOT add it again.
        ActionSpec(
            action_type="read",
            note=(
                f"Quick duplicate guard: confirm '{service.service_name}' has not already "
                f"been added to the estimate in this session. "
                f"If it was saved successfully in a prior step, skip this configure flow. "
                f"Otherwise proceed to search."
            ),
            metadata={"service_name": service.service_name, "purpose": "pre_add_duplicate_guard"},
        ),
        apply_fallbacks(
            ActionSpec(
                action_type="click",
                selector=add_service_profile["find_service_input"],
                note="Focus the service search input",
                selector_candidates=[
                    "input[placeholder*='Find Service']",
                    "input[placeholder*='Search']",
                ],
            ),
            [],
        ),
        ActionSpec(
            action_type="type",
            text=search_kw,
            note=(
                f"Type '{search_kw}' — the exact canonical name from aws_services.json. "
                f"This guarantees the first search result is '{service.service_name}'. "
                f"Click Configure on the first result immediately after the results load."
            ),
        ),
        # Brief read after typing so the React SPA has time to settle the results
        # DOM before the click.  The exact name from aws_services.json guarantees
        # the first card is the correct one — no manual verification needed.
        ActionSpec(
            action_type="read",
            note=(
                f"Wait for the search results to load after typing '{search_kw}'. "
                f"The first card shown is the correct '{service.service_name}' service "
                f"because the exact canonical name from aws_services.json was used. "
                f"Proceed directly to clicking Configure on the first result."
            ),
            metadata={"service_name": service.service_name, "search_keyword": search_kw},
        ),
        apply_fallbacks(
            ActionSpec(
                action_type="click",
                selector=configure_selector,
                note=(
                    f"Click Configure on the first result — the exact name '{search_kw}' "
                    f"matches only '{service.service_name}' in the calculator catalogue."
                ),
            ),
            configure_fallback_selectors,
        ),
        # Read the configuration page before filling fields so the agent can
        # identify the correct input elements for this service.
        # Also handle region: because 'Search all services' was used, no global
        # region was set on the Add Service page.  If the configuration form
        # shows a region/location dropdown, set it to the target region BEFORE
        # filling any other fields.  If no region dropdown is visible, skip it.
        ActionSpec(
            action_type="read",
            note=(
                f"Read the {service.service_name} configuration page. "
                f"If a region or location dropdown is present, set it to "
                f"'{region}' before filling anything else. "
                f"Then identify and fill these fields: "
                f"{[f['field_name'] for f in cfg_fields]}. "
                "Do NOT save yet."
            ),
            metadata={"target_region": region, "fields_to_fill": cfg_fields},
        ),
    ]

    # Fill each configuration field from calculator_config before saving.
    for cfg_field in cfg_fields:
        task_actions.append(
            ActionSpec(
                action_type="click",
                note=(
                    f"Locate and click the input field for '{cfg_field['field_name']}' "
                    f"(expected value: {cfg_field['value']})"
                ),
                metadata={"field_name": cfg_field["field_name"], "value": cfg_field["value"]},
            )
        )
        task_actions.append(
            ActionSpec(
                action_type="type",
                text=str(cfg_field["value"]),
                note=f"Set '{cfg_field['field_name']}' = {cfg_field['value']}",
                metadata={"field_name": cfg_field["field_name"]},
            )
        )

    task_actions.append(
        ActionSpec(
            action_type="click",
            selector=save_selector,
            note="Persist configured values — use 'Save and add service' unless this is the last service",
        )
    )
    # Confirm the save was successful before proceeding to the next service.
    task_actions.append(
        ActionSpec(
            action_type="read",
            note=(
                f"⚠️ SAVE CONFIRMATION — read the page after clicking Save. "
                f"Look for a green success banner or confirmation that "
                f"'{service.service_name}' was added to the estimate. "
                f"If no confirmation banner is visible: "
                f"(1) Do NOT proceed to the next service. "
                f"(2) The save likely failed due to validation errors (e.g. memory < 2 GB, "
                f"storage < 20 GB). Fix the values and click Save again. "
                f"Only advance when you can confirm the service was saved."
            ),
            metadata={"service_name": service.service_name, "purpose": "save_confirmation"},
        )
    )

    return TaskSpec(
        task_name=f"configure_{service.service_name}",
        actions=task_actions,
        expected_state={"service_name": service.service_name, "saved": True},
        metadata={
            "calculator_fields": cfg_fields,
        },
    )


def _build_service_step(
    service: ServiceSpec,
    step_num: int,
    is_last: bool,
    perception_mode: str,
    page_perception: PagePerception,
    add_service_profile: Dict[str, Any],
) -> Dict[str, Any]:
    """Build a single service configuration step with page-perception controls."""
    save_selector = add_service_profile["save_summary"] if is_last else add_service_profile["save_add"]
    generic_task = _service_to_task_spec(service, is_last=is_last, add_service_profile=add_service_profile, region=page_perception.region)
    generic_policy = ExecutionPolicy(cache_ttl_seconds=page_perception.ttl_seconds)
    generic_initial_state = PageState(
        current_url=page_perception.current_url,
        page_signature=page_perception.page_signature,
        region=page_perception.region,
        observed_at_epoch=page_perception.captured_at_epoch,
        observations={"selector_hints": page_perception.selector_hints},
    )
    generic_plan = plan_actions(
        task_spec=generic_task,
        initial_state=generic_initial_state,
        policy=generic_policy,
        cached_perception=page_perception,
    )
    
    # Create anchor link for guide reference (format: "amazon-s3", "aws-lambda", etc.)
    service_name_lower = service.service_name.lower().replace(" ", "-")
    
    return {
        "step": f"configure_service_{step_num}",
        "service_name": service.service_name,
        "workflow": {
            "step_1_search": {
                "description": "Search for the service in calculator",
                "actions": [
                    {
                        "tool": "click_element",
                        "input": {"selector": add_service_profile["find_service_input"]},
                        "note": "Click on the 'Find Service' input field"
                    },
                    {
                        "tool": "type_in_page",
                        "input": {"text": service.service_name},
                        "note": f"Type service name: '{service.service_name}'"
                    }
                ]
            },
            "step_2_click_configure": {
                "description": "Click the Configure button for this service",
                "actions": [
                    {
                        "tool": "click_element",
                        "input": {"selector": add_service_profile["configure_template"].format(service_name=service.service_name)},
                        "fallback": [
                            {"tool": "click_element", "input": {"selector": add_service_profile["configure_generic"]}}
                        ],
                        "note": "Click Configure button"
                    }
                ]
            },
            "step_3_fill_configuration": {
                "description": f"Fill configuration fields for {service.service_name}",
                "guide_reference": f"AWS_CALCULATOR_GUIDE.md#{service_name_lower}-configuration",
                "instructions": f"Use AWS_CALCULATOR_GUIDE.md to identify where each field is located, then fill them in order:",
                "fields_to_fill": _serialize_calculator_config(service.calculator_config),
                "field_filling_hint": "For each field: 1) Locate the input field based on label/placeholder, 2) Click on it, 3) Enter the value"
            },
            "step_4_save": {
                "description": "Save this service configuration",
                "actions": [
                    {
                        "tool": "click_element",
                        "input": {"selector": save_selector},
                        "note": "Click Save button to complete this service"
                    }
                ]
            }
        },
        "perception": {
            "mode": perception_mode,
            "cache_key": page_perception.cache_key,
            "verify_before_action": {
                "required": perception_mode == "reuse_if_valid",
                "checks": [
                    {"type": "url_pattern", "expected": page_perception.url_pattern},
                    {"type": "page_signature", "expected": page_perception.page_signature},
                    {"type": "region", "expected": page_perception.region},
                ],
            },
            "refresh_on_invalidate": {
                "enabled": True,
                "strategy": "recapture_snapshot_then_retry",
                "actions": [
                    {"tool": "read_page", "input": {}, "note": "Capture fresh DOM/accessibility snapshot"}
                ],
                "invalidate_on": PERCEPTION_INVALIDATE_ON,
            },
            "fallback_selector_priority": ["role+name", "visible_text", "aria_label"],
            "max_retries": 2,
        },
        "generic_task_plan": generic_plan,
        "expected": f"Service '{service.service_name}' configured and saved"
    }


def build_tool_contract() -> Dict[str, Any]:
    """Return reusable API contract for scenario docs under references/*.md."""
    return {
        "name": "web-automation-acceleration-toolkit",
        "version": "v1",
        "exports": {
            "derive_page_signature": {
                "input": {"snapshot": "Dict[str, Any]"},
                "output": "str",
                "purpose": "Generate deterministic page signature for cache comparison",
            },
            "build_perception_cache_key": {
                "input": {
                    "current_url": "str",
                    "region": "str",
                    "page_signature": "str",
                },
                "output": "str",
                "purpose": "Build cache key for perception reuse",
            },
            "should_refresh_perception": {
                "input": {
                    "previous": "PagePerception",
                    "now_url": "str",
                    "now_region": "str",
                    "now_signature": "str",
                    "action_type": "str",
                },
                "output": "Tuple[bool, str]",
                "purpose": "Decide whether to invalidate cached perception",
            },
            "capture_or_reuse_perception": {
                "input": {
                    "current_state": "PageState",
                    "cached_perception": "Optional[PagePerception]",
                    "policy": "ExecutionPolicy",
                    "action_type": "str",
                },
                "output": "Dict[str, Any]",
                "purpose": "Core accelerator: reuse same-page perception or recapture",
            },
            "plan_actions": {
                "input": {
                    "task_spec": "TaskSpec",
                    "initial_state": "PageState",
                    "policy": "ExecutionPolicy",
                },
                "output": "Dict[str, Any]",
                "purpose": "Generate scenario-agnostic action plans",
            },
            "verify_outcome": {
                "input": {
                    "expected_state": "Dict[str, Any]",
                    "observed_state": "Dict[str, Any]",
                },
                "output": "Dict[str, Any]",
                "purpose": "Generic outcome verification for any scenario",
            },
        },
        "legacy_adapter": {
            "service_list_to_task_spec": "_service_to_task_spec",
            "status": "supported",
        },
    }


def build_service_steps(
    services: List[ServiceSpec],
    region: str,
    add_service_profile: Dict[str, Any],
    url_config: URLConfiguration,
) -> List[Dict[str, Any]]:
    """Generate service steps with first-capture and same-page reuse semantics."""
    now_epoch = int(time.time())
    add_service_url = url_config.add_service_url
    signature_seed = {
        "page": "add_service",
        "find_service_input": add_service_profile["find_service_input"],
        "configure_generic": add_service_profile["configure_generic"],
        "region_bound": True,
    }
    page_signature = derive_page_signature(signature_seed)
    cache_key = build_perception_cache_key(add_service_url, region, page_signature)

    base_perception = PagePerception(
        cache_key=cache_key,
        current_url=add_service_url,
        url_pattern=add_service_profile["url_pattern"],
        page_signature=page_signature,
        region=region,
        selector_hints={
            "find_service_input": add_service_profile["find_service_input"],
            "configure_generic": add_service_profile["configure_generic"],
        },
        captured_at_epoch=now_epoch,
        ttl_seconds=DEFAULT_CACHE_TTL_SECONDS,
    )

    service_steps: List[Dict[str, Any]] = []
    total = len(services)
    for i, svc in enumerate(services):
        is_last = i == (total - 1)
        perception_mode = "capture_once" if i == 0 else "reuse_if_valid"

        service_step = _build_service_step(
            service=svc,
            step_num=i + 1,
            is_last=is_last,
            perception_mode=perception_mode,
            page_perception=base_perception,
            add_service_profile=add_service_profile,
        )

        if perception_mode == "reuse_if_valid":
            refresh_needed, reason = should_refresh_perception(
                previous=base_perception,
                now_url=add_service_url,
                now_region=region,
                now_signature=page_signature,
                action_type="search",
                now_epoch=now_epoch,
            )
            service_step["perception"]["precheck"] = {
                "rule": "validate_before_reuse",
                "refresh_needed": refresh_needed,
                "reason": reason,
            }
        else:
            service_step["perception"]["precheck"] = {
                "rule": "initial_capture_required",
                "refresh_needed": True,
                "reason": "first_service_capture",
            }

        service_steps.append(service_step)

    return service_steps


def build_execution_plan(
    context_data: Dict[str, Any],
    start_url: str,
    url_config: URLConfiguration,
) -> Dict[str, Any]:
    """Build deterministic Step 3B action plan for VS Code browser tool execution.
    
    This plan extracts common workflow steps (search, configure, fill, save) that apply
    to all services, and provides structured parameter lists rather than hardcoded selectors.
    """
    region, services = _extract_contract(context_data)

    home_profile = build_page_action_profile("home", url_config)
    add_service_profile = build_page_action_profile("add_service", url_config)
    summary_profile = build_page_action_profile("estimate_summary", url_config)

    base_steps, tail_steps = build_navigation_steps(
        region=region,
        start_url=start_url,
        home_profile=home_profile,
        add_service_profile=add_service_profile,
        summary_profile=summary_profile,
        url_config=url_config,
    )

    service_steps = build_service_steps(
        services=services,
        region=region,
        add_service_profile=add_service_profile,
        url_config=url_config,
    )

    return {
        "mode": "vscode-built-in-browser",
        "url": start_url,
        "region": region,
        "expected_services": [s.service_name for s in services],
        "generic_workflow": ["search", "click_configure", "fill_configuration", "save"],
        "workflow_description": "All services follow the same 4-step workflow: 1) Search, 2) Click Configure, 3) Fill fields (refer to guide), 4) Save",
        "navigation_contract": {
            "start_url": start_url,
            "allowed_url_patterns": [
                home_profile["url_pattern"],
                add_service_profile["url_pattern"],
                summary_profile["url_pattern"],
            ],
            "summary_url": url_config.summary_url,
        },
        "perception_cache_contract": {
            "version": "v1",
            "reuse_scope": "same_page",
            "ttl_seconds": DEFAULT_CACHE_TTL_SECONDS,
            "invalidate_on": PERCEPTION_INVALIDATE_ON,
            "first_service_policy": "capture_once",
            "followup_service_policy": "reuse_if_valid",
        },
        "steps": [*base_steps, *service_steps, *tail_steps],
        "result_contract": {
            "share_link": url_config.share_link_example,
            "applied_services": [s.service_name for s in services],
        },
    }


def _normalized_set(values: Sequence[str]) -> set:
    return {str(v).strip().lower() for v in values if str(v).strip()}


def _sanitize_service_name(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def _validate_share_link(value: str, expected_origin: Optional[str] = None) -> str:
    text = value.strip()
    parsed = urlparse(text)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise CalculatorError("Invalid share link format. Expected a valid http(s) URL")

    actual_origin = _normalize_origin(f"{parsed.scheme}://{parsed.netloc}{parsed.path}")
    if expected_origin and actual_origin != expected_origin:
        raise CalculatorError(
            f"Invalid share link origin. Expected '{expected_origin}'"
        )

    fragment = parsed.fragment or ""
    if not fragment.startswith("/estimate?id="):
        raise CalculatorError(
            "Invalid share link format. Expected fragment '/estimate?id=<hash>'"
        )

    share_id = fragment.split("?id=", 1)[1] if "?id=" in fragment else ""
    if not share_id or not re.match(r"^[A-Za-z0-9_-]+$", share_id):
        raise CalculatorError(
            "Invalid share link format. Expected '/estimate?id=<hash>' with an alphanumeric hash"
        )
    return text


def _load_context(context_path: Path) -> Dict[str, Any]:
    if not context_path.exists():
        raise CalculatorError(f"Context file not found: {context_path}")

    data = json.loads(context_path.read_text(encoding="utf-8"))
    if "document_data" in data and isinstance(data["document_data"], dict):
        data = data["document_data"]

    sandbox = data.get("sandbox")
    if not isinstance(sandbox, dict):
        raise CalculatorError("Invalid context: missing sandbox object")

    return data


def _extract_contract(data: Dict[str, Any]) -> Tuple[str, List[ServiceSpec]]:
    sandbox = data.get("sandbox", {})
    business = sandbox.get("business", {})

    region = str(business.get("region", "")).strip()
    if not region:
        raise CalculatorError("Missing required field: sandbox.business.region")

    raw_services = business.get("service_list")
    if not isinstance(raw_services, list) or not raw_services:
        raise CalculatorError("Missing required field: sandbox.business.service_list")

    services: List[ServiceSpec] = []
    for idx, item in enumerate(raw_services):
        if not isinstance(item, dict):
            raise CalculatorError(f"service_list[{idx}] must be an object")

        service_name = _sanitize_service_name(str(item.get("service_name", "")))
        if not service_name:
            raise CalculatorError(f"service_list[{idx}].service_name is required")

        cfg = item.get("calculator_config", {})
        if cfg is None:
            cfg = {}
        if not isinstance(cfg, dict):
            raise CalculatorError(f"service_list[{idx}].calculator_config must be an object")

        raw_kw = item.get("search_keyword", "")
        search_keyword = _sanitize_service_name(str(raw_kw)) if raw_kw else service_name

        services.append(ServiceSpec(service_name=service_name, calculator_config=cfg, search_keyword=search_keyword))

    return region, services


def _parse_applied_services_csv(value: str) -> List[str]:
    return [_sanitize_service_name(part) for part in value.split(",") if part.strip()]


def _read_applied_services_file(path: Path) -> List[str]:
    if not path.exists():
        raise CalculatorError(f"Applied services file not found: {path}")

    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return [_sanitize_service_name(line) for line in raw.splitlines() if line.strip()]

    if isinstance(payload, list):
        return [_sanitize_service_name(str(v)) for v in payload if str(v).strip()]

    if isinstance(payload, dict) and isinstance(payload.get("applied_services"), list):
        arr = payload["applied_services"]
        return [_sanitize_service_name(str(v)) for v in arr if str(v).strip()]

    raise CalculatorError("Invalid applied services file format")


def _read_result_json(path: Path) -> Tuple[Optional[str], Optional[List[str]]]:
    if not path.exists():
        raise CalculatorError(f"Result JSON file not found: {path}")

    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise CalculatorError("Result JSON must be an object")

    share_link: Optional[str] = None
    applied_services: Optional[List[str]] = None

    if "share_link" in payload and payload["share_link"] is not None:
        share_link = str(payload["share_link"])

    if "applied_services" in payload and payload["applied_services"] is not None:
        val = payload["applied_services"]
        if not isinstance(val, list):
            raise CalculatorError("result_json.applied_services must be a list")
        applied_services = [_sanitize_service_name(str(v)) for v in val if str(v).strip()]

    return share_link, applied_services


def _ensure_service_consistency(expected_services: List[ServiceSpec], applied_services: List[str]) -> None:
    expected = _normalized_set([s.service_name for s in expected_services])
    actual = _normalized_set(applied_services)

    if expected != actual:
        missing = sorted(expected - actual)
        extra = sorted(actual - expected)
        raise CalculatorError(f"Service mismatch detected. missing={missing}, extra={extra}")


def _write_back_context(
    context_path: Path,
    context_data: Dict[str, Any],
    share_link: str,
    applied_services: List[str],
) -> None:
    sandbox = context_data.setdefault("sandbox", {})
    business = sandbox.setdefault("business", {})
    business["calculator_link"] = share_link
    business["applied_services"] = applied_services

    context_path.write_text(
        json.dumps(context_data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def _resolve_result_inputs(
    args: argparse.Namespace,
    expected_origin: Optional[str] = None,
) -> Tuple[str, List[str]]:
    share_link = args.share_link or ""
    applied_services: List[str] = []

    if args.result_json:
        from_json_link, from_json_services = _read_result_json(Path(args.result_json))
        if from_json_link:
            share_link = from_json_link
        if from_json_services is not None:
            applied_services = from_json_services

    if args.applied_services:
        applied_services = _parse_applied_services_csv(args.applied_services)

    if args.applied_services_file:
        applied_services = _read_applied_services_file(Path(args.applied_services_file))

    if not share_link.strip():
        raise CalculatorError("Missing required result: share link")

    if not applied_services:
        raise CalculatorError("Missing required result: applied services")

    return _validate_share_link(share_link, expected_origin=expected_origin), applied_services


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate and write Step 3B results into context.json"
    )
    parser.add_argument("--context", default="", help="Path to Step 2 context JSON")
    parser.add_argument(
        "--start-url",
        default="",
        help="Calculator start URL for runtime loop execution.",
    )
    parser.add_argument("--share-link", default="", help="Extracted AWS calculator share link")
    parser.add_argument(
        "--applied-services",
        default="",
        help="Comma-separated service list used in calculator (e.g., 'Amazon S3,AWS DMS')",
    )
    parser.add_argument(
        "--applied-services-file",
        default="",
        help="Path to newline list or JSON list/object with applied_services",
    )
    parser.add_argument(
        "--result-json",
        default="",
        help="Path to JSON file containing share_link/applied_services, or loop tool results when --run-loop is enabled",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate only, do not write back to context file",
    )
    parser.add_argument(
        "--run-loop",
        action="store_true",
        help="Emit runtime browser action loop payload for tool execution",
    )
    parser.add_argument(
        "--max-steps",
        type=int,
        default=200,
        help="Maximum runtime loop actions to emit when --run-loop is enabled",
    )
    parser.add_argument(
        "--loop-log",
        default="",
        help="Optional path to write runtime loop execution log JSON",
    )
    parser.add_argument(
        "--print-tool-contract",
        action="store_true",
        help="Print scenario-agnostic web automation toolkit contract and exit",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.print_tool_contract:
        print(json.dumps(build_tool_contract(), ensure_ascii=False))
        return 0

    if not args.context.strip():
        raise CalculatorError("Missing --context. Required unless --print-tool-contract is used")

    context_path = Path(args.context).resolve()
    context_data = _load_context(context_path)
    region, services = _extract_contract(context_data)

    if args.run_loop:
        if args.share_link.strip() or args.applied_services.strip() or args.applied_services_file.strip():
            raise CalculatorError("When --run-loop is enabled, do not provide share-link/applied-services write-back inputs")
        if not args.start_url.strip():
            raise CalculatorError("Missing --start-url. Required when --run-loop is enabled")
        start_url = resolve_start_url(args.start_url)
        loop_results: List[ToolResult] = []
        if args.result_json.strip():
            loop_results = _read_loop_results_json(Path(args.result_json))

        loop_payload = run_agent_loop(
            context_data=context_data,
            start_url=start_url,
            max_steps=max(1, int(args.max_steps)),
            tool_results=loop_results,
        )
        if args.loop_log.strip():
            loop_path = Path(args.loop_log)
            loop_path.parent.mkdir(parents=True, exist_ok=True)
            loop_path.write_text(json.dumps(loop_payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps(loop_payload, ensure_ascii=False))
        return 0

    has_result_inputs = bool(
        args.share_link.strip()
        or args.applied_services.strip()
        or args.applied_services_file.strip()
        or args.result_json.strip()
    )

    if not has_result_inputs:
        # Runtime loop only mode.
        return 0

    expected_origin = None
    if args.start_url.strip():
        expected_origin = build_url_config(args.start_url).origin

    share_link, applied_services = _resolve_result_inputs(args, expected_origin=expected_origin)

    _ensure_service_consistency(services, applied_services)

    if args.dry_run:
        print(
            json.dumps(
                {
                    "ok": True,
                    "dry_run": True,
                    "region": region,
                    "share_link": share_link,
                    "applied_services": applied_services,
                    "service_count": len(services),
                },
                ensure_ascii=False,
            )
        )
        return 0

    _write_back_context(
        context_path=context_path,
        context_data=context_data,
        share_link=share_link,
        applied_services=applied_services,
    )

    print(
        json.dumps(
            {
                "ok": True,
                "dry_run": False,
                "region": region,
                "share_link": share_link,
                "applied_services": applied_services,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except CalculatorError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
