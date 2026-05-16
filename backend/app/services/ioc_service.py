import re
import time
import json
import asyncio
import hashlib
import logging
from typing import Optional
from datetime import datetime, timezone

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    aioredis = None
    logger.info("redis not installed, using in-memory cache only")

_IP_V4_RE = re.compile(r"^(?:\d{1,3}\.){3}\d{1,3}$")
_MD5_RE = re.compile(r"^[a-fA-F0-9]{32}$")
_SHA1_RE = re.compile(r"^[a-fA-F0-9]{40}$")
_SHA256_RE = re.compile(r"^[a-fA-F0-9]{64}$")
_DOMAIN_RE = re.compile(
    r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$"
)
_URL_RE = re.compile(r"^https?://", re.IGNORECASE)

_NO_API_KEY_MSG = "未配置情报源 API Key，无法查询。请在环境变量中设置 VIRUSTOTAL_API_KEY 或 ABUSEIPDB_API_KEY。"


def _classify_ioc(value: str) -> str:
    if _URL_RE.match(value):
        return "url"
    if _IP_V4_RE.match(value):
        return "ip"
    if _SHA256_RE.match(value):
        return "sha256"
    if _SHA1_RE.match(value):
        return "sha1"
    if _MD5_RE.match(value):
        return "md5"
    if _DOMAIN_RE.match(value):
        return "domain"
    return "unknown"


def _risk_from_score(score: int) -> str:
    if score >= 80:
        return "high"
    if score >= 50:
        return "medium"
    if score >= 20:
        return "low"
    return "info"


class _CacheEntry:
    __slots__ = ("data", "expires_at")

    def __init__(self, data: dict, ttl: int):
        self.data = data
        self.expires_at = time.time() + ttl

    def is_valid(self) -> bool:
        return time.time() < self.expires_at


