# FLUX Integration Specifications
## API Connectors & Authentication Guide

**Document Version:** 1.0  
**Last Updated:** 02:31:45 Dec 07, 2025  
**Classification:** Technical Implementation Guide

---

## Table of Contents

1. [GitHub Integration](#1-github-integration)
2. [Slack Integration](#2-slack-integration)
3. [Figma Integration](#3-figma-integration)
4. [Trello Integration](#4-trello-integration)
5. [Gmail Integration](#5-gmail-integration)
6. [Vercel Integration](#6-vercel-integration)
7. [Supabase Integration](#7-supabase-integration)
8. [AWS Integration](#8-aws-integration)

---

## 1. GitHub Integration

**Purpose:** Sync issues, pull requests, and commit history directly to Flux tasks.

### Authentication

**Method:** OAuth 2.0 App or Personal Access Token (PAT)

#### Option A: GitHub OAuth App (Recommended for Production)

1. **Create OAuth App:**
   - Go to: `https://github.com/settings/developers`
   - Click "New OAuth App"
   - Set Authorization callback URL: `https://your-flux-domain.com/api/integrations/github/callback`

2. **Required Credentials:**
   ```
   CLIENT_ID=<your-github-client-id>
   CLIENT_SECRET=<your-github-client-secret>
   ```

3. **OAuth Flow:**
   ```
   Authorization URL: https://github.com/login/oauth/authorize
   Token URL: https://github.com/login/oauth/access_token
   ```

4. **Required Scopes:**
   ```
   repo              - Full control of private repositories
   read:user         - Read user profile data
   read:org          - Read org membership (optional)
   ```

#### Option B: Personal Access Token (Quick Setup)

1. Go to: `https://github.com/settings/tokens`
2. Generate new token (classic) with scopes: `repo`, `read:user`

### API Endpoints

**Base URL:** `https://api.github.com`

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Issues | GET | `/repos/{owner}/{repo}/issues` | Get all issues |
| Create Issue | POST | `/repos/{owner}/{repo}/issues` | Create new issue |
| Update Issue | PATCH | `/repos/{owner}/{repo}/issues/{issue_number}` | Update existing |
| List PRs | GET | `/repos/{owner}/{repo}/pulls` | Get pull requests |
| Get Commits | GET | `/repos/{owner}/{repo}/commits` | Get commit history |
| Webhooks | POST | `/repos/{owner}/{repo}/hooks` | Create webhook |

### Request Headers

```javascript
{
  "Authorization": "Bearer <access_token>",
  "Accept": "application/vnd.github.v3+json",
  "X-GitHub-Api-Version": "2022-11-28"
}
```

### Webhook Events to Subscribe

```json
{
  "events": [
    "issues",
    "pull_request",
    "push",
    "issue_comment",
    "pull_request_review"
  ]
}
```

### Sample Implementation

```typescript
// src/lib/integrations/github.ts
import { Octokit } from "@octokit/rest";

export class GitHubConnector {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
  }

  async listIssues(owner: string, repo: string) {
    const { data } = await this.octokit.issues.listForRepo({
      owner,
      repo,
      state: "all",
      per_page: 100,
    });
    return data;
  }

  async createIssue(owner: string, repo: string, title: string, body: string) {
    const { data } = await this.octokit.issues.create({
      owner,
      repo,
      title,
      body,
    });
    return data;
  }

  async syncToFluxTask(issue: any): FluxTask {
    return {
      id: `gh-${issue.id}`,
      title: issue.title,
      description: issue.body,
      status: issue.state === "closed" ? "done" : "todo",
      priority: issue.labels.includes("urgent") ? "high" : "medium",
      externalId: issue.number,
      source: "github",
    };
  }
}
```

---

## 2. Slack Integration

**Purpose:** Receive notifications and update tasks via slash commands.

### Authentication

**Method:** OAuth 2.0 with Bot Token

1. **Create Slack App:**
   - Go to: `https://api.slack.com/apps`
   - Click "Create New App" → "From scratch"

2. **Required Credentials:**
   ```
   SLACK_CLIENT_ID=<client-id>
   SLACK_CLIENT_SECRET=<client-secret>
   SLACK_SIGNING_SECRET=<signing-secret>
   SLACK_BOT_TOKEN=xoxb-<bot-token>
   ```

3. **OAuth Flow:**
   ```
   Authorization URL: https://slack.com/oauth/v2/authorize
   Token URL: https://slack.com/api/oauth.v2.access
   ```

4. **Required Bot Token Scopes:**
   ```
   chat:write           - Send messages
   channels:read        - View channel info
   commands             - Add slash commands
   incoming-webhook     - Post to specific channel
   users:read           - View user info
   app_mentions:read    - Receive @mentions
   ```

### API Endpoints

**Base URL:** `https://slack.com/api`

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Post Message | POST | `/chat.postMessage` | Send message to channel |
| Update Message | POST | `/chat.update` | Edit existing message |
| List Channels | GET | `/conversations.list` | Get available channels |
| Get User Info | GET | `/users.info` | Get user details |
| Open Modal | POST | `/views.open` | Open interactive modal |

### Request Format

```javascript
// Headers
{
  "Authorization": "Bearer xoxb-your-bot-token",
  "Content-Type": "application/json"
}

// POST /chat.postMessage
{
  "channel": "C1234567890",
  "text": "Task completed!",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Task Completed* [DONE]\n`FLUX-123` API Integration has been marked as done."
      }
    }
  ]
}
```

### Slash Commands Setup

Register these commands in your Slack app:

| Command | Request URL | Description |
|---------|-------------|-------------|
| `/flux` | `https://your-domain.com/api/slack/commands` | Main command |
| `/flux-task` | `https://your-domain.com/api/slack/task` | Create task |
| `/flux-status` | `https://your-domain.com/api/slack/status` | Project status |

### Incoming Webhooks

For simple notifications without OAuth:

```javascript
const WEBHOOK_URL = "<YOUR_SLACK_WEBHOOK_URL>";

await fetch(WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "New task created in Flux!",
    username: "Flux Bot",
    icon_emoji: ":zap:"
  })
});
```

### Sample Implementation

```typescript
// src/lib/integrations/slack.ts
import { WebClient } from "@slack/web-api";

export class SlackConnector {
  private client: WebClient;

  constructor(botToken: string) {
    this.client = new WebClient(botToken);
  }

  async sendTaskNotification(channelId: string, task: FluxTask) {
    await this.client.chat.postMessage({
      channel: channelId,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "[NEW] Task Created" }
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Title:*\n${task.title}` },
            { type: "mrkdwn", text: `*Priority:*\n${task.priority}` },
            { type: "mrkdwn", text: `*Status:*\n${task.status}` },
            { type: "mrkdwn", text: `*Assignee:*\n${task.assignee || "Unassigned"}` }
          ]
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View in Flux" },
              url: `https://flux.app/task/${task.id}`,
              action_id: "view_task"
            }
          ]
        }
      ]
    });
  }
}
```

---

## 3. Figma Integration

**Purpose:** Embed live design files and prototypes into the asset manager.

### Authentication

**Method:** OAuth 2.0 or Personal Access Token

1. **Create Figma App:**
   - Go to: `https://www.figma.com/developers/apps`
   - Click "Create a new app"
   - Set Callback URL: `https://your-flux-domain.com/api/integrations/figma/callback`

