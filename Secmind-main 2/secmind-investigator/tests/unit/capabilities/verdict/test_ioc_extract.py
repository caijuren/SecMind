"""Tests for F4 IocExtractCapability."""
from secmind_investigator.capabilities.verdict.ioc_extract import (
    IocExtractCapability,
)
from secmind_investigator.core.context import ExecutionContext


def _ctx() -> ExecutionContext:
    return ExecutionContext(datasources={})


async def test_extract_ip_from_nested_payload() -> None:
    """IP address found inside nested payload dict."""
    evidence = [
        {
            "payload": {
                "connection": {
                    "remote_ip": "192.168.1.100",
                }
            }
        }
    ]
    res = await IocExtractCapability().run({"evidence_set": evidence}, _ctx())
    assert res.partial is False
    iocs = res.payload["iocs"]
    ip_iocs = [i for i in iocs if i["type"] == "ip"]
    assert len(ip_iocs) == 1
    assert ip_iocs[0]["value"] == "192.168.1.100"
    assert ip_iocs[0]["confidence"] == 0.7
    assert ip_iocs[0]["ttl_hours"] == 72


async def test_extract_url_domain_hash_from_complex_payload() -> None:
    """Multiple IOC types extracted from one evidence item."""
    evidence = [
        {
            "payload": {
                "http_request": {
                    "url": "https://malicious.example.com/stage2",
                    "host": "malicious.example.com",
                },
                "file": {
                    "sha256": "a" * 64,
                },
            }
        }
    ]
    res = await IocExtractCapability().run({"evidence_set": evidence}, _ctx())
    assert res.partial is False
    iocs = res.payload["iocs"]

    types = {i["type"] for i in iocs}
    assert "url" in types
    assert "domain" in types
    assert "hash" in types

    url_ioc = next(i for i in iocs if i["type"] == "url")
    assert url_ioc["value"] == "https://malicious.example.com/stage2"

    domain_ioc = next(i for i in iocs if i["type"] == "domain")
    assert domain_ioc["value"] == "malicious.example.com"

    hash_ioc = next(i for i in iocs if i["type"] == "hash")
    assert hash_ioc["value"] == "a" * 64


async def test_deduplicate_iocs_across_evidence() -> None:
    """Same IOC in two evidence items appears only once."""
    evidence = [
        {"payload": {"ip": "10.0.0.1"}},
        {"payload": {"remote": "10.0.0.1"}},
    ]
    res = await IocExtractCapability().run({"evidence_set": evidence}, _ctx())
    ip_iocs = [i for i in res.payload["iocs"] if i["type"] == "ip"]
    assert len(ip_iocs) == 1


async def test_empty_evidence_set_returns_empty_iocs() -> None:
    """Empty input → empty iocs list, not partial."""
    res = await IocExtractCapability().run({"evidence_set": []}, _ctx())
    assert res.partial is False
    assert res.payload["iocs"] == []


async def test_ignore_non_ioc_strings() -> None:
    """Plain strings that don't match any IOC pattern are skipped."""
    evidence = [
        {
            "payload": {
                "message": "hello world",
                "status": "ok",
                "count": "42",
            }
        }
    ]
    res = await IocExtractCapability().run({"evidence_set": evidence}, _ctx())
    assert res.payload["iocs"] == []


async def test_namespace_correct() -> None:
    assert IocExtractCapability.namespace == "investigate.verdict.ioc_extract"


async def test_email_extracted() -> None:
    """Email address is classified as IOC type 'email'."""
    evidence = [{"payload": {"sender": "attacker@evil.com"}}]
    res = await IocExtractCapability().run({"evidence_set": evidence}, _ctx())
    email_iocs = [i for i in res.payload["iocs"] if i["type"] == "email"]
    assert len(email_iocs) == 1
    assert email_iocs[0]["value"] == "attacker@evil.com"


async def test_md5_and_sha1_hashes_extracted() -> None:
    """MD5 and SHA1 are both recognised as hash IOCs."""
    md5 = "d" * 32
    sha1 = "e" * 40
    evidence = [{"payload": {"md5": md5, "sha1": sha1}}]
    res = await IocExtractCapability().run({"evidence_set": evidence}, _ctx())
    hash_iocs = [i for i in res.payload["iocs"] if i["type"] == "hash"]
    values = {i["value"] for i in hash_iocs}
    assert md5 in values
    assert sha1 in values


async def test_iocs_in_list_values() -> None:
    """IOCs inside list values are also extracted."""
    evidence = [
        {
            "payload": {
                "links": [
                    "https://download.evil.org/file",
                    "http://c2.bad.net/beacon",
                ]
            }
        }
    ]
    res = await IocExtractCapability().run({"evidence_set": evidence}, _ctx())
    url_iocs = [i for i in res.payload["iocs"] if i["type"] == "url"]
    assert len(url_iocs) == 2
