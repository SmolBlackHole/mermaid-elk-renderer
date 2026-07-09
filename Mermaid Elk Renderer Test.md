---
tags: [test]
date: 09.07.2026
---

# Mermaid Elk Renderer Test

Test cases for the Mermaid Elk Renderer plugin combined with Mermaid's built-in
mindmap renderer. Covers hierarchy depth, branching width, node shapes,
markdown in labels, icons, classes, and the layout config override behaviour.

## Important: plugin interaction

The `mermaid-elk-renderer` plugin overwrites each `layout:` value in YAML
frontmatter with `layout: "elk"` as long as `overrideExistingLayout` is
`true`, which is the default. Mermaid mindmaps support their own layout
algorithms like `tidy-tree`. Without the `%% elk %%` marker, and with
`applyElkToAllDiagrams` off, the plugin leaves the diagram alone.

To keep `layout: tidy-tree` on a mindmap, turn off **Override existing
layout** in plugin settings, or omit the `%% elk %%` marker.

### With `%% elk %%` marker → `layout: "elk"` (plugin active)

```mermaid
%% elk %%
---
config:
  layout: tidy-tree
---
mindmap
root((Root))
  A
  B
  C
```

### Without marker → `layout: tidy-tree` preserved (plugin inactive)

```mermaid
---
config:
  layout: tidy-tree
---
mindmap
root((Root))
  A
  B
  C
```

### Without frontmatter → plugin inactive, Mermaid default layout

```mermaid
mindmap
root((Root))
  A
  B
  C
```

## Basic: simple hierarchy (Mermaid default)

```mermaid
mindmap
root((Root))
  A
  B
  C
```

## Two levels

```mermaid
mindmap
root((Root))
  A
    A1
    A2
  B
    B1
    B2
```

## Deep nesting (4 levels)

```mermaid
mindmap
root((Root))
  A
    A1
      A1a
        A1a-i
      A1b
    A2
  B
```

## Wide branching (10 children)

```mermaid
mindmap
root((Center))
  One
  Two
  Three
  Four
  Five
  Six
  Seven
  Eight
  Nine
  Ten
```

## Different node shapes

```mermaid
mindmap
root((Root))
  id[Rectangle]
  id2(Rounded box)
  id3((Circle))
  id4))Cloud((
  id5)Bang(
  id6{{Hexagon}}
  id7[/Parallelogram/]
  id8[\Parallelogram alt\]
```

## Mixed shapes with children

```mermaid
mindmap
root((Root))
  A[Rectangle]
    A1((Circle child))
    A2[Rectangle child]
      A2a(Rounded grandchild)
```

## Long text and line breaks

```mermaid
mindmap
root((Main topic))
  This is a very long node label that needs to wrap
  Short
  Also a longer text<br>with manual break
    Another child with lots of text content for testing
      Deeply nested with a long label that may become multi-line
```

## Icons and emoji

```mermaid
mindmap
root((Root))
  ::icon(fa fa-book)
  📚 Reading
  ::icon(fa fa-gear)
  ⚙️ Settings
  ::icon(fa fa-user)
  👤 Profile
```

## Class syntax

```mermaid
mindmap
root((Root))
  A
  :::urgent
  B
  :::done
  C
```

## Markdown in labels

```mermaid
mindmap
root((**Bold**))
  *Italic*
  `Code`
  ~~Strikethrough~~
  **Bold** and *Italic*
```

## Empty subtrees and single children

```mermaid
mindmap
root((Root))
  A
  B
    B1
  C
```

## Maximum test structure (everything combined)

```mermaid
mindmap
root((Elk Renderer Test))
  Simple nodes
    Short
    Long text with breaks<br>on the second line
  Shapes
    [Rectangle]
      Child
    (Rounded)
      Child
    ((Double circle))
    ))Cloud((
    )Bang(
    {{Hexagon}}
  Depth
    Level 2
      Level 3
        Level 4
          Level 5
  Width
    Child 1
    Child 2
    Child 3
    Child 4
    Child 5
    Child 6
    Child 7
    Child 8
  ::icon(fa fa-star)
  Icon branch
    Icon child
  :::urgent
  Class branch
    Class child
```

## Maximum test structure with tidy-tree layout (without `%% elk %%`)

```mermaid
---
config:
  layout: tidy-tree
---
mindmap
root((Elk Renderer Test))
  Simple nodes
    Short
    Long text with breaks<br>on the second line
  Shapes
    [Rectangle]
      Child
    (Rounded)
      Child
    ((Double circle))
    ))Cloud((
    )Bang(
    {{Hexagon}}
  Depth
    Level 2
      Level 3
        Level 4
          Level 5
  Width
    Child 1
    Child 2
    Child 3
    Child 4
    Child 5
    Child 6
    Child 7
    Child 8
  ::icon(fa fa-star)
  Icon branch
    Icon child
  :::urgent
  Class branch
    Class child
```

## Same as above with tidy-tree layout (with `%% elk %%`)

```mermaid
%% elk %%
---
config:
  layout: tidy-tree
---
mindmap
root((Elk Renderer Test))
  Simple nodes
    Short
    Long text with breaks<br>on the second line
  Shapes
    [Rectangle]
      Child
    (Rounded)
      Child
    ((Double circle))
    ))Cloud((
    )Bang(
    {{Hexagon}}
  Depth
    Level 2
      Level 3
        Level 4
          Level 5
  Width
    Child 1
    Child 2
    Child 3
    Child 4
    Child 5
    Child 6
    Child 7
    Child 8
  ::icon(fa fa-star)
  Icon branch
    Icon child
  :::urgent
  Class branch
    Class child
```
