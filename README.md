# SentinelMesh

SentinelMesh is an AI Agent Security Firewall that protects AI applications by validating tool calls, enforcing security policies, blocking unauthorized actions, and maintaining audit logs through a centralized security gateway.

## Features

- **Tool Call Validation:** Intercepts and inspects model tool calls before execution.
- **Security Policy Enforcement:** Applies rules to control tool and API access.
- **Action Blocking:** Blocks unauthorized or out-of-scope actions in real time.
- **Audit Logging:** Centralized gateway for tracing agent activity and violations.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm, pnpm, or bun

### Run Locally

1. Clone the repository:
   ```bash
   git clone [https://github.com/suraj-0905/SentinelMesh.git](https://github.com/suraj-0905/SentinelMesh.git)
   cd SentinelMesh
   npm install
   GEMINI_API_KEY=your_gemini_api_key_here
   npm run dev
   
