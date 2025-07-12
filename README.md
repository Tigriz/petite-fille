<img align="left" width="128" height="128" src="./icon.webp" alt="" />

# ​ Petite Fille

​ [![Bun](https://img.shields.io/badge/Bun-000?style=solid&logo=bun&logoColor=fff)](https://bun.sh/) [![TypeScript](https://img.shields.io/badge/Typescript-%23007ACC.svg?style=solid&logo=typescript&logoColor=fff)](https://www.typescriptlang.org)

<br>

## Configuration

You can edit the regular expressions that trigger notifications in `config.json`.

### Multi-Config Support

The application now supports multiple ntfy configurations. Each config can have its own filters and blacklist rules. The config file is a flat array:

```json
[
  {
    "name": "default",
    "url": "https://ntfy.sh",
    "topic": "your-topic-here",
    "auth": { "type": "none" },
    "filters": {
      "content": ["tigr", "igri"],
      "author": ["admin"],
      "topic": ["announcements"]
    },
    "blacklist": {
      "content": ["spam"],
      "author": ["bot"],
      "topic": ["off-topic"]
    }
  },
  {
    "name": "private",
    "url": "https://ntfy.sh",
    "topic": "your-private-topic",
    "auth": { "type": "token", "token": "tk_yourtokenhere" },
    "filters": {
      "content": ["urgent"],
      "author": ["moderator"],
      "topic": ["news"]
    },
    "blacklist": {
      "content": ["advertisement"],
      "author": ["spammer"],
      "topic": ["junk"]
    }
  }
]
```

**Authentication Types:**
- `"none"`: No authentication (public topics)
- `"token"`: Bearer token authentication
- `"basic"`: Username/password authentication

**Note:** Each config's `filters` and `blacklist` are applied independently. A notification is sent to a config only if it matches its filters and is not blocked by its blacklist.

### Environment Variables

The application requires these environment variables. Copy `.env.example` to `.env` and configure:

- `WS_URL`: WebSocket URL for the village.cx connection (required)
- `BASE_URL`: Base URL for the village.cx site (optional, defaults to "https://village.cx")
- `LOCALE`: Language locale (optional, defaults to "en")

## Running

### Normie

`ntfy access user "user-*" rw`

Ask your favorite LLM how to install the tools to make it run on your operating system.  
Paste your errors, give him information about your system and it will go fine.

### Bun
You will need [Bun](https://bun.sh/)
```bash
bun i
cp .env.example .env
# Edit .env with your settings
bun run start
```

### Using Docker
You will need [Docker](https://docker.com/).
```bash
make docker-build
make docker-run
```

### Todos

- Advanced filters (functions)