class IOCService:

    REDIS_TTL = 3600
    RATE_LIMIT_MAX = 4
    RATE_LIMIT_WINDOW = 60

    def __init__(self):
        self._vt_key: str = settings.VIRUSTOTAL_API_KEY
        self._abuse_key: str = settings.ABUSEIPDB_API_KEY
        self._tf_url: str = settings.THREATFOX_API_URL
        self._ttl: int = settings.IOC_CACHE_TTL
        self._cache: dict[str, _CacheEntry] = {}
        self._stats = {
            "total_queries": 0,
            "cache_hits": 0,
            "api_calls": 0,
            "errors": 0,
            "rate_limited": 0,
        }
        self._rate_limits: dict[str, list[float]] = {}
        self._redis: Optional[aioredis.Redis] = None

        if REDIS_AVAILABLE and settings.REDIS_URL:
            try:
                self._redis = aioredis.from_url(
                    settings.REDIS_URL, decode_responses=True
                )
                logger.info("Redis cache enabled: %s", settings.REDIS_URL)
            except Exception as exc:
                logger.warning(
                    "Failed to connect to Redis: %s, falling back to in-memory cache",
                    exc,
                )

    @property
    def is_available(self) -> bool:
        return bool(self._vt_key or self._abuse_key)

    @staticmethod
    def _build_cache_key(ioc_type: str, ioc_value: str) -> str:
        return f"ioc:{ioc_type}:{ioc_value}"

    async def _cache_get(self, key: str) -> Optional[dict]:
        if self._redis:
            try:
                data = await self._redis.get(key)
                if data:
                    self._stats["cache_hits"] += 1
                    return json.loads(data)
            except Exception as exc:
                logger.warning("Redis get failed for %s: %s", key, exc)

        entry = self._cache.get(key)
        if entry and entry.is_valid():
            self._stats["cache_hits"] += 1
            return entry.data
        if entry:
            del self._cache[key]
        return None

    async def _cache_set(self, key: str, data: dict) -> None:
        if self._redis:
            try:
                await self._redis.setex(
                    key, self.REDIS_TTL, json.dumps(data, default=str)
                )
                return
            except Exception as exc:
                logger.warning("Redis set failed for %s: %s", key, exc)

        self._cache[key] = _CacheEntry(data, self._ttl)

    async def _check_rate_limit(self, source: str) -> bool:
        now = time.time()
        window_start = now - self.RATE_LIMIT_WINDOW

        if self._redis:
            try:
                key = f"rate_limit:{source}"
                await self._redis.zremrangebyscore(key, 0, window_start)
                count = await self._redis.zcard(key)
                if count >= self.RATE_LIMIT_MAX:
                    self._stats["rate_limited"] += 1
                    return True
                await self._redis.zadd(key, {str(now): now})
                await self._redis.expire(key, self.RATE_LIMIT_WINDOW + 10)
                return False
            except Exception as exc:
                logger.warning("Redis rate limit check failed: %s", exc)

        timestamps = self._rate_limits.get(source, [])
        timestamps = [t for t in timestamps if t > window_start]
        if len(timestamps) >= self.RATE_LIMIT_MAX:
            self._rate_limits[source] = timestamps
            self._stats["rate_limited"] += 1
            return True
        timestamps.append(now)
        self._rate_limits[source] = timestamps
        return False

    async def _fetch_abuseipdb(self, ip: str) -> Optional[dict]:
        if not self._abuse_key:
            return None
        if await self._check_rate_limit("abuseipdb"):
            logger.warning("AbuseIPDB rate limited, skipping query for %s", ip)
            return None
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.abuseipdb.com/api/v2/check",
                    params={"ipAddress": ip, "maxAgeInDays": 90, "verbose": "true"},
                    headers={"Key": self._abuse_key, "Accept": "application/json"},
                )
                resp.raise_for_status()
                body = resp.json().get("data", {})
                self._stats["api_calls"] += 1
                return {
                    "confidence": body.get("abuseConfidenceScore", 0),
                    "reports": body.get("totalReports", 0),
                    "country": body.get("countryCode", ""),
                    "isp": body.get("isp", ""),
                    "usage_type": body.get("usageType", ""),
                    "hostnames": body.get("hostnames", []),
                    "last_reported": body.get("lastReportedAt", ""),
                }
        except Exception as exc:
            logger.warning("AbuseIPDB query failed for %s: %s", ip, exc)
            self._stats["errors"] += 1
            return None

    async def _fetch_virustotal_ip(self, ip: str) -> Optional[dict]:
        if not self._vt_key:
            return None
        if await self._check_rate_limit("virustotal"):
            logger.warning("VirusTotal rate limited, skipping IP query for %s", ip)
            return None
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://www.virustotal.com/api/v3/ip_addresses/{ip}",
                    headers={"x-apikey": self._vt_key},
                )
                resp.raise_for_status()
                attrs = resp.json().get("data", {}).get("attributes", {})
                self._stats["api_calls"] += 1
                last_analysis = attrs.get("last_analysis_stats", {})
                return {
                    "malicious": last_analysis.get("malicious", 0),
                    "suspicious": last_analysis.get("suspicious", 0),
                    "undetected": last_analysis.get("undetected", 0),
                    "harmless": last_analysis.get("harmless", 0),
                    "total": sum(last_analysis.values()),
                    "community_score": attrs.get("reputation", 0),
                    "continent": attrs.get("continent", ""),
                    "country": attrs.get("country", ""),
                    "as_owner": attrs.get("as_owner", ""),
                    "tags": attrs.get("tags", []),
                }
        except Exception as exc:
            logger.warning("VirusTotal IP query failed for %s: %s", ip, exc)
            self._stats["errors"] += 1
            return None

    async def _fetch_virustotal_domain(self, domain: str) -> Optional[dict]:
        if not self._vt_key:
            return None
        if await self._check_rate_limit("virustotal"):
            logger.warning(
                "VirusTotal rate limited, skipping domain query for %s", domain
            )
            return None
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://www.virustotal.com/api/v3/domains/{domain}",
                    headers={"x-apikey": self._vt_key},
                )
                resp.raise_for_status()
                attrs = resp.json().get("data", {}).get("attributes", {})
                self._stats["api_calls"] += 1
                last_analysis = attrs.get("last_analysis_stats", {})
                return {
                    "malicious": last_analysis.get("malicious", 0),
                    "suspicious": last_analysis.get("suspicious", 0),
                    "undetected": last_analysis.get("undetected", 0),
                    "harmless": last_analysis.get("harmless", 0),
                    "total": sum(last_analysis.values()),
                    "community_score": attrs.get("reputation", 0),
                    "tags": attrs.get("tags", []),
                    "creation_date": attrs.get("creation_date", ""),
                    "whois": attrs.get("whois", ""),
                }
        except Exception as exc:
            logger.warning("VirusTotal domain query failed for %s: %s", domain, exc)
            self._stats["errors"] += 1
            return None

    async def _fetch_virustotal_file(self, file_hash: str) -> Optional[dict]:
        if not self._vt_key:
            return None
        if await self._check_rate_limit("virustotal"):
            logger.warning(
                "VirusTotal rate limited, skipping file query for %s", file_hash
            )
            return None
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://www.virustotal.com/api/v3/files/{file_hash}",
                    headers={"x-apikey": self._vt_key},
                )
                resp.raise_for_status()
                attrs = resp.json().get("data", {}).get("attributes", {})
                self._stats["api_calls"] += 1
                last_analysis = attrs.get("last_analysis_stats", {})
                return {
                    "malicious": last_analysis.get("malicious", 0),
                    "suspicious": last_analysis.get("suspicious", 0),
                    "undetected": last_analysis.get("undetected", 0),
                    "harmless": last_analysis.get("harmless", 0),
                    "total": sum(last_analysis.values()),
                    "community_score": attrs.get("reputation", 0),
                    "tags": attrs.get("tags", []),
                    "meaningful_name": attrs.get("meaningful_name", ""),
                    "type_description": attrs.get("type_description", ""),
                    "size": attrs.get("size", 0),
                }
        except Exception as exc:
            logger.warning("VirusTotal file query failed for %s: %s", file_hash, exc)
            self._stats["errors"] += 1
            return None

    async def _fetch_virustotal_url(self, url: str) -> Optional[dict]:
        if not self._vt_key:
            return None
        if await self._check_rate_limit("virustotal"):
            logger.warning("VirusTotal rate limited, skipping URL query for %s", url)
            return None
        try:
            url_id = hashlib.sha256(url.encode()).hexdigest()
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://www.virustotal.com/api/v3/urls/{url_id}",
                    headers={"x-apikey": self._vt_key},
                )
                resp.raise_for_status()
                attrs = resp.json().get("data", {}).get("attributes", {})
                self._stats["api_calls"] += 1
                last_analysis = attrs.get("last_analysis_stats", {})
                return {
                    "malicious": last_analysis.get("malicious", 0),
                    "suspicious": last_analysis.get("suspicious", 0),
                    "undetected": last_analysis.get("undetected", 0),
                    "harmless": last_analysis.get("harmless", 0),
                    "total": sum(last_analysis.values()),
                    "community_score": attrs.get("reputation", 0),
                    "tags": attrs.get("tags", []),
                    "title": attrs.get("title", ""),
                    "last_http_status": attrs.get("last_http_response_code", 0),
                }
        except Exception as exc:
            logger.warning("VirusTotal URL query failed for %s: %s", url, exc)
            self._stats["errors"] += 1
            return None

    async def _fetch_threatfox(self, ioc_value: str, ioc_type: str) -> Optional[dict]:
        if await self._check_rate_limit("threatfox"):
            logger.warning(
                "ThreatFox rate limited, skipping query for %s", ioc_value
            )
            return None
        try:
            search_term = ioc_value
            if ioc_type == "ip":
                search_term = ioc_value
            elif ioc_type in ("md5", "sha1", "sha256"):
                search_term = ioc_value
            elif ioc_type == "domain":
                search_term = ioc_value
            else:
                return None
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    self._tf_url,
                    json={
                        "query": "search_ioc",
                        "search_term": search_term,
                    },
                )
                resp.raise_for_status()
                body = resp.json()
                self._stats["api_calls"] += 1
                data_list = body.get("data", [])
                if not data_list:
                    return None
                first = data_list[0]
                return {
                    "malware": first.get("malware_printable", ""),
                    "malware_family": first.get("malware_malbazaar", ""),
                    "confidence": first.get("confidence_level", 0),
                    "threat_type": first.get("threat_type", ""),
                    "first_seen": first.get("first_seen_utc", ""),
                    "last_seen": first.get("last_seen_utc", ""),
                    "reporter": first.get("reporter", ""),
                    "tags": first.get("tags", []),
                }
        except Exception as exc:
            logger.warning("ThreatFox query failed for %s: %s", ioc_value, exc)
            self._stats["errors"] += 1
            return None

    def _fallback_result(self, ioc_value: str, ioc_type: str) -> dict:
        return {
            "ioc_value": ioc_value,
            "ioc_type": ioc_type,
            "risk_level": "info",
            "risk_score": 0,
            "sources": {},
            "tags": [],
            "description": _NO_API_KEY_MSG,
            "first_seen": None,
            "last_seen": None,
            "cached": False,
            "queried_at": datetime.now(timezone.utc).isoformat(),
        }

    def _no_result(self, ioc_value: str, ioc_type: str) -> dict:
        return {
            "ioc_value": ioc_value,
            "ioc_type": ioc_type,
            "risk_level": "info",
            "risk_score": 0,
            "sources": {},
            "tags": [],
            "description": f"未在已配置的情报源中找到 '{ioc_value}' 的威胁情报记录",
            "first_seen": None,
            "last_seen": None,
            "cached": False,
            "queried_at": datetime.now(timezone.utc).isoformat(),
        }

    def _merge_risk_score(self, sources: dict) -> int:
        scores = []
        if "abuseipdb" in sources:
            scores.append(sources["abuseipdb"].get("confidence", 0))
        if "virustotal" in sources:
            vt = sources["virustotal"]
            total = vt.get("total", 1) or 1
            malicious = vt.get("malicious", 0)
            ratio = malicious / total * 100
            community = abs(vt.get("community_score", 0))
            scores.append((ratio + community) / 2)
        if "threatfox" in sources:
            tf_conf = sources["threatfox"].get("confidence", 0)
            if isinstance(tf_conf, str):
                try:
                    tf_conf = int(tf_conf)
                except ValueError:
                    tf_conf = 50
            scores.append(tf_conf)
        if not scores:
            return 0
        return min(int(sum(scores) / len(scores)), 100)

    def _merge_tags(self, sources: dict) -> list[str]:
        tags: list[str] = []
        for src_data in sources.values():
            extra = src_data.get("tags", [])
            if isinstance(extra, list):
                for t in extra:
                    if t and t not in tags:
                        tags.append(t)
        return tags

    async def lookup_ip(self, ip: str) -> dict:
        self._stats["total_queries"] += 1
        cache_key = self._build_cache_key("ip", ip)
        cached = await self._cache_get(cache_key)
        if cached:
            cached["cached"] = True
            return cached

        if not self.is_available:
            result = self._fallback_result(ip, "ip")
            await self._cache_set(cache_key, result)
            return result

        sources: dict = {}
        abuse_task = self._fetch_abuseipdb(ip)
        vt_task = self._fetch_virustotal_ip(ip)
        tf_task = self._fetch_threatfox(ip, "ip")

        abuse_result, vt_result, tf_result = await asyncio.gather(
            abuse_task, vt_task, tf_task, return_exceptions=True
        )

        if isinstance(abuse_result, dict):
            sources["abuseipdb"] = abuse_result
        if isinstance(vt_result, dict):
            sources["virustotal"] = vt_result
        if isinstance(tf_result, dict):
            sources["threatfox"] = tf_result

        if not sources:
            result = self._no_result(ip, "ip")
            await self._cache_set(cache_key, result)
            return result

        risk_score = self._merge_risk_score(sources)
        tags = self._merge_tags(sources)
        first_seen = None
        last_seen = None
        for src_data in sources.values():
            fs = src_data.get("first_seen") or src_data.get("last_reported")
            ls = src_data.get("last_seen") or src_data.get("last_reported")
            if fs and (first_seen is None or fs < first_seen):
                first_seen = fs
            if ls and (last_seen is None or ls > last_seen):
                last_seen = ls

        result = {
            "ioc_value": ip,
            "ioc_type": "ip",
            "risk_level": _risk_from_score(risk_score),
            "risk_score": risk_score,
            "sources": sources,
            "tags": tags,
            "description": f"该IP被{len(sources)}个情报源查询，风险评分{risk_score}",
            "first_seen": first_seen,
            "last_seen": last_seen,
            "cached": False,
            "queried_at": datetime.now(timezone.utc).isoformat(),
        }
        await self._cache_set(cache_key, result)
        return result

    async def lookup_domain(self, domain: str) -> dict:
        self._stats["total_queries"] += 1
        cache_key = self._build_cache_key("domain", domain)
        cached = await self._cache_get(cache_key)
        if cached:
            cached["cached"] = True
            return cached

        if not self.is_available:
            result = self._fallback_result(domain, "domain")
            await self._cache_set(cache_key, result)
            return result

        sources: dict = {}
        vt_task = self._fetch_virustotal_domain(domain)
        tf_task = self._fetch_threatfox(domain, "domain")
        vt_result, tf_result = await asyncio.gather(vt_task, tf_task, return_exceptions=True)

        if isinstance(vt_result, dict):
            sources["virustotal"] = vt_result
        if isinstance(tf_result, dict):
            sources["threatfox"] = tf_result

        if not sources:
            result = self._no_result(domain, "domain")
            await self._cache_set(cache_key, result)
            return result

        risk_score = self._merge_risk_score(sources)
        tags = self._merge_tags(sources)
        first_seen = None
        last_seen = None
        for src_data in sources.values():
            fs = src_data.get("first_seen") or src_data.get("creation_date")
            ls = src_data.get("last_seen")
            if fs and (first_seen is None or str(fs) < str(first_seen)):
                first_seen = str(fs)
            if ls and (last_seen is None or str(ls) > str(last_seen)):
                last_seen = str(ls)

        result = {
            "ioc_value": domain,
            "ioc_type": "domain",
            "risk_level": _risk_from_score(risk_score),
            "risk_score": risk_score,
            "sources": sources,
            "tags": tags,
            "description": f"该域名被{len(sources)}个情报源查询，风险评分{risk_score}",
            "first_seen": first_seen,
            "last_seen": last_seen,
            "cached": False,
            "queried_at": datetime.now(timezone.utc).isoformat(),
        }
        await self._cache_set(cache_key, result)
        return result

    async def lookup_hash(self, file_hash: str) -> dict:
        self._stats["total_queries"] += 1
        hash_type = _classify_ioc(file_hash)
        cache_key = self._build_cache_key("hash", file_hash)
        cached = await self._cache_get(cache_key)
        if cached:
            cached["cached"] = True
            return cached

        if not self.is_available:
            result = self._fallback_result(file_hash, hash_type)
            await self._cache_set(cache_key, result)
            return result

        sources: dict = {}
        vt_task = self._fetch_virustotal_file(file_hash)
        tf_task = self._fetch_threatfox(file_hash, hash_type)
        vt_result, tf_result = await asyncio.gather(vt_task, tf_task, return_exceptions=True)

        if isinstance(vt_result, dict):
            sources["virustotal"] = vt_result
        if isinstance(tf_result, dict):
            sources["threatfox"] = tf_result

        if not sources:
            result = self._no_result(file_hash, hash_type)
            await self._cache_set(cache_key, result)
            return result

        risk_score = self._merge_risk_score(sources)
        tags = self._merge_tags(sources)
        first_seen = None
        last_seen = None
        for src_data in sources.values():
            fs = src_data.get("first_seen")
            ls = src_data.get("last_seen")
            if fs and (first_seen is None or str(fs) < str(first_seen)):
                first_seen = str(fs)
            if ls and (last_seen is None or str(ls) > str(last_seen)):
                last_seen = str(ls)

        result = {
            "ioc_value": file_hash,
            "ioc_type": hash_type,
            "risk_level": _risk_from_score(risk_score),
            "risk_score": risk_score,
            "sources": sources,
            "tags": tags,
            "description": f"该文件哈希被{len(sources)}个情报源查询，风险评分{risk_score}",
            "first_seen": first_seen,
            "last_seen": last_seen,
            "cached": False,
            "queried_at": datetime.now(timezone.utc).isoformat(),
        }
        await self._cache_set(cache_key, result)
        return result

    async def lookup_url(self, url: str) -> dict:
        self._stats["total_queries"] += 1
        cache_key = self._build_cache_key("url", url)
        cached = await self._cache_get(cache_key)
        if cached:
            cached["cached"] = True
            return cached

        if not self.is_available:
            result = self._fallback_result(url, "url")
            await self._cache_set(cache_key, result)
            return result

        sources: dict = {}
        vt_result = await self._fetch_virustotal_url(url)
        if vt_result:
            sources["virustotal"] = vt_result

        if not sources:
            result = self._no_result(url, "url")
            await self._cache_set(cache_key, result)
            return result

        risk_score = self._merge_risk_score(sources)
        tags = self._merge_tags(sources)
        first_seen = None
        last_seen = None
        for src_data in sources.values():
            fs = src_data.get("first_seen")
            ls = src_data.get("last_seen")
            if fs and (first_seen is None or str(fs) < str(first_seen)):
                first_seen = str(fs)
            if ls and (last_seen is None or str(ls) > str(last_seen)):
                last_seen = str(ls)

        result = {
            "ioc_value": url,
            "ioc_type": "url",
            "risk_level": _risk_from_score(risk_score),
            "risk_score": risk_score,
            "sources": sources,
            "tags": tags,
            "description": f"该URL被{len(sources)}个情报源查询，风险评分{risk_score}",
            "first_seen": first_seen,
            "last_seen": last_seen,
            "cached": False,
            "queried_at": datetime.now(timezone.utc).isoformat(),
        }
        await self._cache_set(cache_key, result)
        return result

    async def search_ioc(self, ioc_value: str, ioc_type: str = "auto") -> dict:
        if ioc_type == "auto":
            ioc_type = _classify_ioc(ioc_value)

        if ioc_type == "ip":
            return await self.lookup_ip(ioc_value)
        if ioc_type == "domain":
            return await self.lookup_domain(ioc_value)
        if ioc_type in ("md5", "sha1", "sha256"):
            return await self.lookup_hash(ioc_value)
        if ioc_type == "url":
            return await self.lookup_url(ioc_value)

        return {
            "ioc_value": ioc_value,
            "ioc_type": ioc_type,
            "risk_level": "info",
            "risk_score": 0,
            "sources": {},
            "tags": [],
            "description": f"无法识别的IOC类型: {ioc_type}",
            "first_seen": None,
            "last_seen": None,
            "cached": False,
            "queried_at": datetime.now(timezone.utc).isoformat(),
        }

    async def batch_lookup(self, iocs: list[str]) -> list[dict]:
        cache_keys: list[str] = []
        ioc_types: list[str] = []
        for ioc in iocs:
            ioc_type = _classify_ioc(ioc)
            ioc_types.append(ioc_type)
            cache_keys.append(self._build_cache_key(ioc_type, ioc))

        results: list[Optional[dict]] = [None] * len(iocs)
        uncached_indices: list[int] = []

        if self._redis:
            try:
                pipe = self._redis.pipeline()
                for key in cache_keys:
                    pipe.get(key)
                redis_results = await pipe.execute()

                for i, data in enumerate(redis_results):
                    if data:
                        self._stats["cache_hits"] += 1
                        cached_result = json.loads(data)
                        cached_result["cached"] = True
                        results[i] = cached_result
                    else:
                        uncached_indices.append(i)
            except Exception as exc:
                logger.warning("Redis batch cache lookup failed: %s", exc)
                uncached_indices = list(range(len(iocs)))
        else:
            for i, key in enumerate(cache_keys):
                cached = await self._cache_get(key)
                if cached:
                    cached["cached"] = True
                    results[i] = cached
                else:
                    uncached_indices.append(i)

        if uncached_indices:
            tasks = [
                self.search_ioc(iocs[i], ioc_types[i]) for i in uncached_indices
            ]
            lookup_results = await asyncio.gather(*tasks)
            for j, i in enumerate(uncached_indices):
                results[i] = lookup_results[j]

        return [r for r in results if r is not None]

    def get_stats(self) -> dict:
        total = self._stats["total_queries"]
        hits = self._stats["cache_hits"]
        cache_hit_rate = (hits / total * 100) if total > 0 else 0.0

        return {
            "total_queries": total,
            "cache_hits": hits,
            "api_calls": self._stats["api_calls"],
            "errors": self._stats["errors"],
            "rate_limited": self._stats["rate_limited"],
            "cache_entries": len(self._cache),
            "cache_hit_rate": round(cache_hit_rate, 2),
            "cache_backend": "redis" if self._redis else "memory",
            "redis_available": self._redis is not None,
            "sources_available": {
                "virustotal": bool(self._vt_key),
                "abuseipdb": bool(self._abuse_key),
                "threatfox": True,
            },
        }

    def list_sources(self) -> list[dict]:
        return [
            {
                "name": "VirusTotal",
                "key": "virustotal",
                "type": "multi",
                "supported_ioc_types": ["ip", "domain", "md5", "sha1", "sha256", "url"],
                "available": bool(self._vt_key),
                "description": "VirusTotal多引擎恶意软件检测平台",
            },
            {
                "name": "AbuseIPDB",
                "key": "abuseipdb",
                "type": "ip",
                "supported_ioc_types": ["ip"],
                "available": bool(self._abuse_key),
                "description": "AbuseIPDB IP地址滥用信誉数据库",
            },
            {
                "name": "ThreatFox",
                "key": "threatfox",
                "type": "multi",
                "supported_ioc_types": ["ip", "domain", "md5", "sha1", "sha256"],
                "available": True,
                "description": "ThreatFox由abuse.ch运营的IOC共享平台",
            },
        ]


ioc_service = IOCService()