2. **Required Credentials:**
   ```
   FIGMA_CLIENT_ID=<client-id>
   FIGMA_CLIENT_SECRET=<client-secret>
   ```

3. **OAuth Flow:**
   ```
   Authorization URL: https://www.figma.com/oauth?client_id={client_id}&redirect_uri={redirect_uri}&scope=files:read&state={state}&response_type=code
   Token URL: https://www.figma.com/api/oauth/token
   ```

4. **Required Scopes:**
   ```
   files:read          - Read files and projects
   file_comments:write - Post comments (optional)
   ```

#### Personal Access Token (Quick Setup)

1. Go to: `https://www.figma.com/developers/api#access-tokens`
2. Generate personal access token

### API Endpoints

**Base URL:** `https://api.figma.com/v1`

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Get File | GET | `/files/{file_key}` | Get file data |
| Get Images | GET | `/images/{file_key}` | Export images |
| Get Comments | GET | `/files/{file_key}/comments` | Get file comments |
| Post Comment | POST | `/files/{file_key}/comments` | Add comment |
| Get Projects | GET | `/teams/{team_id}/projects` | List team projects |
| Get Project Files | GET | `/projects/{project_id}/files` | List project files |

### Request Headers

```javascript
{
  "X-Figma-Token": "<personal-access-token>",
  // OR for OAuth
  "Authorization": "Bearer <oauth-access-token>"
}
```

