#!/usr/bin/env python3
"""Static regression checks for FileGeneratorComponent's generated build.js."""

from pathlib import Path
import re
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "common" / "components" / "FileGeneratorComponent.php"


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    source = SOURCE.read_text(encoding="utf-8")
    match = re.search(
        r"\$buildJsContent\s*=\s*<<<'JS'\n(?P<js>.*?)\nJS;",
        source,
        re.DOTALL,
    )
    if not match:
        fail("generated build.js nowdoc was not found")

    generated = match.group("js").replace(
        "__PLUGN_API_ENDPOINT__",
        '"https://api.example.test/v2"',
    )

    required_fragments = [
        "var apiEndPoint = normalizeApiEndpoint(",
        "validateStoreBranchName(process.env.PLUGN_STORE_BRANCH || process.env.BRANCH || 'main')",
        "function escapeHtml(value)",
        "function normalizePublicUrl(value)",
        "function themeColorOrDefault(value)",
        "function facebookPixelIdOrDefault(value)",
        "function sanitizeCustomCss(value)",
        "cloudinaryLogoUrl(storeUuid, storeLogo",
        "JSON.stringify(apiEndPoint)",
        "JSON.stringify(storeUuid || '')",
        "fs.writeFileSync('src/robots.txt', robotsFile)",
        "request(uri)",
        ".on('error', done)",
        "JSON.stringify({",
        "src/robots.txt",
    ]
    missing = [fragment for fragment in required_fragments if fragment not in generated]
    if missing:
        fail("missing required generated fragments: " + ", ".join(missing))

    forbidden_patterns = [
        r"console\.log\(store\)",
        r"var\s+storebranchName\s*=\s*process\.env\.BRANCH",
        r"fbq\('init',\s*`\s*\+\s*facebookPixilId\s*\+\s*`\)",
        r"apiEndpoint\s*:\s*'`\s*\+\s*apiEndPoint",
        r"restaurantUuid\s*:\s*'`\s*\+\s*storeUuid",
        r"fs\.appendFileSync\('src/global\.scss',\s*storeCustomCss\)",
        r"request\(uri\)\.pipe\(fs\.createWriteStream\(filename\)\)",
    ]
    for pattern in forbidden_patterns:
        if re.search(pattern, generated):
            fail(f"forbidden generated pattern still present: {pattern}")

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".js", delete=False) as handle:
        handle.write(generated)
        generated_path = Path(handle.name)

    try:
        result = subprocess.run(
            ["node", "--check", str(generated_path)],
            check=False,
            capture_output=True,
            text=True,
        )
    finally:
        generated_path.unlink(missing_ok=True)

    if result.returncode != 0:
        fail("generated build.js failed node --check:\n" + result.stderr.strip())

    print("FileGeneratorComponent generated build.js checks passed")


if __name__ == "__main__":
    main()
