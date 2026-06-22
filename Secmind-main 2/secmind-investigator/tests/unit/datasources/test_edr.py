"""Tests for DS-EDR MockEdrDataSource."""
from datetime import UTC, datetime, timedelta

from secmind_investigator.datasources.mocks import MockEdrDataSource

NOW = datetime(2026, 5, 24, 10, 0, tzinfo=UTC)


async def test_get_host_present() -> None:
    ds = MockEdrDataSource(
        hosts={"host-1": {"hostname": "workstation-01", "os": "Windows 11", "ip": "10.0.0.1"}}
    )
    host = await ds.get_host("host-1")
    assert host is not None
    assert host["hostname"] == "workstation-01"


async def test_get_host_missing_returns_none() -> None:
    ds = MockEdrDataSource()
    assert await ds.get_host("nonexistent") is None


async def test_list_processes_window_filter() -> None:
    ds = MockEdrDataSource(
        processes={
            "host-1": [
                {"ts": NOW - timedelta(hours=1), "name": "cmd.exe", "pid": 1234},
                {"ts": NOW - timedelta(days=3), "name": "powershell.exe", "pid": 5678},
                {"ts": NOW, "name": "notepad.exe", "pid": 9012},
            ]
        }
    )
    results = await ds.list_processes("host-1", since=NOW - timedelta(hours=2), until=NOW)
    assert len(results) == 2
    names = {r["name"] for r in results}
    assert names == {"cmd.exe", "notepad.exe"}


async def test_list_processes_empty_for_unknown_host() -> None:
    ds = MockEdrDataSource()
    results = await ds.list_processes("unknown-host", since=NOW - timedelta(hours=1), until=NOW)
    assert results == []


async def test_get_process_tree_present() -> None:
    tree = {"guid": "abc-123", "name": "cmd.exe", "children": [{"name": "whoami.exe"}]}
    ds = MockEdrDataSource(process_trees={"abc-123": tree})
    result = await ds.get_process_tree("abc-123")
    assert result is not None
    assert result["guid"] == "abc-123"
    assert len(result["children"]) == 1


async def test_get_process_tree_missing_returns_none() -> None:
    ds = MockEdrDataSource()
    assert await ds.get_process_tree("no-such-guid") is None


async def test_list_network_conns_window_filter() -> None:
    ds = MockEdrDataSource(
        net_conns={
            "host-1": [
                {"ts": NOW - timedelta(minutes=30), "dst_ip": "1.2.3.4", "dst_port": 443},
                {"ts": NOW - timedelta(days=2), "dst_ip": "5.6.7.8", "dst_port": 80},
            ]
        }
    )
    results = await ds.list_network_conns("host-1", since=NOW - timedelta(hours=1), until=NOW)
    assert len(results) == 1
    assert results[0]["dst_ip"] == "1.2.3.4"


async def test_list_file_ops_window_filter() -> None:
    ds = MockEdrDataSource(
        file_ops={
            "host-1": [
                {"ts": NOW - timedelta(minutes=10), "path": "C:\\temp\\evil.exe", "op": "create"},
                {"ts": NOW - timedelta(hours=5), "path": "C:\\windows\\legit.dll", "op": "read"},
            ]
        }
    )
    results = await ds.list_file_ops("host-1", since=NOW - timedelta(hours=1), until=NOW)
    assert len(results) == 1
    assert results[0]["path"] == "C:\\temp\\evil.exe"


async def test_search_hash_hit() -> None:
    sha256 = "deadbeef" * 8
    ds = MockEdrDataSource(
        hash_index={
            sha256: [
                {"host": "host-1", "path": "C:\\temp\\evil.exe"},
                {"host": "host-2", "path": "D:\\drop\\evil.exe"},
            ]
        }
    )
    results = await ds.search_hash(sha256)
    assert len(results) == 2
    hosts = {r["host"] for r in results}
    assert hosts == {"host-1", "host-2"}


async def test_search_hash_miss_returns_empty() -> None:
    ds = MockEdrDataSource()
    assert await ds.search_hash("unknownhash") == []


async def test_healthcheck() -> None:
    ds = MockEdrDataSource()
    assert await ds.healthcheck() is True
    await ds.close()