### Embed URL Format

To embed Figma files in Flux:

```
// Embed URL (iframe src)
https://www.figma.com/embed?embed_host=flux&url={figma_file_url}

// Example
https://www.figma.com/embed?embed_host=flux&url=https://www.figma.com/file/ABC123/Design-System
```

### Sample Implementation

```typescript
// src/lib/integrations/figma.ts
export class FigmaConnector {
  private token: string;
  private baseUrl = "https://api.figma.com/v1";

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: { "X-Figma-Token": this.token }
    });
    return response.json();
  }

  async getFile(fileKey: string) {
    return this.request(`/files/${fileKey}`);
  }

  async getFileImages(fileKey: string, nodeIds: string[], format = "png") {
    const ids = nodeIds.join(",");
    return this.request(`/images/${fileKey}?ids=${ids}&format=${format}`);
  }

  async getFileThumbnail(fileKey: string): Promise<string> {
    const file = await this.getFile(fileKey);
    return file.thumbnailUrl;
  }

  generateEmbedUrl(fileUrl: string): string {
    return `https://www.figma.com/embed?embed_host=flux&url=${encodeURIComponent(fileUrl)}`;
  }
}
```

---

## 4. Trello Integration

**Purpose:** Import boards and keep cards in sync with two-way binding.

### Authentication

**Method:** API Key + Token

1. **Get API Key:**
   - Go to: `https://trello.com/power-ups/admin`
   - Or directly: `https://trello.com/app-key`

2. **Generate Token:**
   - Visit: `https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&key={YOUR_API_KEY}`

3. **Required Credentials:**
   ```
   TRELLO_API_KEY=<api-key>
   TRELLO_TOKEN=<user-token>
   ```

### API Endpoints

**Base URL:** `https://api.trello.com/1`

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| Get Boards | GET | `/members/me/boards` | List user's boards |
| Get Board | GET | `/boards/{id}` | Get single board |
| Get Lists | GET | `/boards/{id}/lists` | Get board lists |
| Get Cards | GET | `/boards/{id}/cards` | Get all cards |
| Create Card | POST | `/cards` | Create new card |
| Update Card | PUT | `/cards/{id}` | Update card |
| Delete Card | DELETE | `/cards/{id}` | Delete card |
| Create Webhook | POST | `/webhooks` | Create webhook |

### Request Format

```javascript
// All requests require key and token as query params
GET https://api.trello.com/1/boards/{id}?key={apiKey}&token={token}

// Or in body for POST/PUT
{
  "key": "your-api-key",
  "token": "your-token",
  "name": "Card Name",
  "desc": "Description",
  "idList": "list-id"
}
```

### Webhook Setup

```javascript
// Create webhook for board changes
POST https://api.trello.com/1/webhooks
{
  "key": "{apiKey}",
  "token": "{token}",
  "callbackURL": "https://your-flux-domain.com/api/trello/webhook",
  "idModel": "{boardId}",
  "description": "Flux sync webhook"
}
```

### Sample Implementation

```typescript
// src/lib/integrations/trello.ts
export class TrelloConnector {
  private apiKey: string;
  private token: string;
  private baseUrl = "https://api.trello.com/1";

  constructor(apiKey: string, token: string) {
    this.apiKey = apiKey;
    this.token = token;
  }

  private buildUrl(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("token", this.token);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  }

  async getBoards() {
    const response = await fetch(this.buildUrl("/members/me/boards"));
    return response.json();
  }

  async getBoardCards(boardId: string) {
    const response = await fetch(this.buildUrl(`/boards/${boardId}/cards`));
    return response.json();
  }

  async importBoardToFlux(boardId: string): Promise<FluxTask[]> {
    const cards = await this.getBoardCards(boardId);
    return cards.map((card: any) => ({
      id: `trello-${card.id}`,
      title: card.name,
      description: card.desc,
      status: this.mapListToStatus(card.idList),
      externalId: card.id,
      source: "trello",
    }));
  }

  async createCard(listId: string, name: string, desc: string) {
    const response = await fetch(this.buildUrl("/cards"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: this.apiKey,
        token: this.token,
        idList: listId,
        name,
        desc
      })
    });
    return response.json();
  }
}
```

---

## 5. Gmail Integration

**Purpose:** Turn emails into actionable tasks with a single click.

### Authentication

**Method:** OAuth 2.0

