# Layout comparison: dagre vs. elk

> [!info] This file is best viewed with **Mermaid ELK Renderer** installed and enabled.
> `flowchart` and `stateDiagram` work without bundled Mermaid. For beta diagram types on other example pages, enable **Use bundled Mermaid 11**.

`config: layout:` works for **graph based diagram types**: `flowchart`, `classDiagram`, `erDiagram`, `stateDiagram`, `block-beta`.
Non graph types (`pie`, `gantt`, `xychart`, `sequence`, `mindmap`, `architecture`) ignore `layout`.

---

## dagre (Obsidian default)

```mermaid
---
config:
  layout: dagre
  look: handDrawn
---
flowchart TD
    A[Start] --> B{Login?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Register]
    C --> E[Profile]
    C --> F[Settings]
    C --> G[Logout]
    D --> H[Confirm email]
    H --> B
    E --> I[Edit data]
    F --> I
    I --> E
    I --> F
    G --> A
```

---

## elk (explicit config)

```mermaid
---
config:
  layout: elk
  look: handDrawn
---
flowchart TD
    A[Start] --> B{Login?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Register]
    C --> E[Profile]
    C --> F[Settings]
    C --> G[Logout]
    D --> H[Confirm email]
    H --> B
    E --> I[Edit data]
    F --> I
    I --> E
    I --> F
    G --> A
```

---

## elk (via plugin marker)

Instead of an explicit `config:` block, use the `%% elk %%` marker. The plugin then injects `layout: "elk"` automatically:

```mermaid
%% elk %%
flowchart TD
    A[Start] --> B{Login?}
    B -->|Yes| C[Dashboard]
    B -->|No| D[Register]
    C --> E[Profile]
    C --> F[Settings]
    C --> G[Logout]
    D --> H[Confirm email]
    H --> B
    E --> I[Edit data]
    F --> I
    I --> E
    I --> F
    G --> A
```

---

## Complex microservice graph

dagre falls apart on dense cross connected graphs. Elk handles them fine.

```mermaid
---
config:
  layout: elk
---
flowchart LR
    UI[Web UI] --> API
    Mobile[Mobile App] --> API
    CLI[CLI Tool] --> API
    API --> Auth[Auth Service]
    API --> Orders[Order Service]
    API --> Inventory[Inventory]
    Auth --> DB[(PostgreSQL)]
    Auth --> Cache[(Redis)]
    Orders --> DB
    Orders --> MQ[RabbitMQ]
    Inventory --> DB
    Inventory --> Cache
    MQ --> Worker[Background Worker]
    Worker --> DB
    Worker --> S3[(S3 Storage)]
    Worker --> Mail[Mail Service]
    Orders --> Mail
    Auth --> Mail
```

Same example with dagre (the Obsidian default):

```mermaid
flowchart LR
    UI[Web UI] --> API
    Mobile[Mobile App] --> API
    CLI[CLI Tool] --> API
    API --> Auth[Auth Service]
    API --> Orders[Order Service]
    API --> Inventory[Inventory]
    Auth --> DB[(PostgreSQL)]
    Auth --> Cache[(Redis)]
    Orders --> DB
    Orders --> MQ[RabbitMQ]
    Inventory --> DB
    Inventory --> Cache
    MQ --> Worker[Background Worker]
    Worker --> DB
    Worker --> S3[(S3 Storage)]
    Worker --> Mail[Mail Service]
    Orders --> Mail
    Auth --> Mail
```
