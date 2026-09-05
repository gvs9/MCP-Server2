import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { sendEmail } from "./tools/gmail.js";
import { appendContent, appendMultiple } from "./tools/docs.js";

const server = new Server(
  {
    name: "google-workspace-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "gmail_send_email",
        description: "Send an email via Gmail",
        inputSchema: {
          type: "object",
          properties: {
            to: {
              type: ["string", "array"],
              description: "Recipient email address(es)",
            },
            subject: {
              type: "string",
              description: "Email subject line",
            },
            body: {
              type: "string",
              description: "Email body in plain text",
            },
            cc: {
              type: "array",
              description: "CC recipients",
              items: { type: "string" },
            },
            bcc: {
              type: "array",
              description: "BCC recipients",
              items: { type: "string" },
            },
            bodyHtml: {
              type: "string",
              description: "Email body in HTML format (optional)",
            },
            draft: {
              type: "boolean",
              description: "Save as draft instead of sending",
              default: false,
            },
          },
          required: ["to", "subject", "body"],
        },
      },
      {
        name: "docs_append_content",
        description: "Append content to a Google Doc",
        inputSchema: {
          type: "object",
          properties: {
            documentId: {
              type: "string",
              description: "Google Docs document ID",
            },
            content: {
              type: "string",
              description: "Content to append",
            },
            heading: {
              type: "string",
              description: "Optional section heading",
            },
            appendNewline: {
              type: "boolean",
              default: true,
            },
          },
          required: ["documentId", "content"],
        },
      },
      {
        name: "docs_append_multiple",
        description: "Append multiple sections to a Google Doc sequentially",
        inputSchema: {
          type: "object",
          properties: {
            documentId: {
              type: "string",
              description: "Google Docs document ID",
            },
            items: {
              type: "array",
              description: "Items to append",
              items: {
                  type: "object",
                  properties: {
                      content: { type: "string" },
                      heading: { type: "string" }
                  },
                  required: ["content"]
              }
            },
          },
          required: ["documentId", "items"],
        },
      }
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "gmail_send_email") {
    const result = await sendEmail(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }

  if (name === "docs_append_content") {
    const result = await appendContent(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
  
  if (name === "docs_append_multiple") {
      const result = await appendMultiple(args);
      return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
  }

  throw new Error(`Tool not found: ${name}`);
});

import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

// Start the server
const app = express();
const PORT = process.env.PORT || 3000;

let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
  
  res.on("close", () => {
    console.log("SSE connection closed");
  });
});

app.post("/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(500).send("SSE transport not connected");
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Google Workspace MCP Server running on http://localhost:${PORT}`);
});