1. **Create Google Cloud Project:**
   - Go to: `https://console.cloud.google.com/`
   - Create new project
   - Enable Gmail API: APIs & Services → Library → Gmail API

2. **Configure OAuth Consent Screen:**
   - Go to: APIs & Services → OAuth consent screen
   - Set up app name, scopes, and authorized domains

3. **Create OAuth Credentials:**
   - Go to: APIs & Services → Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add redirect URI: `https://your-flux-domain.com/api/integrations/gmail/callback`

4. **Required Credentials:**
   ```
   GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<client-secret>
   ```

5. **OAuth Flow:**
   ```
   Authorization URL: https://accounts.google.com/o/oauth2/v2/auth
   Token URL: https://oauth2.googleapis.com/token
   ```

6. **Required Scopes:**
   ```
   https://www.googleapis.com/auth/gmail.readonly     - Read emails
   https://www.googleapis.com/auth/gmail.send         - Send emails
   https://www.googleapis.com/auth/gmail.modify       - Modify (labels, etc.)
   https://www.googleapis.com/auth/userinfo.email     - Get user email
   https://www.googleapis.com/auth/userinfo.profile   - Get user profile
   ```

### API Endpoints

**Base URL:** `https://gmail.googleapis.com/gmail/v1`

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Messages | GET | `/users/me/messages` | List all messages |
| Get Message | GET | `/users/me/messages/{id}` | Get single message |
| Send Message | POST | `/users/me/messages/send` | Send email |
| List Labels | GET | `/users/me/labels` | Get all labels |
| Modify Labels | POST | `/users/me/messages/{id}/modify` | Add/remove labels |
| Watch Mailbox | POST | `/users/me/watch` | Set up push notifications |

### Request Headers

```javascript
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

### Push Notification Setup (Pub/Sub)

```javascript
// Enable real-time email notifications
POST https://gmail.googleapis.com/gmail/v1/users/me/watch
{
  "topicName": "projects/your-project/topics/gmail-notifications",
  "labelIds": ["INBOX"],
  "labelFilterAction": "include"
}
```

### Sample Implementation

```typescript
// src/lib/integrations/gmail.ts
import { google } from "googleapis";

export class GmailConnector {
  private oauth2Client;
  private gmail;

  constructor(accessToken: string, refreshToken: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
  }

  async listMessages(query: string = "", maxResults = 20) {
    const response = await this.gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    });
    return response.data.messages || [];
  }

  async getMessage(messageId: string) {
    const response = await this.gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });
    return response.data;
  }

  async convertToFluxTask(messageId: string): Promise<FluxTask> {
    const message = await this.getMessage(messageId);
    const headers = message.payload?.headers || [];
    
    const subject = headers.find(h => h.name === "Subject")?.value || "No Subject";
    const from = headers.find(h => h.name === "From")?.value || "";
    const body = this.extractBody(message.payload);

    return {
      id: `gmail-${messageId}`,
      title: subject,
      description: `From: ${from}\n\n${body}`,
      status: "todo",
      priority: "medium",
      externalId: messageId,
      source: "gmail",
    };
  }

  private extractBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, "base64").toString("utf-8");
    }
    if (payload.parts) {
      const textPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
      if (textPart?.body?.data) {
        return Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }
    return "";
  }
}
```

---

## 6. Vercel Integration

**Purpose:** Trigger deployments and view build status in real-time.

### Authentication

**Method:** Bearer Token

1. **Create Access Token:**
   - Go to: `https://vercel.com/account/tokens`
   - Click "Create" → Set scope and expiration

2. **Required Credentials:**
   ```
   VERCEL_TOKEN=<your-access-token>
   VERCEL_TEAM_ID=<team-id>  # Optional, for team deployments
   ```

### API Endpoints

**Base URL:** `https://api.vercel.com`

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| List Deployments | GET | `/v6/deployments` | Get all deployments |
| Get Deployment | GET | `/v13/deployments/{id}` | Get single deployment |
| Create Deployment | POST | `/v13/deployments` | Trigger new deployment |
| Cancel Deployment | PATCH | `/v13/deployments/{id}/cancel` | Cancel deployment |
| List Projects | GET | `/v9/projects` | List all projects |
| Get Project | GET | `/v9/projects/{idOrName}` | Get project details |

### Request Headers

```javascript
{
  "Authorization": "Bearer <vercel-token>",
  "Content-Type": "application/json"
}
```

### Webhook Setup

