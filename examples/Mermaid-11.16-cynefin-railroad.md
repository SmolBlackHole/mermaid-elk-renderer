# Mermaid 11.16: Cynefin & Railroad

> [!info] This file is best viewed with **Mermaid ELK Renderer** installed and **Use bundled Mermaid 11** enabled.
> `cynefin-beta` and all `railroad-*` types are only available in the bundled Mermaid 11.16 runtime.

## Cynefin Framework (new, beta)

```mermaid
---
config:
  look: handDrawn
  theme: base
---
cynefin-beta
    title Cynefin Framework

    clear
        "Best practice: Sense, Categorize, Respond"
        "Known knowns, no expertise required"

    complicated
        "Good practice: Sense, Analyze, Respond"
        "Known unknowns, expert diagnosis needed"

    complex
        "Emergence: Probe, Sense, Respond"
        "Unknown unknowns, experiment driven"

    chaotic
        "Novel practice: Act, Sense, Respond"
        "Unknowable, immediate stabilization first"

    confusion
        "Triage: Diagnose, move to proper domain"
        "Default state when domain is unclear"
```

Items are quoted strings inside a domain block. Domain subtitles like "Best practice" are auto generated. `practice` and `descr` are not user writable fields.

---

## Railroad Diagram (new, beta)

### IR syntax (railroad-beta)

```mermaid
railroad-beta
    title REST API Routes
    route = sequence(
        optional(choice(
            terminal("GET"),
            terminal("POST"),
            terminal("PUT"),
            terminal("DELETE"))),
        terminal("/api/"),
        oneOrMore(nonterminal("resource")),
        optional(sequence(
            terminal("/"),
            nonterminal("id"))));
```

Constructor names are lowercase: `terminal()`, `nonterminal()`, `sequence()`, `choice()`, `optional()`, `oneOrMore()`, `zeroOrMore()`.

### EBNF syntax (railroad-ebnf-beta)

```mermaid
railroad-ebnf-beta
    title Arithmetic Grammar
    expr = term { ("+" | "-") term };
    term = factor { ("*" | "/") factor };
    factor = number | "(" expr ")";
    number = digit { digit };
    digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
```

Rules end with `;`. The `{ }` brackets mean zero or more repetitions (ISO 14977 style). Use `|` for alternatives, `(` `)` for grouping.

### PEG syntax (railroad-peg-beta)

```mermaid
railroad-peg-beta
    title PEG Calculator
    Expr <- Sum;
    Sum <- Product (("+" / "-") Product)*;
    Product <- Value (("*" / "/") Value)*;
    Value <- Number / "(" Expr ")";
    Number <- "0" / "1" / "2" / "3" / "4" / "5" / "6" / "7" / "8" / "9" / (Digit Digit?);
```

PEG uses `<-` for rule definition, `/` for ordered choice, and `;` to end each rule. Character classes like `[0-9]` are not supported. Define digit alternatives explicitly.

### ABNF syntax (railroad-abnf-beta)

```mermaid
railroad-abnf-beta
    title URI
    URI = scheme ":" hier-part [ "?" query ] [ "#" fragment ];
    scheme = 1*( ALPHA / DIGIT / "+" / "-" / "." );
```

ABNF uses `=` for definition, `/` for alternation, and `;` to end each rule.
