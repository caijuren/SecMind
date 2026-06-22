"""Tests for DS-TI MockTiDataSource."""
from secmind_investigator.datasources.mocks import MockTiDataSource


def _make_ds() -> MockTiDataSource:
    return MockTiDataSource(
        ip_lookups={
            "1.2.3.4": {
                "verdict": "malicious",
                "score": 95,
                "tags": ["c2", "botnet"],
                "sources": [{"name": "AbuseIPDB"}],
            },
            "8.8.8.8": {
                "verdict": "clean",
                "score": 0,
                "tags": [],
                "sources": [{"name": "Google"}],
            },
        },
        domain_lookups={
            "evil.example.com": {
                "verdict": "suspicious",
                "score": 60,
                "tags": ["phishing"],
                "sources": [],
            },
        },
        url_lookups={
            "http://malware.example.com/payload.exe": {
                "verdict": "malicious",
                "score": 100,
                "tags": ["malware"],
                "sources": [],
            },
        },
        hash_lookups={
            "d41d8cd98f00b204e9800998ecf8427e": {
                "verdict": "clean",
                "score": 0,
                "tags": [],
                "sources": [],
            },
            "aabbccdd1122": {
                "verdict": "malicious",
                "score": 98,
                "tags": ["ransomware"],
                "sources": [{"name": "VirusTotal"}],
            },
        },
    )


async def test_lookup_ip_hit() -> None:
    ds = _make_ds()
    result = await ds.lookup_ip("1.2.3.4")
    assert result is not None
    assert result["verdict"] == "malicious"
    assert result["score"] == 95
    assert "c2" in result["tags"]


async def test_lookup_ip_miss() -> None:
    ds = _make_ds()
    result = await ds.lookup_ip("10.0.0.1")
    assert result is None


async def test_lookup_ip_clean() -> None:
    ds = _make_ds()
    result = await ds.lookup_ip("8.8.8.8")
    assert result is not None
    assert result["verdict"] == "clean"
    assert result["score"] == 0


async def test_lookup_domain_hit() -> None:
    ds = _make_ds()
    result = await ds.lookup_domain("evil.example.com")
    assert result is not None
    assert result["verdict"] == "suspicious"
    assert "phishing" in result["tags"]


async def test_lookup_domain_miss() -> None:
    ds = _make_ds()
    result = await ds.lookup_domain("safe.example.com")
    assert result is None


async def test_lookup_url_hit() -> None:
    ds = _make_ds()
    result = await ds.lookup_url("http://malware.example.com/payload.exe")
    assert result is not None
    assert result["verdict"] == "malicious"
    assert "malware" in result["tags"]


async def test_lookup_url_miss() -> None:
    ds = _make_ds()
    result = await ds.lookup_url("https://safe.example.com/")
    assert result is None


async def test_lookup_hash_hit() -> None:
    ds = _make_ds()
    result = await ds.lookup_hash("aabbccdd1122")
    assert result is not None
    assert result["verdict"] == "malicious"
    assert "ransomware" in result["tags"]


async def test_lookup_hash_miss() -> None:
    ds = _make_ds()
    result = await ds.lookup_hash("unknown_hash_000")
    assert result is None


async def test_healthcheck() -> None:
    ds = MockTiDataSource()
    assert await ds.healthcheck() is True
    await ds.close()
