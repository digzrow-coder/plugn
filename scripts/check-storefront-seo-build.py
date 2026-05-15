from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD_JS = ROOT / "store" / "main" / "build.js"


def require(source: str, needle: str, description: str) -> None:
    """Require a static build-script fragment that protects storefront output."""
    if needle not in source:
        raise SystemExit(f"Missing {description}: {needle}")


def main() -> None:
    """Validate generated storefront SEO, robots, and escaping safeguards."""
    source = BUILD_JS.read_text(encoding="utf-8")

    require(source, "function escapeHtml(value)", "HTML escaping helper")
    require(source, "function normalizePublicUrl(value)", "public URL normalizer")
    require(source, "process.env.PLUGN_STORE_API_ENDPOINT", "runtime API endpoint override")
    require(source, "process.env.PLUGN_STORE_BRANCH", "runtime store branch override")
    require(source, "function validateStoreBranchName(value)", "store branch validator")
    require(source, "/^[A-Za-z0-9._-]+$/.test(branchName)", "store branch allowlist")
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
    require(source, "var facebookPixilIdLiteral = JSON.stringify(String(facebookPixilId))", "Facebook pixel JS string escaping")
    require(source, "encodeURIComponent(String(facebookPixilId))", "Facebook pixel noscript URL escaping")
    require(source, "function sanitizeCustomCss(value)", "custom CSS sanitizer")
    require(source, "Unsafe custom CSS rejected", "custom CSS rejection")
    require(source, "JSON.stringify(apiEndPoint)", "environment API endpoint escaping")
    require(source, "JSON.stringify(storeUuid || '')", "environment store UUID escaping")
    require(source, "if (!res || res.statusCode >= 400)", "download HTTP status handling")
    require(source, ".on('error', done)", "download stream error handling")

    unsafe_patterns = [
        "<title>` + storeName + `</title>",
        "content='` + storeContent + ` '",
        "content='` + storeDomain + ` '",
        "var apiEndPoint = 'http://localhost",
        "var storebranchName = 'main';",
        "fbq('init', '` + facebookPixilId + `');",
        "src='https://www.facebook.com/tr?id= .  facebookPixilId . &ev=PageView&noscript=1'",
        "fs.appendFileSync('src/global.scss', storeCustomCss)",
        "apiEndpoint : '` + apiEndPoint + `'",
        "restaurantUuid : '` + storeUuid + `'",
    ]
    for pattern in unsafe_patterns:
        if pattern in source:
            raise SystemExit(f"Unsafe raw metadata interpolation remains: {pattern}")

    print("Storefront SEO build check passed.")


if __name__ == "__main__":
    main()
