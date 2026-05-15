from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "common/mail/agent/ticket-generated-html.php": [
        "Html::encode($model->restaurant->name)",
        "nl2br(Html::encode($model->ticket_detail))",
    ],
    "common/mail/agent/ticket-commented-html.php": [
        "nl2br(Html::encode($model->ticket_comment_detail))",
    ],
    "common/mail/agent/ticket-assigned-html.php": [
        "Html::encode($model->restaurant->name)",
        "nl2br(Html::encode($model->ticket_detail))",
    ],
}

FORBIDDEN = {
    "common/mail/agent/ticket-generated-html.php": [
        "<?= $model->restaurant->name ?>",
        "<?= $model->ticket_detail ?>",
    ],
    "common/mail/agent/ticket-commented-html.php": [
        "<?= $model->ticket_comment_detail ?>",
    ],
    "common/mail/agent/ticket-assigned-html.php": [
        "<?= $model->restaurant->name ?>",
        "<?= $model->ticket_detail ?>",
    ],
}


def main() -> int:
    failures = []
    for relative_path, required_fragments in REQUIRED.items():
        path = ROOT / relative_path
        text = path.read_text(encoding="utf-8")
        for fragment in required_fragments:
            if fragment not in text:
                failures.append(f"{relative_path}: missing {fragment!r}")
        for fragment in FORBIDDEN[relative_path]:
            if fragment in text:
                failures.append(f"{relative_path}: forbidden raw output {fragment!r}")

    if failures:
        print("Ticket email HTML escaping check failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Ticket email HTML escaping check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
