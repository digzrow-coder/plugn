from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD_JS = ROOT / "store" / "main" / "build.js"


def require(source: str, needle: str, description: str) -> None:
    if needle not in source:
        raise SystemExit(f"Missing {description}: {needle}")


def main() -> None:
    source = BUILD_JS.read_text(encoding="utf-8")

    require(source, "function escapeHtml(value)", "HTML escaping helper")
    require(source, "function normalizePublicUrl(value)", "public URL normalizer")
    require(source, "process.env.PLUGN_STORE_API_ENDPOINT", "runtime API endpoint override")
    require(source, "process.env.PLUGN_STORE_BRANCH", "runtime store branch override")
    require(source, "throw new Error('Unable to load store data", "store data fetch failure")
    require(source, "function overwriteRobotsTxt", "robots.txt generator")
    require(source, "overwriteRobotsTxt(response.restaurant_uuid", "robots generation call")
    require(source, "<link rel='canonical' href='` + safeStoreDomain + `'", "canonical link")
    require(source, "og:title", "OpenGraph title metadata")
    require(source, "twitter:image", "Twitter image metadata")
    require(source, "summary_large_image", "large social card metadata")
    require(source, "Sitemap: ' + sitemapUrl", "robots sitemap directive")
    require(source, '"src/robots.txt"', "Angular asset entry for robots.txt")
    require(source, "JSON.stringify({", "manifest JSON escaping")

    unsafe_patterns = [
        "<title>` + storeName + `</title>",
        "content='` + storeContent + ` '",
        "content='` + storeDomain + ` '",
        "var apiEndPoint = 'http://localhost",
        "var storebranchName = 'main';",
    ]
    for pattern in unsafe_patterns:
        if pattern in source:
            raise SystemExit(f"Unsafe raw metadata interpolation remains: {pattern}")

    print("Storefront SEO build check passed.")


if __name__ == "__main__":
    main()