1. Go to: Project Settings → Git → Deploy Hooks
2. Create hook with name and branch
3. Use the generated URL to trigger deployments

```
Deploy Hook URL Format:
https://api.vercel.com/v1/integrations/deploy/{hookId}
```

### Sample Implementation

```typescript
// src/lib/integrations/vercel.ts
export class VercelConnector {
  private token: string;
  private teamId?: string;
  private baseUrl = "https://api.vercel.com";

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (this.teamId) {
      url.searchParams.set("teamId", this.teamId);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response.json();
  }

  async listDeployments(projectId?: string, limit = 20) {
    let endpoint = `/v6/deployments?limit=${limit}`;
    if (projectId) {
      endpoint += `&projectId=${projectId}`;
    }
    return this.request(endpoint);
  }

  async getDeployment(deploymentId: string) {
    return this.request(`/v13/deployments/${deploymentId}`);
  }

  async triggerDeployment(projectId: string, target = "production") {
    return this.request(`/v13/deployments`, {
      method: "POST",
      body: JSON.stringify({
        name: projectId,
        target,
        gitSource: {
          type: "github",
          ref: target === "production" ? "main" : "develop",
        },
      }),
    });
  }

  async getDeploymentStatus(deploymentId: string): Promise<FluxDeploymentStatus> {
    const deployment = await this.getDeployment(deploymentId);
    return {
      id: deployment.id,
      url: deployment.url,
      state: deployment.readyState, // QUEUED, BUILDING, READY, ERROR, CANCELED
      createdAt: deployment.createdAt,
      buildingAt: deployment.buildingAt,
      ready: deployment.ready,
    };
  }
}
```

---

## 7. Supabase Integration

**Purpose:** Manage database and authentication settings.

### Authentication

**Method:** API Keys (anon + service_role)

1. **Get Project Credentials:**
   - Go to: `https://supabase.com/dashboard`
   - Select project → Settings → API

2. **Required Credentials:**
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<anon-public-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Server-side only!
   ```

### API Endpoints

**Base URL:** `https://<project-ref>.supabase.co`

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| REST API | * | `/rest/v1/{table}` | Database operations |
| Auth | * | `/auth/v1/*` | Authentication |
| Storage | * | `/storage/v1/*` | File storage |
| Realtime | WS | `/realtime/v1/*` | Subscriptions |
| Edge Functions | POST | `/functions/v1/{function}` | Invoke functions |

### Request Headers

```javascript
// For client-side (anon key)
{
  "apikey": "<supabase-anon-key>",
  "Authorization": "Bearer <supabase-anon-key>",
  "Content-Type": "application/json",
  "Prefer": "return=representation"
}

// For server-side (service role)
{
  "apikey": "<supabase-service-role-key>",
  "Authorization": "Bearer <supabase-service-role-key>",
  "Content-Type": "application/json"
}
```

### PostgREST Query Examples

```javascript
// Get all tasks
GET /rest/v1/tasks?select=*

// Filter by status
GET /rest/v1/tasks?status=eq.in-progress

// Insert task
POST /rest/v1/tasks
{ "title": "New Task", "status": "todo" }

// Update task
PATCH /rest/v1/tasks?id=eq.123
{ "status": "done" }

// Delete task
DELETE /rest/v1/tasks?id=eq.123
```

### Sample Implementation

```typescript
// src/lib/integrations/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConnector {
  private client: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  // Auth methods
  async signInWithEmail(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async signInWithOAuth(provider: "google" | "github" | "slack") {
    return this.client.auth.signInWithOAuth({ provider });
  }

  async signOut() {
    return this.client.auth.signOut();
  }

  // Database methods
  async getTasks() {
    return this.client.from("tasks").select("*").order("created_at", { ascending: false });
  }

  async createTask(task: Partial<FluxTask>) {
    return this.client.from("tasks").insert(task).select().single();
  }

  async updateTask(id: string, updates: Partial<FluxTask>) {
    return this.client.from("tasks").update(updates).eq("id", id).select().single();
  }

  // Realtime subscriptions
  subscribeToTasks(callback: (payload: any) => void) {
    return this.client
      .channel("tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, callback)
      .subscribe();
  }
}
```

---

## 8. AWS Integration

**Purpose:** Monitor server health and cloud resources.

### Authentication

**Method:** IAM Access Keys or IAM Role (recommended for production)

