# Mermaid 11.16: ER, State, Architecture, Gantt, TreeView

> [!info] This file is best viewed with **Mermaid ELK Renderer** installed and enabled.
> `treeView-beta` needs **Use bundled Mermaid 11**. `erDiagram`, `stateDiagram`, `architecture-beta`, and `gantt` work with stock Obsidian Mermaid.

## ER diagram with optional attribute types (new)

Without `config:` (Mermaid uses dagre by default):

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        int id PK
        string name
        string? email
        string? phone
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int id PK
        date orderedAt
        string? shippingAddress
    }
    LINE-ITEM {
        int id PK
        int quantity
        float? discount
    }
```

With `config:` for elk layout and handDrawn look:

```mermaid
---
config:
  layout: elk
  look: handDrawn
  theme: neutral
---
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        int id PK
        string name
        string? email
        string? phone
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int id PK
        date orderedAt
        string? shippingAddress
    }
    LINE-ITEM {
        int id PK
        int quantity
        float? discount
    }
```

`config: layout: elk` works on all graph based types: `flowchart`, `classDiagram`, `erDiagram`, `stateDiagram`, `block-beta`.

---

## State diagram: dagre vs. elk

### dagre (default)

```mermaid
---
config:
  layout: dagre
---
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : event
    Processing --> Success : ok
    Processing --> Error : fail
    Error --> Idle : retry
    Success --> Idle : next
    Processing --> Processing : retry
```

### elk

```mermaid
---
config:
  layout: elk
---
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : event
    Processing --> Success : ok
    Processing --> Error : fail
    Error --> Idle : retry
    Success --> Idle : next
    Processing --> Processing : retry
```

---

## Architecture diagram with groups and services (new)

```mermaid
---
config:
  look: handDrawn
---
architecture-beta
    group frontend(server)[Frontend]
    group backend(server)[Backend]
    group data(disk)[Data]

    service web(server)[Web App] in frontend
    service mobile(server)[Mobile] in frontend
    service api(server)[API Gateway] in backend
    service auth(server)[Auth] in backend
    service worker(server)[Worker] in backend
    service db(disk)[PostgreSQL] in data
    service cache(disk)[Redis] in data

    web:R --> L:api
    mobile:R --> L:api
    api:R --> L:auth
    api:T --> B:worker
    worker:R --> L:db
    worker:R --> L:cache
```

`architecture-beta` is not a graph. `layout` has no effect, only `look` and `theme`.

---

## Gantt with multiple excludes (new)

```mermaid
---
config:
  theme: forest
---
gantt
    title Sprint Planning Q3
    dateFormat  YYYY-MM-DD

    section Backend
    API Design           :a1, 2026-07-01, 5d
    Database Migration   :a2, after a1, 4d
    Auth Refactoring     :a3, after a2, 5d

    section Frontend
    Component Library    :b1, 2026-07-03, 6d
    Dashboard            :b2, after b1, 5d
    E2E Tests            :b3, after b2, 3d

    excludes 2026-07-04, 2026-07-05
    excludes 2026-07-11, 2026-07-12
```

`gantt` does not support `layout`. `config:` is only useful for `look` and `theme`.

---

## TreeView: file and directory structure (new)

```mermaid
treeView-beta
root((mermaid-elk-renderer))
    src/
        main.ts
        settings.ts
        settings-data.ts
        renderer.ts
        renderer-patch.ts
        mermaid-provider.ts
        mermaid-types.ts
        logger.ts
        preview-refresh.ts
    tests/
        renderer.test.ts
        settings-data.test.ts
    package.json
    esbuild.config.mjs
    tsconfig.json
    README.md
```

Indentation defines the tree. Trailing `/` marks a directory. File extensions auto detect icons. Requires bundled Mermaid 11.
