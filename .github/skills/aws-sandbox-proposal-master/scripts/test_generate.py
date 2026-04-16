#!/usr/bin/env python3
"""
test_generate.py — Unit tests for the template-based DOCX generator.

Tests validate:
  1. Environment prerequisites (docxtpl, python-docx installed)
  2. Context validation logic (required field checking)
  3. Markdown → RichText conversion
  4. Full DOCX generation (template binding)
  5. Template placeholder coverage (all Jinja2 vars populated)
  6. Architecture diagram embedding

Usage:
    python test_generate.py              # run all tests
    python test_generate.py -v           # verbose
    python test_generate.py TestMarkdown # run specific test class
"""
import json
import sys
import unittest
import zipfile
from pathlib import Path

# ── path setup ────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR / "scripts"))

from generate_proposal import (
    _is_markdown,
    auto_convert_markdown,
    build_render_context,
    generate_proposal,
    markdown_to_richtext,
    validate_context,
)

SKILL_DIR = SCRIPT_DIR.parent
TEMPLATE_PATH = SKILL_DIR / "assets" / "Sandbox Innovation Plan Template_v2.docx"
OUTPUT_DIR = SCRIPT_DIR / "test_output"


def _ensure_test_diagram() -> Path:
    """Create a tiny PNG used by tests that require an existing diagram file."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / "test_diagram.png"
    if path.exists():
        return path

    png_bytes = bytes.fromhex(
        "89504E470D0A1A0A"
        "0000000D49484452000000010000000108060000001F15C489"
        "0000000D49444154789C6360606060000000050001A5F64540"
        "0000000049454E44AE426082"
    )
    path.write_bytes(png_bytes)
    return path


# ── Minimal valid context fixture ─────────────────────────────────────────────
def _minimal_context(overrides: dict = None) -> dict:
    diagram_path = _ensure_test_diagram()
    ctx = {
        "sandbox": {
            "basics": {
                "title": "Test Sandbox Proposal",
                "partner": "TestPartner",
                "contact": {
                    "name": "Test User",
                    "title": "SA",
                    "email": "test@example.com",
                },
                "pdm": "PDM Name",
                "sa": "SA Name",
            },
            "details": {
                "update": {
                    "feature": "",
                    "customer": "",
                    "pain_point": "",
                    "opportunity": "",
                    "publish_date": "",
                },
                "summary": "## Overview\nThis is a **test** summary with _italic_ text.",
                "features": "- Feature 1\n- Feature 2\n- **Bold feature**",
                "solution_type": "Horizontal",
                "customer_type": "Enterprise",
                "pain_point": "- Pain point 1\n- Pain point 2",
            },
            "business": {
                "justification": "Test justification with `inline code`.",
                "aws_funding": "USD 50,000",
                "labor_cost": "USD 30,000",
                "total_cost": "USD 80,000",
                "start_date": "2026-04-01",
                "end_date": "2026-09-30",
                "release_date": "2026-10-15",
                "region": "Asia Pacific (Taipei)",
                "service_list": [
                    {
                        "service_name": "Amazon S3",
                        "calculator_config": {
                            "storage_gb": 10,
                            "put_requests": 400,
                            "get_requests": 400,
                        },
                    },
                    {
                        "service_name": "AWS DMS",
                        "calculator_config": {
                            "instance_type": "dms.t3.large",
                            "instances": 1,
                        },
                    },
                ],
                "applied_services": ["Amazon S3", "AWS DMS"],
                "public_or_not": "No",
                "case_study": "Yes",
                "calculator_link": "https://calculator.aws/#/estimate?id=test123",
                "additional_info": "Additional context here.",
            },
            "plan": {
                "total_mandays": "45",
                "total_phases": [
                    {
                        "activity": "Phase 1 Planning",
                        "description": "Initial planning and architecture.",
                        "mandays": "15",
                        "delivery_date": "2026-05-01",
                    },
                    {
                        "activity": "Phase 2 Build",
                        "description": "Core development and testing.",
                        "mandays": "30",
                        "delivery_date": "2026-09-30",
                    },
                ],
            },
            "architecture": {
                "diagram": str(diagram_path),
                "applied_services": ["Amazon S3", "AWS DMS"],
                "description": "## Architecture\n\nThis uses **CloudFront**, *ECS*, and RDS.",
            },
        }
    }
    if overrides:
        # Simple shallow merge for testing
        for path, value in overrides.items():
            parts = path.split(".")
            d = ctx
            for p in parts[:-1]:
                d = d[p]
            d[parts[-1]] = value
    return ctx


# ══════════════════════════════════════════════════════════════════════════════
class TestEnvironment(unittest.TestCase):
    """Check that required Python packages are importable."""

    def test_docxtpl_importable(self):
        import docxtpl
        self.assertTrue(hasattr(docxtpl, "DocxTemplate"))

    def test_python_docx_importable(self):
        import docx
        self.assertTrue(hasattr(docx, "Document"))

    def test_template_file_exists(self):
        self.assertTrue(
            TEMPLATE_PATH.exists(),
            f"Template not found at {TEMPLATE_PATH}"
        )

    def test_template_has_jinja2_placeholders(self):
        """Template must contain Jinja2 placeholders."""
        with zipfile.ZipFile(TEMPLATE_PATH) as z:
            xml = z.read("word/document.xml").decode("utf-8")
        self.assertIn("{{sandbox.", xml, "No Jinja2 placeholders found in template")

    def test_template_has_calculator_link(self):
        """Template must include the calculator_link placeholder."""
        with zipfile.ZipFile(TEMPLATE_PATH) as z:
            xml = z.read("word/document.xml").decode("utf-8")
        self.assertIn("calculator_link", xml,
                      "calculator_link placeholder missing from template")

    def test_template_has_plan_loop(self):
        """Template must include the row loop for delivery phases."""
        with zipfile.ZipFile(TEMPLATE_PATH) as z:
            xml = z.read("word/document.xml").decode("utf-8")
        self.assertIn("total_phases", xml,
                      "total_phases loop missing from template")


# ══════════════════════════════════════════════════════════════════════════════
class TestContextValidation(unittest.TestCase):
    """Verify the validate_context() field checker."""

    def test_valid_context_passes(self):
        ctx = _minimal_context()
        missing = validate_context(ctx)
        self.assertEqual(missing, [], f"Expected no missing fields, got: {missing}")

    def test_missing_root_sandbox_key(self):
        missing = validate_context({"not_sandbox": {}})
        self.assertTrue(len(missing) > 0)

    def test_missing_title(self):
        ctx = _minimal_context()
        ctx["sandbox"]["basics"]["title"] = ""
        missing = validate_context(ctx)
        self.assertIn("sandbox.basics.title", missing)

    def test_missing_partner(self):
        ctx = _minimal_context()
        ctx["sandbox"]["basics"]["partner"] = ""
        missing = validate_context(ctx)
        self.assertIn("sandbox.basics.partner", missing)

    def test_missing_contact_email(self):
        ctx = _minimal_context()
        ctx["sandbox"]["basics"]["contact"]["email"] = ""
        missing = validate_context(ctx)
        self.assertIn("sandbox.basics.contact.email", missing)

    def test_missing_phases(self):
        ctx = _minimal_context()
        ctx["sandbox"]["plan"]["total_phases"] = []
        missing = validate_context(ctx)
        self.assertIn("sandbox.plan.total_phases", missing)

    def test_missing_phase_field(self):
        ctx = _minimal_context()
        ctx["sandbox"]["plan"]["total_phases"][0]["delivery_date"] = ""
        missing = validate_context(ctx)
        self.assertIn("sandbox.plan.total_phases[0].delivery_date", missing)

    def test_multiple_missing_fields(self):
        ctx = _minimal_context()
        ctx["sandbox"]["basics"]["title"] = ""
        ctx["sandbox"]["business"]["aws_funding"] = ""
        missing = validate_context(ctx)
        self.assertGreaterEqual(len(missing), 2)

    def test_missing_region(self):
        ctx = _minimal_context()
        ctx["sandbox"]["business"]["region"] = ""
        missing = validate_context(ctx)
        self.assertIn("sandbox.business.region", missing)

    def test_missing_service_list(self):
        ctx = _minimal_context()
        ctx["sandbox"]["business"]["service_list"] = []
        missing = validate_context(ctx)
        self.assertIn("sandbox.business.service_list", missing)

    def test_invalid_calculator_link_format(self):
        ctx = _minimal_context()
        ctx["sandbox"]["business"]["calculator_link"] = "https://example.com/not-aws"
        missing = validate_context(ctx)
        self.assertIn("sandbox.business.calculator_link (invalid format)", missing)

    def test_architecture_service_mismatch(self):
        ctx = _minimal_context()
        ctx["sandbox"]["architecture"]["applied_services"] = ["Amazon S3"]
        missing = validate_context(ctx)
        self.assertIn(
            "sandbox.architecture.applied_services (mismatch vs sandbox.business.service_list)",
            missing,
        )

    def test_calculator_service_mismatch(self):
        ctx = _minimal_context()
        ctx["sandbox"]["business"]["applied_services"] = ["Amazon S3"]
        missing = validate_context(ctx)
        self.assertIn(
            "sandbox.business.applied_services (mismatch vs sandbox.business.service_list)",
            missing,
        )

    def test_missing_diagram_file(self):
        ctx = _minimal_context()
        ctx["sandbox"]["architecture"]["diagram"] = "does_not_exist.png"
        missing = validate_context(ctx)
        self.assertTrue(
            any(item.startswith("sandbox.architecture.diagram (file not found") for item in missing)
        )


# ══════════════════════════════════════════════════════════════════════════════
class TestMarkdown(unittest.TestCase):
    """Verify the Markdown detection and RichText conversion."""

    def test_is_markdown_detects_bold(self):
        self.assertTrue(_is_markdown("This has **bold** text here."))

    def test_is_markdown_detects_header(self):
        self.assertTrue(_is_markdown("## Section Title\nsome content"))

    def test_is_markdown_detects_list(self):
        self.assertTrue(_is_markdown("- Item one\n- Item two"))

    def test_is_markdown_detects_code(self):
        self.assertTrue(_is_markdown("Use `code_here` inline."))

    def test_is_markdown_ignores_plain_text(self):
        self.assertFalse(_is_markdown("Hello World"))

    def test_is_markdown_ignores_identifier(self):
        self.assertFalse(_is_markdown("table_name"))

    def test_is_markdown_ignores_short_text(self):
        self.assertFalse(_is_markdown("USD 50,000"))

    def test_richtext_bold(self):
        from docxtpl import RichText
        rt = markdown_to_richtext("**bold text** here")
        self.assertIsInstance(rt, RichText)

    def test_richtext_header(self):
        from docxtpl import RichText
        rt = markdown_to_richtext("## Section\nBody text")
        self.assertIsInstance(rt, RichText)

    def test_richtext_list(self):
        from docxtpl import RichText
        rt = markdown_to_richtext("- Item one\n- Item two")
        self.assertIsInstance(rt, RichText)

    def test_richtext_empty(self):
        from docxtpl import RichText
        rt = markdown_to_richtext("")
        self.assertIsInstance(rt, RichText)

    def test_auto_convert_dict(self):
        data = {
            "title": "Simple title",
            "body": "- Item one\n- **Item two**",
        }
        converted = auto_convert_markdown(data)
        from docxtpl import RichText
        self.assertIsInstance(converted["body"], RichText, "Markdown field not converted")
        self.assertEqual(converted["title"], "Simple title", "Plain field modified")

    def test_auto_convert_nested(self):
        data = {"outer": {"inner": "## Header\n- list item"}}
        converted = auto_convert_markdown(data)
        from docxtpl import RichText
        self.assertIsInstance(converted["outer"]["inner"], RichText)


# ══════════════════════════════════════════════════════════════════════════════
class TestRenderContext(unittest.TestCase):
    """Verify build_render_context reshapes JSON correctly."""

    def test_labor_cost_preserved(self):
        """build_render_context should preserve labor_cost as-is."""
        ctx = _minimal_context()
        render = build_render_context(ctx, None)
        biz = render["sandbox"]["business"]
        self.assertIn("labor_cost", biz)
        self.assertEqual(biz["labor_cost"], "USD 30,000")

    def test_proposal_title_present(self):
        ctx = _minimal_context()
        render = build_render_context(ctx, None)
        self.assertEqual(
            render["sandbox"]["proposal"]["title"],
            "Test Sandbox Proposal"
        )

    def test_contact_enriched(self):
        ctx = _minimal_context()
        render = build_render_context(ctx, None)
        contact = render["sandbox"]["basics"]["contact"]
        self.assertIn("pdm", contact)
        self.assertIn("pm", contact)

    def test_calculator_link_preserved(self):
        ctx = _minimal_context()
        render = build_render_context(ctx, None)
        self.assertEqual(
            render["sandbox"]["business"]["calculator_link"],
            "https://calculator.aws/#/estimate?id=test123"
        )

    def test_phases_carried_through(self):
        ctx = _minimal_context()
        render = build_render_context(ctx, None)
        phases = render["sandbox"]["plan"]["total_phases"]
        self.assertEqual(len(phases), 2)
        self.assertEqual(phases[0]["activity"], "Phase 1 Planning")


# ══════════════════════════════════════════════════════════════════════════════
class TestDocxGeneration(unittest.TestCase):
    """Integration tests: generate a real DOCX and inspect it."""

    @classmethod
    def setUpClass(cls):
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        cls.ctx = _minimal_context()
        cls.output = OUTPUT_DIR / "test_proposal.docx"
        generate_proposal(cls.ctx, cls.output, template_path=TEMPLATE_PATH)

    def test_file_created(self):
        self.assertTrue(self.output.exists(), "Output DOCX not created")

    def test_file_is_valid_docx(self):
        """The output must be a valid ZIP (OOXML) file."""
        self.assertTrue(zipfile.is_zipfile(self.output), "Output is not a valid DOCX")

    def test_reasonable_file_size(self):
        size = self.output.stat().st_size
        self.assertGreater(size, 10_000, "Output DOCX suspiciously small")

    def _get_xml(self) -> str:
        with zipfile.ZipFile(self.output) as z:
            return z.read("word/document.xml").decode("utf-8")

    def test_title_rendered(self):
        xml = self._get_xml()
        self.assertIn("Test Sandbox Proposal", xml)

    def test_partner_rendered(self):
        xml = self._get_xml()
        self.assertIn("TestPartner", xml)

    def test_aws_funding_rendered(self):
        xml = self._get_xml()
        self.assertIn("USD 50,000", xml)

    def test_labor_cost_rendered(self):
        xml = self._get_xml()
        self.assertIn("USD 30,000", xml)

    def test_total_cost_rendered(self):
        xml = self._get_xml()
        self.assertIn("USD 80,000", xml)

    def test_calculator_link_rendered(self):
        xml = self._get_xml()
        self.assertIn("test123", xml, "calculator_link value not rendered")

    def test_start_date_rendered(self):
        xml = self._get_xml()
        self.assertIn("2026-04-01", xml)

    def test_plan_phases_rendered(self):
        xml = self._get_xml()
        self.assertIn("Phase 1 Planning", xml)
        self.assertIn("Phase 2 Build", xml)

    def test_solution_type_rendered(self):
        xml = self._get_xml()
        self.assertIn("Horizontal", xml)

    def test_no_unreplaced_placeholders(self):
        """No Jinja2 {{ }} tokens should remain after rendering."""
        xml = self._get_xml()
        import re
        remaining = re.findall(r'\{\{[^}]+\}\}', xml)
        self.assertEqual(remaining, [],
                         f"Unreplaced Jinja2 placeholders in output: {remaining}")

    def test_no_jinja_loop_markers(self):
        """No {%tr %} loop markers should remain after rendering."""
        xml = self._get_xml()
        self.assertNotIn("{%tr", xml, "Unreplaced Jinja2 loop markers remain")


# ══════════════════════════════════════════════════════════════════════════════
class TestDocxWithDiagram(unittest.TestCase):
    """Test diagram embedding when a PNG is available."""

    @classmethod
    def setUpClass(cls):
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        # Use the test diagram if it exists, otherwise skip
        cls.diagram = SCRIPT_DIR.parent / "test" / "doc_intelligence_architecture.png"
        if not cls.diagram.exists():
            cls.diagram = None

        ctx = _minimal_context()
        if cls.diagram:
            ctx["sandbox"]["architecture"]["diagram"] = str(cls.diagram)
        cls.output = OUTPUT_DIR / "test_proposal_with_diagram.docx"
        generate_proposal(ctx, cls.output, template_path=TEMPLATE_PATH)

    def test_file_created(self):
        self.assertTrue(self.output.exists())

    def test_image_embedded_when_diagram_provided(self):
        if not self.diagram:
            self.skipTest("No test diagram available")
        with zipfile.ZipFile(self.output) as z:
            media = [n for n in z.namelist() if n.startswith("word/media/")]
        self.assertTrue(len(media) >= 1, "No image embedded in DOCX")


# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    # Ensure test output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Run with verbosity
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(sys.modules[__name__])
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
