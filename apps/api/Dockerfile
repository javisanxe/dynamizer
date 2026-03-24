FROM python:3.11-slim AS builder

WORKDIR /app

# Install Poetry
RUN pip install poetry==2.2.1

# Copy dependency files only (better layer caching)
COPY pyproject.toml poetry.lock ./

# Export dependencies to requirements.txt (no Poetry in final image)
RUN poetry export --without dev --without-hashes -f requirements.txt -o requirements.txt


FROM python:3.11-slim

WORKDIR /app

# Install dependencies from the exported requirements.txt
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:asgi_app", "--host", "0.0.0.0", "--port", "8000"]
