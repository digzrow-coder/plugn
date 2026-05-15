#!/usr/bin/env python3
"""Static guard for admin create validation error handling."""

from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "backend" / "controllers" / "AdminController.php"


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    source = SOURCE.read_text(encoding="utf-8")
    action_match = re.search(
        r"public function actionCreate\(\) \{(?P<body>.*?)\n    \}",
        source,
        re.DOTALL,
    )

    if not action_match:
        fail("actionCreate body not found")

    body = action_match.group("body")
    forbidden = [
        r"print_r\s*\(\s*\$model->getErrors\(\)\s*\)",
        r"\bexit\s*;",
        r"\bdie\s*\(",
    ]

    for pattern in forbidden:
        if re.search(pattern, body):
            fail(f"raw admin create failure handler still present: {pattern}")

    required = [
        "Yii::warning",
        "$model->getErrors()",
        "Yii::$app->session->setFlash",
        "'error'",
        "return $this->render('create'",
    ]

    missing = [fragment for fragment in required if fragment not in body]
    if missing:
        fail("missing expected admin create failure handling: " + ", ".join(missing))

    print("AdminController create error handling checks passed")


if __name__ == "__main__":
    main()
