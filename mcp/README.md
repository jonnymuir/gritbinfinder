# GritBin MCP Example

This directory contains two example Python files for experimenting with [MCPs](https://github.com/jmuir/gritbinfinder) and agentic loops using [pydantic-ai](https://github.com/pydantic/pydantic-ai). 

The agent interacts with the GritBin Finder website. In reality it would be a bit weird to do this like I have done (using playwright to navigate around), but it was fun, and it's just to get a feel for how agents work.

Enjoy!

## Quick Start

### 1. Change to the `mcp` Directory

```bash
cd /Users/jonnymuir/Documents/Projects/gritbinfinder/mcp
```

### 2. Create and Activate a Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Create and Populate Your `.env` File

Create a `.env` file in this directory with the following content:

```
GOOGLE_API_KEY=your-google-api-key-here
LOGFIRE_TOKEN=your-logfire-token-here
```

- **GOOGLE_API_KEY**: Get this from your [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- **LOGFIRE_TOKEN**: Sign up at [Logfire](https://logfire.ai/) and get your API token from your dashboard.

### 5. Run the Example Files

#### Start the MCP Server

This file launches a FastMCP server that exposes a tool for interacting with the GritBin Finder website.

```bash
python gritbin_mcp_server.py
```

#### Run the Agent CLI

This file starts a simple command-line agent that talks to the MCP server and interacts with the GritBin Finder website.

```bash
python main.py
```

## About the Example Files

- **`gritbin_mcp_server.py`**  
  Runs a FastMCP server with a tool that uses Playwright to interact with the GritBin Finder website. It can search for grit bins by postcode and extract information from the map.

- **`main.py`**  
  A simple CLI agent using `pydantic-ai` that connects to the MCP server and lets you chat with the agent. The agent can answer questions and interact with the GritBin Finder site in an agentic loop.

Both files are meant for experimentation and learning. Have fun exploring agentic automation with GritBin Finder!

---