1. **Create IAM User:**
   - Go to: AWS Console → IAM → Users → Add User
   - Attach policies: `CloudWatchReadOnlyAccess`, `EC2ReadOnlyAccess`, etc.

2. **Required Credentials:**
   ```
   AWS_ACCESS_KEY_ID=<access-key-id>
   AWS_SECRET_ACCESS_KEY=<secret-access-key>
   AWS_REGION=us-east-1
   ```

3. **Required IAM Permissions:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cloudwatch:GetMetricData",
           "cloudwatch:GetMetricStatistics",
           "cloudwatch:ListMetrics",
           "ec2:DescribeInstances",
           "ec2:DescribeInstanceStatus",
           "ecs:ListClusters",
           "ecs:DescribeServices",
           "rds:DescribeDBInstances",
           "lambda:ListFunctions",
           "lambda:GetFunctionConfiguration"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

### API Endpoints

AWS uses service-specific endpoints:

| Service | Endpoint Pattern |
|---------|------------------|
| CloudWatch | `monitoring.{region}.amazonaws.com` |
| EC2 | `ec2.{region}.amazonaws.com` |
| ECS | `ecs.{region}.amazonaws.com` |
| RDS | `rds.{region}.amazonaws.com` |
| Lambda | `lambda.{region}.amazonaws.com` |

### Sample Implementation

```typescript
// src/lib/integrations/aws.ts
import {
  CloudWatchClient,
  GetMetricDataCommand,
} from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

export class AWSConnector {
  private cloudwatch: CloudWatchClient;
  private ec2: EC2Client;
  private region: string;

  constructor(accessKeyId: string, secretAccessKey: string, region: string) {
    this.region = region;
    const credentials = { accessKeyId, secretAccessKey };

    this.cloudwatch = new CloudWatchClient({ region, credentials });
    this.ec2 = new EC2Client({ region, credentials });
  }

  async getEC2Instances() {
    const command = new DescribeInstancesCommand({});
    const response = await this.ec2.send(command);

    return response.Reservations?.flatMap((r) =>
      r.Instances?.map((i) => ({
        instanceId: i.InstanceId,
        state: i.State?.Name,
        type: i.InstanceType,
        launchTime: i.LaunchTime,
        publicIp: i.PublicIpAddress,
        privateIp: i.PrivateIpAddress,
        name: i.Tags?.find((t) => t.Key === "Name")?.Value,
      }))
    );
  }

  async getCPUUtilization(instanceId: string, period = 300) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 3600000); // 1 hour ago

    const command = new GetMetricDataCommand({
      StartTime: startTime,
      EndTime: endTime,
      MetricDataQueries: [
        {
          Id: "cpu",
          MetricStat: {
            Metric: {
              Namespace: "AWS/EC2",
              MetricName: "CPUUtilization",
              Dimensions: [{ Name: "InstanceId", Value: instanceId }],
            },
            Period: period,
            Stat: "Average",
          },
        },
      ],
    });

    const response = await this.cloudwatch.send(command);
    return response.MetricDataResults?.[0]?.Values || [];
  }

  async getHealthStatus(): Promise<FluxAWSHealth> {
    const instances = await this.getEC2Instances();
    const running = instances?.filter((i) => i?.state === "running").length || 0;
    const total = instances?.length || 0;

    return {
      ec2: {
        running,
        total,
        healthy: running === total,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
```

---

## Environment Variables Summary

Create a `.env.local` file with all integration credentials:

```bash
# GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Slack
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=

# Figma
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=

# Trello
TRELLO_API_KEY=
TRELLO_TOKEN=

# Google (Gmail)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Vercel
VERCEL_TOKEN=
VERCEL_TEAM_ID=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AWS
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
```

---

## Next Steps

1. **Create Integration Service Module**
   - Build unified `src/lib/integrations/index.ts` that exports all connectors

2. **Implement OAuth Flow Handler**
   - Create API routes for OAuth callbacks
   - Store tokens securely (encrypted in Supabase)

3. **Build Integration Settings UI**
   - Create settings modal for each integration
   - Show connection status and sync options

4. **Implement Webhook Handlers**
   - Create API routes for incoming webhooks
   - Process events and update Flux data accordingly

5. **Add Real-time Sync**
   - Use Supabase Realtime for live updates
   - Implement polling fallback for services without webhooks

---

**Document Footer**  
© 2025 Legacy AI, Inc. All rights reserved.

02:31:45 Dec 07, 2025

