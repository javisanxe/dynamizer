FROM python:3.11-slim

WORKDIR /app

RUN pip install hatchling

COPY pyproject.toml .
RUN pip install -e .

COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:asgi_app", "--host", "0.0.0.0", "--port", "8000"]
