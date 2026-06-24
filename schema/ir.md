# aqa-runner IR Schema v2 (Authoritative)

`cases.compiled.yaml` is the **only** input `aqa-runner` executes. It is the
deterministic, LLM-free compilation of an `aqa-inspect` `cases.yaml`, produced
by recording a successful live run in `claude-toolkit`. This file is the
authoritative contract; the `claude-toolkit` compile step targets it.

## Top level

```yaml
ir_version: 2            # required; runner accepts 1 or 2
name: "Login"            # required
description: "..."       # optional
cases: [ ... ]           # required, non-empty
```

> **v1 → v2:** v2 drops the per-case `expected_result` field. A case now encodes
> its full expectation in its `assert` steps — including negative scenarios
> (e.g. assert a Create button is `disabled` when a required field is empty). A
> case passes when all of its steps and asserts pass, and fails when any throws.
> v1 files still load; a leftover `expected_result` is ignored (no longer
> inverts the verdict).

## Per case

| Field | Required | Meaning |
|---|---|---|
| `case_id` | yes | stable slug, e.g. `login-001` |
| `name` | yes | human title (results.csv `name`) |
| `steps` | yes | ordered list of ops |
| `cleanup` | optional | list, e.g. `- type: clear_cookies` (default applied: new context per case) |

## Steps (finite op set)

Every step has an `op`. No natural-language `action` field is permitted
(its presence marks an uncompiled file → reject).

| op | fields | Playwright effect |
|---|---|---|
| `goto` | `url` | `page.goto(url)` |
| `fill` | `selector`, (`value` \| `value_ref`) | `locator.fill(value)` |
| `click` | `selector` | `locator.click()` |
| `select` | `selector`, `value` | `locator.selectOption(value)` |
| `check` | `selector`, `checked?` (default true) | `locator.check()`/`uncheck()` |
| `hover` | `selector` | `locator.hover()` |
| `press` | `selector?`, `key` | `locator.press(key)` or `page.keyboard.press(key)` |
| `assert` | `assert` | see assert types |

## Assert types (finite)

| `assert.type` | extra fields | passes when |
|---|---|---|
| `visible` | `selector` | element visible |
| `hidden` | `selector` | element hidden/absent |
| `text_contains` | `selector`, `expected` | element text contains `expected` |
| `url_matches` | `expected` (substring or /regex/) | page URL matches |
| `enabled` | `selector` | element enabled |
| `disabled` | `selector` | element disabled |
| `value_equals` | `selector`, `expected` | input value equals `expected` |
| `count` | `selector`, `expected` (int) | locator resolves exactly `expected` elements |

## Selector descriptor

```yaml
selector:
  strategy: role        # role | label | text | css
  role: button          # strategy=role → role + name
  name: "Sign in"
  # label: "Email"      # strategy=label
  # text: "Dashboard"   # strategy=text
  # css: ".primary"     # strategy=css
```

Preference order when compiling: `role`+`name` > `label` > `text` > `css`.

## Secrets

A step with `sensitive: true` carries `value_ref: "<key>"` instead of `value`.
At run time the runner reads `<key>` from `secrets.env` (KEY=VALUE lines) and
masks the value as `****` everywhere. Secret values are never stored in the IR.
