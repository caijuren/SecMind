from datetime import datetime, timedelta
from collections import defaultdict
from typing import Optional

FUNNEL_STAGES = {
    "visit": "访问",
    "signup": "注册",
    "trial_start": "开始试用",
    "first_analysis": "首次分析",
    "first_response": "首次处置",
    "subscribe": "付费订阅",
}

STAGE_ORDER = list(FUNNEL_STAGES.keys())

_events_store: list[dict] = []

MOCK_FUNNEL_DATA = {
    "visit": 10000,
    "signup": 3200,
    "trial_start": 2100,
    "first_analysis": 1350,
    "first_response": 780,
    "subscribe": 390,
}

MOCK_TREND_DATA = [
    {"date": "04-14", "visit": 9200, "signup": 2800, "trial_start": 1900, "first_analysis": 1200, "first_response": 700, "subscribe": 350},
    {"date": "04-21", "visit": 9500, "signup": 2950, "trial_start": 1950, "first_analysis": 1250, "first_response": 720, "subscribe": 360},
    {"date": "04-28", "visit": 9800, "signup": 3050, "trial_start": 2000, "first_analysis": 1280, "first_response": 740, "subscribe": 370},
    {"date": "05-05", "visit": 10200, "signup": 3150, "trial_start": 2080, "first_analysis": 1320, "first_response": 760, "subscribe": 380},
    {"date": "05-12", "visit": 10000, "signup": 3200, "trial_start": 2100, "first_analysis": 1350, "first_response": 780, "subscribe": 390},
]


def _parse_period(period: str) -> timedelta:
    unit = period[-1]
    value = int(period[:-1])
    if unit == "d":
        return timedelta(days=value)
    if unit == "h":
        return timedelta(hours=value)
    return timedelta(days=30)


def _filter_events(period: str) -> list[dict]:
    delta = _parse_period(period)
    cutoff = datetime.now() - delta
    return [e for e in _events_store if e["timestamp"] >= cutoff]


def _has_real_data() -> bool:
    return len(_events_store) > 0


def track_event(user_id: str, stage: str, metadata: Optional[dict] = None) -> dict:
    if stage not in FUNNEL_STAGES:
        raise ValueError(f"无效的漏斗阶段: {stage}")
    event = {
        "user_id": user_id,
        "stage": stage,
        "metadata": metadata or {},
        "timestamp": datetime.now(),
    }
    _events_store.append(event)
    return event


def get_funnel_data(period: str = "30d") -> dict:
    if not _has_real_data():
        stages = []
        for i, stage_key in enumerate(STAGE_ORDER):
            count = MOCK_FUNNEL_DATA[stage_key]
            prev_count = MOCK_FUNNEL_DATA[STAGE_ORDER[i - 1]] if i > 0 else None
            conversion_rate = round(count / prev_count * 100, 2) if prev_count and prev_count > 0 else None
            stages.append({
                "stage": stage_key,
                "label": FUNNEL_STAGES[stage_key],
                "count": count,
                "conversion_rate": conversion_rate,
                "overall_rate": round(count / MOCK_FUNNEL_DATA[STAGE_ORDER[0]] * 100, 2),
            })
        return {
            "period": period,
            "total_entered": MOCK_FUNNEL_DATA[STAGE_ORDER[0]],
            "stages": stages,
            "is_mock": True,
        }

    events = _filter_events(period)
    user_stages: dict[str, set[str]] = defaultdict(set)
    for e in events:
        user_stages[e["user_id"]].add(e["stage"])

    stage_counts = {}
    for stage_key in STAGE_ORDER:
        count = sum(1 for stages in user_stages.values() if stage_key in stages)
        stage_counts[stage_key] = count

    first_count = stage_counts.get(STAGE_ORDER[0], 0)
    stages = []
    for i, stage_key in enumerate(STAGE_ORDER):
        count = stage_counts[stage_key]
        prev_count = stage_counts[STAGE_ORDER[i - 1]] if i > 0 else None
        conversion_rate = round(count / prev_count * 100, 2) if prev_count and prev_count > 0 else None
        stages.append({
            "stage": stage_key,
            "label": FUNNEL_STAGES[stage_key],
            "count": count,
            "conversion_rate": conversion_rate,
            "overall_rate": round(count / first_count * 100, 2) if first_count > 0 else 0,
        })

    return {
        "period": period,
        "total_entered": first_count,
        "stages": stages,
        "is_mock": False,
    }


def get_conversion_rate(from_stage: str, to_stage: str, period: str = "30d") -> float:
    if not _has_real_data():
        from_count = MOCK_FUNNEL_DATA.get(from_stage, 0)
        to_count = MOCK_FUNNEL_DATA.get(to_stage, 0)
        if from_count == 0:
            return 0.0
        return round(to_count / from_count * 100, 2)

    events = _filter_events(period)
    user_stages: dict[str, set[str]] = defaultdict(set)
    for e in events:
        user_stages[e["user_id"]].add(e["stage"])

    from_count = sum(1 for stages in user_stages.values() if from_stage in stages)
    to_count = sum(1 for stages in user_stages.values() if to_stage in stages)

    if from_count == 0:
        return 0.0
    return round(to_count / from_count * 100, 2)


def get_drop_off_analysis(period: str = "30d") -> dict:
    funnel = get_funnel_data(period)
    stages = funnel["stages"]
    drop_offs = []
    max_drop_off = None
    max_drop_rate = 0.0

    for i in range(1, len(stages)):
        prev = stages[i - 1]
        curr = stages[i]
        drop_count = prev["count"] - curr["count"]
        drop_rate = round(drop_count / prev["count"] * 100, 2) if prev["count"] > 0 else 0
        entry = {
            "from_stage": prev["stage"],
            "from_label": prev["label"],
            "to_stage": curr["stage"],
            "to_label": curr["label"],
            "drop_count": drop_count,
            "drop_rate": drop_rate,
            "is_max": False,
        }
        if drop_rate > max_drop_rate:
            max_drop_rate = drop_rate
            max_drop_off = entry
        drop_offs.append(entry)

    if max_drop_off:
        max_drop_off["is_max"] = True

    return {
        "period": period,
        "drop_offs": drop_offs,
        "max_drop_off": max_drop_off,
        "is_mock": funnel["is_mock"],
    }


def get_trend_data(period: str = "90d") -> list[dict]:
    if not _has_real_data():
        return MOCK_TREND_DATA

    delta = _parse_period(period)
    cutoff = datetime.now() - delta
    events = [e for e in _events_store if e["timestamp"] >= cutoff]

    if not events:
        return MOCK_TREND_DATA

    week_buckets: dict[str, dict[str, int]] = {}
    for e in events:
        dt = e["timestamp"]
        week_start = dt - timedelta(days=dt.weekday())
        week_key = week_start.strftime("%m-%d")
        if week_key not in week_buckets:
            week_buckets[week_key] = {s: 0 for s in STAGE_ORDER}
        week_buckets[week_key][e["stage"]] += 1

    user_stages_by_week: dict[str, dict[str, set[str]]] = defaultdict(lambda: defaultdict(set))
    for e in events:
        dt = e["timestamp"]
        week_start = dt - timedelta(days=dt.weekday())
        week_key = week_start.strftime("%m-%d")
        user_stages_by_week[week_key][e["stage"]].add(e["user_id"])

    result = []
    for week_key in sorted(week_buckets.keys()):
        entry = {"date": week_key}
        for stage_key in STAGE_ORDER:
            entry[stage_key] = len(user_stages_by_week[week_key][stage_key])
        result.append(entry)

    return result
