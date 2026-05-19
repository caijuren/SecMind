FROM python:3.11-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION:-0.0.0}
ENV PYTHONPATH=/app

RUN groupadd -r secmind && useradd -r -g secmind -d /app -s /sbin/nologin secmind

COPY --from=builder /root/.local /usr/local
COPY app/ ./app/
COPY init_db.py ./init_db.py
COPY seed_db.py ./seed_db.py
COPY VERSION ./VERSION

RUN chown -R secmind:secmind /app

USER secmind

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

EXPOSE 8000

CMD ["/bin/sh", "-c", "python3 init_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
