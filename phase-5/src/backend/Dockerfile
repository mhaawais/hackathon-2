FROM python:3.11-slim

WORKDIR /code

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app
COPY backend/ ./

# Copy MCP tools (required by agent_service.py — resolves to /mcp inside container)
COPY mcp/ /mcp

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
