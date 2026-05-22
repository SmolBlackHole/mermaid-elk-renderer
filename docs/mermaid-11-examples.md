# Mermaid 11 example renders

Back to the main guide: [README](../README.md)

> [!info] What this page is for
> This page is a small showcase you can open in Obsidian or on GitHub when you want to demonstrate what the bundled Mermaid 11 renderer unlocks.
> [!important] This page exists because of the bundled Mermaid 11 toggle
> When **Use bundled Mermaid 11** is enabled, the plugin loads Mermaid `11.15.0` from the plugin instead of Obsidian's older bundled Mermaid.
> That is why these examples are worth showing off in the first place.
> Official Mermaid docs: [Mermaid introduction](https://mermaid.js.org/intro/)
> [!tip] Best way to view it
> The images on this page are prerendered for GitHub and plain Markdown viewers.
> To render the source snippets live in Obsidian, enable **Use bundled Mermaid 11** and keep the `%% elk %%` marker in the snippet.

## Architecture diagram

<!-- markdownlint-disable MD033 -->
<details>
<summary>Open architecture example</summary>

![Prerendered architecture diagram](../assets/prerendered/showcase-architecture.svg)

````markdown
```mermaid
%% elk %%
architecture-beta
    group api(cloud)[API]

    service web(server)[Web] in api
    service db(database)[Database] in api
    service cache(disk)[Cache] in api

    web:R -- L:db
    cache:T -- B:web
```
````

</details>

## XY chart

<details>
<summary>Open XY chart example</summary>

![Prerendered XY chart](../assets/prerendered/showcase-xychart.svg)

````markdown
```mermaid
---
config:
    xyChart:
        width: 700
        height: 420
---
%% elk %%
xychart-beta
    title "Release activity"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "Merged PRs" 0 --> 20
    bar [4, 7, 9, 14, 18, 16]
    line [3, 5, 8, 11, 15, 19]
```
````

</details>

## Treemap diagram

<details>
<summary>Open treemap example</summary>

![Prerendered treemap diagram](../assets/prerendered/showcase-treemap.svg)

````markdown
```mermaid
%% elk %%
treemap-beta
"Plugin Work"
    "Renderer": 35
    "Settings": 20
    "Docs": 18
    "Tests": 12
    "Release": 15
```
````

</details>

## Packet diagram

<details>
<summary>Open packet example</summary>

![Prerendered packet diagram](../assets/prerendered/showcase-packet.svg)

````markdown
```mermaid
---
title: "UDP Packet"
---
%% elk %%
packet
0-15: "Source Port"
16-31: "Destination Port"
32-47: "Length"
48-63: "Checksum"
64-95: "Data"
```
````

</details>

## Radar diagram

<details>
<summary>Open radar example</summary>

![Prerendered radar diagram](../assets/prerendered/showcase-radar.svg)

````markdown
```mermaid
---
title: "Grades"
---
%% elk %%
radar-beta
  axis m["Math"], s["Science"], e["English"]
  axis h["History"], g["Geography"], a["Art"]
  curve alice["Alice"]{85, 90, 80, 70, 75, 90}
  curve bob["Bob"]{70, 75, 85, 80, 90, 85}
  max 100
  min 0
```
````

</details>
<!-- markdownlint-enable MD033 -->

## Notes

- These are prerendered images for portability. GitHub can display the screenshots even when it cannot run the plugin-specific Mermaid path.
- The source snippets above keep `%% elk %%` on purpose because your plugin currently routes bundled Mermaid 11 through the marker path.
- Some of these diagram types are newer Mermaid 11 additions and may not work with Obsidian's older bundled Mermaid renderer.
- Official Mermaid docs: [Mermaid introduction](https://mermaid.js.org/intro/)
