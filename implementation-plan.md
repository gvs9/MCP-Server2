# Google Workspace MCP Server Implementation Plan

Implement a generic Model Context Protocol (MCP) server that enables AI agents to interact with Gmail and Google Docs. This server will provide standardized interfaces for sending emails, drafting emails, and appending content to documents.

## User Review Required

> [!IMPORTANT]  
> Please review the architecture and proposed dependencies. Let me know if you have a preference for any specific libraries (e.g., standard Google APIs Node.js client vs. custom HTTP wrappers).
> The setup requires Google Cloud OAuth credentials. Are you prepared to set up a Google Cloud project with the necessary OAuth scopes (`gmail.send`, `gmail.compose`, `documents`), or would you like guidance on that process?

## Open Questions

> [!WARNING]  
> 1. How should we manage user authentication? Should the server handle OAuth flow directly and store tokens, or should it rely on environment variables with a pre-authorized service account/user token?
> 2. Are there any specific logging frameworks you prefer (e.g., Winston, Pino, or standard console)?
> 3. Should we implement the optional enhancements (`gmail_get_message_status`, `docs_create_document`) in the initial version?

## Proposed Changes

We will create a new Node.js project using TypeScript and the official `@modelcontextprotocol/sdk`.

### Core Setup & Infrastructure

Set up the project, install dependencies, and configure the MCP server instance.

#### [NEW] [package.json](file:///c:/Users/a/MCP-Server2/package.json)
Initialize the Node.js project with scripts for building and running. Add dependencies: `@modelcontextprotocol/sdk`, `googleapis`, `dotenv`, and TypeScript tooling.

#### [NEW] [tsconfig.json](file:///c:/Users/a/MCP-Server2/tsconfig.json)
TypeScript configuration targeting Node.js.

#### [NEW] [.env.example](file:///c:/Users/a/MCP-Server2/.env.example)
Template for environment variables (Google OAuth credentials, port).

---

### Authentication & API Clients

Handle Google API authentication and client initialization.

#### [NEW] [src/auth/google.ts](file:///c:/Users/a/MCP-Server2/src/auth/google.ts)
Implement OAuth 2.0 authentication using `googleapis`. Manage token lifecycle and initialize Gmail and Docs API clients.

---

### Gmail Operations

Implement the Gmail tools.

#### [NEW] [src/tools/gmail.ts](file:///c:/Users/a/MCP-Server2/src/tools/gmail.ts)
Implement `gmail_send_email` and `gmail_draft_email` functions using the Gmail API. Implement input validation and error handling.

---

### Google Docs Operations

Implement the Google Docs tools.

#### [NEW] [src/tools/docs.ts](file:///c:/Users/a/MCP-Server2/src/tools/docs.ts)
Implement `docs_append_content` and `docs_append_multiple` functions using the Google Docs API. Handle formatting preservation and newline additions.

---

### Server Initialization & Tool Registration

Wire everything together using the MCP SDK.

#### [NEW] [src/index.ts](file:///c:/Users/a/MCP-Server2/src/index.ts)
Initialize the MCP server, register the Gmail and Docs tools with their JSON schemas, and start the stdio transport.

## Verification Plan

1. **Build & Type Check**: Ensure the TypeScript code compiles without errors (`npm run build`).
2. **Unit Tests (Optional)**: If requested, we can add basic unit tests using Jest.
3. **Manual Verification**:
   - Provide the server command to an MCP-compatible client (e.g., this Claude environment).
   - Test sending an email to a verified address.
   - Test drafting an email.
   - Test appending text to a newly created Google Doc.
