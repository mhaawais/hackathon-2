FROM python:3.11-slim

WORKDIR /code

# Install Python dependencies
COPY src/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app AND mcp tools (agent_service.py imports from mcp/ via sys.path)
COPY src/backend/ ./backend/
COPY src/mcp/ ./mcp/

# Structure in container:
#   /code/backend/  ← FastAPI app (WORKDIR)
#   /code/mcp/      ← MCP tools (3 hops up from services/: services→app→backend→/code/mcp/)
WORKDIR /code/backend

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
