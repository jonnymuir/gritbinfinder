# main.py
from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider
from pydantic_ai.mcp import MCPServerSSE
import logfire
import os

from dotenv import load_dotenv  
load_dotenv()

logfire.configure(token = os.getenv("LOGFIRE_TOKEN"))

provider = GoogleProvider()
model = GoogleModel("gemini-2.5-flash", provider=provider)

# Connect to the locally running MCP server.
# The URL should match where your gritbin_mcp_server.py is running and its path_prefix.
gritbin_server = MCPServerSSE(url="http://localhost:8080/sse/") 

agent = Agent(model, 
              instrument=True,
              toolsets=[gritbin_server])

from rich.console import Console
from rich.markdown import Markdown

async def main():
    console = Console()
    async with agent:
        console.print("[bold green]Pydantic AI Agent is ready. Try asking about grit bins![/bold green]")
        result = await agent.run("hello!")  # Initial greeting to prime the agent
        while True:
            console.print(Markdown(result.output))
            user_input = input("\n> User: ")
            if user_input.lower() == "exit":
                break
            result = await agent.run(user_input, message_history=result.new_messages())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
