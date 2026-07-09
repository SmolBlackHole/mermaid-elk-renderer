# Mermaid 11.16: Charts

> [!info] This file is best viewed with **Mermaid ELK Renderer** installed and enabled.
> `xychart-beta` needs **Use bundled Mermaid 11**. `pie` works with stock Obsidian Mermaid.

## Pie with showData (new)

`pie` does not support `layout`. Use `config:` only for `look` and `theme`:

```mermaid
---
config:
  look: handDrawn
---
pie showData
    title Project Time Distribution
    "Planning" : 20
    "Development" : 45
    "Testing" : 25
    "Deployment" : 10
```

```mermaid
pie showData
    title CSS Frameworks
    "Tailwind" : 55
    "Bootstrap" : 25
    "Vanilla CSS" : 15
    "Other" : 5
```

---

## XYChart (beta)

```mermaid
---
config:
  theme: neutral
---
xychart-beta
    title "Monthly Signups"
    x-axis [ "Jan", "Feb", "Mar", "Apr", "May", "Jun" ]
    y-axis "Signups" 0 --> 500
    line [120, 210, 180, 290, 340, 410]
```

```mermaid
xychart-beta
    title "Support Tickets 2026"
    x-axis [ "Jan", "Feb", "Mar", "Apr", "May", "Jun" ]
    y-axis "Tickets" 0 --> 100
    bar [45, 52, 38, 61, 55, 42]
    line [30, 35, 28, 40, 38, 32]
```

`xychart-beta` is not a graph. `layout` is ignored, so the `%% elk %%` marker has no effect here.
