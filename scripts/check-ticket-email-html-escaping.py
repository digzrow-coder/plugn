import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "common/mail/agent/ticket-generated-html.php": [
        r"Html::encode\s*\(\s*\$model->restaurant->name\s*\)",
        r"nl2br\s*\(\s*Html::encode\s*\(\s*\$model->ticket_detail\s*\)\s*\)",
    ],
    "common/mail/agent/ticket-commented-html.php": [
        r"nl2br\s*\(\s*Html::encode\s*\(\s*\$model->ticket_comment_detail\s*\)\s*\)",
    ],
    "common/mail/agent/ticket-assigned-html.php": [
        r"Html::encode\s*\(\s*\$model->restaurant->name\s*\)",
        r"nl2br\s*\(\s*Html::encode\s*\(\s*\$model->ticket_detail\s*\)\s*\)",
    ],
}

FORBIDDEN = {
    "common/mail/agent/ticket-generated-html.php": [
        r"<\?=\s*\$model->restaurant->name\s*\?>",
        r"<\?=\s*\$model->ticket_detail\s*\?>",
    ],
    "common/mail/agent/ticket-commented-html.php": [
        r"<\?=\s*\$model->ticket_comment_detail\s*\?>",
    ],
    "common/mail/agent/ticket-assigned-html.php": [
        r"<\?=\s*\$model->restaurant->name\s*\?>",
        r"<\?=\s*\$model->ticket_detail\s*\?>",
    ],
}


def main() -> int:
    """Verify support-ticket HTML emails escape stored values before rendering."""
    failures = []
    for relative_path, required_fragments in REQUIRED.items():
        path = ROOT / relative_path
        try:
            text = path.read_text(encoding="utf-8")
        except (FileNotFoundError, PermissionError, OSError) as err:
            failures.append(f"{relative_path}: error reading file: {err}")
            continue

        for pattern in required_fragments:
            if not re.search(pattern, text):
                failures.append(f"{relative_path}: missing required pattern {pattern!r}")
        for pattern in FORBIDDEN[relative_path]:
            if re.search(pattern, text):
                failures.append(f"{relative_path}: forbidden raw output pattern {pattern!r}")

    if failures:
        print("Ticket email HTML escaping check failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Ticket email HTML escaping check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
