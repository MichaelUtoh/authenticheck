# AuthentiCheck – Investigations API Requirements

Backend requirements for the frontend **Investigations** tab: the cases list, the flags list, and the case detail page (linked flags, read-only check events, notes, outcome, close). It lists everything the current API does not yet cover, measured against `ENDPOINT_REFERENCE.md`.

Companion docs: `PRODUCTS_API_REQUIREMENTS.md` and `BATCHES_CODES_API_REQUIREMENTS.md`.

**Legend**

- **Required**: the frontend cannot ship the feature without it.
- **Optional**: improves the experience or can be faked on the client for now. The "Without it" note says what the frontend does instead.
- **Decision**: a product or policy choice the backend needs answered first. Collected in [section 10](#10-open-decisions).

**Caveat on "exists today".** `API_CONTRACTS.md` is not in the frontend repo. "Today" is based on `ENDPOINT_REFERENCE.md` and the frontend types (`RiskFlag`: `id, severity, kind, is_reviewed, created_at`; `RiskCase`: `id, title, description, status, batch_id?, product_id?, created_at`). If the contracts already cover an item, strike it.

**Error format.** All new errors use the existing envelope `{ "error": { "code", "message", "details", "request_id" } }`. Codes introduced here are listed in [section 11](#11-error-codes-introduced).

**Times.** ISO 8601 UTC everywhere; the frontend renders WAT.

---

## 1. Privacy rules (apply to every endpoint)

**Required.** These come from the approved design and must hold server-side, not just in the UI.

- **Flags, cases, notes and check events are internal.** They must never appear in `GET /verify/{code}` or any other public endpoint. A flag is *a lead for review, not proof of counterfeiting.*
- **Never expose who checked a code.** Check events carry no user, device, IP address, phone number or precise location. Region is coarse (state level) and for internal review only.
- **Codes are masked** in case and flag payloads (`7KQ2-…-4PRT`) unless the caller's role is allowed to see full codes (Decision 9).
- Notes and outcome summaries are free text written by staff. The UI warns users not to enter personal data; a server-side soft check for phone numbers and emails is **Optional**.

---

## 2. Gap summary

| # | Capability | Exists today | Priority |
|---|---|---|---|
| 1 | Flag fields for display: reference, rule label, scope, product, batch, state, case link | `id`, `severity`, `kind`, `is_reviewed`, `created_at` | **Required** |
| 2 | Flag lifecycle: `new`, `reviewing`, `in_case`, `reviewed` | `is_reviewed` boolean | **Required** |
| 3 | Case fields: reference, severity, scope, owner, linked flags, outcome, timestamps | `id`, `title`, `description`, `status`, `batch_id`, `product_id` | **Required** |
| 4 | Open a case from a flag (and link flags to cases) | `POST /risk/cases` (body unknown) | **Required** |
| 5 | Case owner assignment | none | **Required** |
| 6 | Append-only case notes | `PATCH` "status or notes" (looks like one field) | **Required** |
| 7 | Read-only check events per case | none | **Required** |
| 8 | Outcome (kind + summary) and close rules | none | **Required** |
| 9 | Reopen a closed case | none | **Required** (Decision) |
| 10 | Server-side effects: closing a case marks flags reviewed | none | **Required** |
| 11 | List filters and search for flags and cases | flags: `kind`, `severity`, `is_reviewed` only | **Required** |
| 12 | Summary counts for KPIs and the sidebar badge | `/analytics/risk` (shape unknown) | Optional |
| 13 | Audit trail: writes | platform audit only | **Required** |
| 14 | Case history: read endpoint | none | Optional |
| 15 | Add or remove flags on an existing case | none | Optional |
| 16 | Flag rule catalogue | none | Optional |
| 17 | Linked actions (deactivation request, recall) on an outcome | none | Optional |
| 18 | Notifications and webhook events | webhook endpoints exist, event list unknown | Optional |
| 19 | Roles for investigators | `owner`, `admin` | **Required** (Decision) |

---

## 3. Flags

### 3.1 Flag fields

`R` = required. `O` = optional.

| Field | Type | R/O | Notes |
|---|---|---|---|
| `id` | uuid | server | |
| `reference` | string | R | human-readable `FLG-0142`, unique per tenant, sequential |
| `kind` | string | R | existing. Machine key, e.g. `repeat_after_first_sale` |
| `rule_label` | string | R | display text, e.g. "Repeat checks after first sale". Frontend must not hard-code the rule list |
| `severity` | enum | R | existing type has `low`, `medium`, `high`, `critical`; the design shows only the first three. **Decision 1** |
| `scope` | object | R | `{ "type": "code" \| "batch", "code_masked"?: "7KQ2-…-4PRT", "batch_id"?: uuid, "batch_number"?: "EN-2407-092" }` |
| `product_id`, `product_name` | | R | name + variant + size, denormalised so the table needs no extra calls |
| `batch_id`, `batch_number` | | R | |
| `state` | enum | R | `new`, `reviewing`, `in_case`, `reviewed`. Replaces `is_reviewed` (keep it as a derived boolean for compatibility) |
| `case_id`, `case_reference` | uuid, string | R (nullable) | set when `state = in_case`, and kept after the case closes |
| `created_at` | ISO 8601 | existing | frontend renders age ("2 h", "3 d") |
| `reviewed_at`, `reviewed_by`, `review_note` | | server | set by review |
| `source` | enum | O | `rule`, `consumer_report` (see [section 3.4](#34-consumer-reports)) |

### 3.2 Endpoints

| Method | Path | Auth | State | R/O | Purpose |
|---|---|---|---|---|---|
| `GET` | `/risk/flags` | 🏢 | Existing, extend | **R** | Filters below |
| `GET` | `/risk/flags/{id}` | 🏢 | New | O | Detail (frontend lists only, but useful for deep links) |
| `POST` | `/risk/flags/{id}/review` | 👑 / investigator | Existing, extend | **R** | Mark reviewed; accept optional `{ "note": "..." }`; sets `state = reviewed` |
| `POST` | `/risk/flags/{id}/reopen` | 👑 / investigator | New | O | Reviewed → `new`. Without it, reviewed is final |

**`GET /risk/flags` filters — Required:**

| Param | Type | Notes |
|---|---|---|
| `severity` | enum, repeatable | existing |
| `state` | enum, repeatable | default `new,reviewing,in_case` (the list hides reviewed unless asked: the UI has an "Include reviewed" toggle) |
| `kind` | string | existing |
| `has_case` | bool | `false` = "Flags without a case" KPI |
| `q` | string | matches reference, rule label, product name, masked code |
| `ordering` | string | `-created_at` (default), `severity` |
| `page`, `page_size` | int | existing envelope |

### 3.3 State rules — Required

```
new ──review──► reviewed
new ──(open case)──► in_case ──(case closed/resolved)──► reviewed
new ──(start review)──► reviewing ──► in_case | reviewed
in_case ──(case reopened)──► in_case
```

- `reviewing` means someone has looked but not yet decided. **Decision 2:** set it explicitly (`POST .../start-review`) or implicitly on first view? The design shows the status, not how it is reached.
- A flag belongs to **at most one open case** (Decision 3).
- A reviewed flag keeps its `case_id` for traceability.

### 3.4 Consumer reports

Some flags come from `POST /reports` (public): "Consumer report: seal broken". **Decision 4:** report categories (enum), and whether the reporter's contact details are stored. If stored, they must **never** appear in flag, case or check-event payloads. Optional: `source: "consumer_report"` and `report_category` on the flag.

---

## 4. Cases

### 4.1 Case fields

| Field | Type | R/O | Notes |
|---|---|---|---|
| `id` | uuid | server | |
| `reference` | string | R | `CASE-0031`, unique per tenant, sequential |
| `title` | string | R | existing. Defaults to the first flag's rule label; editable |
| `description` | string | O | existing. Shown as the summary paragraph |
| `status` | enum | R | existing type: `open`, `investigating`, `resolved`, `closed` |
| `severity` | enum | server | highest severity among linked flags |
| `product_id`, `product_name`, `batch_id`, `batch_number` | | R | `batch_id`/`product_id` exist as optional; make them required when created from a flag |
| `scope` | object | R | same shape as the flag scope |
| `owner` | `{ id, name }` \| null | R (nullable) | `null` = "Unassigned" |
| `flag_ids` / `flags` | array | R | linked flags, see [section 3.1](#31-flag-fields) |
| `outcome` | object \| null | R | see [section 6](#6-outcome-and-closing) |
| `opened_at`, `opened_by` | | server | |
| `updated_at` | ISO 8601 | server | any status, owner, note or outcome change |
| `closed_at`, `closed_by` | | server | |
| `note_count` | int | O | for the list |

### 4.2 Endpoints

| Method | Path | Auth | State | R/O | Purpose |
|---|---|---|---|---|---|
| `GET` | `/risk/cases` | 🏢 | Existing, extend | **R** | Filters below |
| `POST` | `/risk/cases` | 👑 / investigator | Existing, extend | **R** | Open a case, see [section 4.3](#43-open-a-case--required) |
| `GET` | `/risk/cases/{id}` | 🏢 | Existing, extend | **R** | Full detail with linked flags, notes count, outcome |
| `PATCH` | `/risk/cases/{id}` | 👑 / investigator | Existing, extend | **R** | `title`, `description`, `status`, `owner_id`, `outcome` |
| `POST` | `/risk/cases/{id}/close` | 👑 / investigator | New | **R** | Close with validation ([section 6](#6-outcome-and-closing)) |
| `POST` | `/risk/cases/{id}/reopen` | 👑 / investigator | New | **R** | Reopen |
| `GET` | `/risk/cases/{id}/notes` | 🏢 | New | **R** | List notes |
| `POST` | `/risk/cases/{id}/notes` | 👑 / investigator | New | **R** | Add a note |
| `GET` | `/risk/cases/{id}/events` | 🏢 | New | **R** | Check events, read-only ([section 5](#5-check-events)) |
| `POST` | `/risk/cases/{id}/flags` | 👑 / investigator | New | O | Link another flag. Body `{ "flag_id" }` |
| `DELETE` | `/risk/cases/{id}/flags/{flag_id}` | 👑 / investigator | New | O | Unlink (flag returns to `new`) |
| `GET` | `/risk/cases/{id}/history` | 🏢 | New | O | Audit trail for the Activity view |
| `GET` | `/risk/rules` | 🏢 | New | O | Flag rule catalogue ([section 8](#8-metadata-and-counts)) |

**`GET /risk/cases` filters — Required:**

| Param | Type | Notes |
|---|---|---|
| `status` | enum, repeatable | default `open,investigating`. Add a `state=active` shortcut if preferred |
| `owner_id` | uuid \| `unassigned` | |
| `severity` | enum, repeatable | |
| `product_id`, `batch_id` | uuid | |
| `q` | string | matches reference, title, product name, masked code |
| `ordering` | string | `-updated_at` (default), `-opened_at`, `severity` |
| `page`, `page_size` | int | existing envelope |

Each list row needs `reference`, `title`, `scope`, `product_name`, `severity`, `status`, `owner`, `opened_at`, `updated_at`, `flag_count`. Age is derived by the frontend from `opened_at`.

### 4.3 Open a case — Required

`POST /risk/cases` from a flag ("Open case" button):

```json
{ "flag_ids": ["<flag uuid>"], "title": "Repeat checks after first sale", "owner_id": null }
```

- `flag_ids`: one or more flags. All must be `new` or `reviewing` and not already in an open case (`409 flag_already_in_case`).
- `title` is optional (default: first flag's rule label). `batch_id`, `product_id`, `scope` and `severity` are copied from the flags.
- Side effects, atomically: linked flags → `in_case`; case `status = open`; audit entry; optionally an initial system note "Case opened from FLG-0142".
- Returns `201` with the full case, so the frontend can go straight to the detail page.

### 4.4 Status and owner rules — Required

| Rule | Detail |
|---|---|
| Statuses | `open` (new, nobody working), `investigating` (owner working), `resolved` (outcome recorded), `closed` (done) |
| Owner | must be an active member of the tenant with an investigator-capable role ([section 9](#9-roles-and-permissions)); `PATCH owner_id: null` unassigns |
| Auto-status | Decision 5: assigning an owner moves `open` → `investigating` automatically, or stays manual? The mock leaves it manual |
| Allowed transitions | any → any among `open`, `investigating`, `resolved`, `closed` except via the close rules in [section 6](#6-outcome-and-closing); invalid ones return `409 invalid_status_transition` |

---

## 5. Check events

**Required.** The detail page shows the checks behind the flag, read-only.

`GET /risk/cases/{id}/events` → paginated, newest or oldest first (`ordering`):

```json
{
  "count": 7, "next": null, "previous": null,
  "results": [
    {
      "id": "...",
      "at": "2026-10-19T15:02:00Z",
      "code_masked": "7KQ2-…-4PRT",
      "result": "first",
      "region": "Lagos",
      "channel": "qr_scan"
    }
  ]
}
```

| Field | Values | Notes |
|---|---|---|
| `result` | `first`, `repeat` | |
| `region` | state-level name, or `null` if unknown | **no coordinates, city, IP or device** (privacy rules, [section 1](#1-privacy-rules-apply-to-every-endpoint)) |
| `channel` | `qr_scan`, `typed_code`, `ussd`, `gs1_link` | maps to the existing verify entry points (typed code, USSD, GS1 Digital Link) |

Rules:

- **Read-only.** No create, update or delete endpoints. Events are immutable facts.
- **Decision 6: which events belong to a case?** Suggested: events for the flagged code(s) or batch within a window around the flag (e.g. 30 days), captured as a stored list when the case is opened so the evidence does not drift. Alternative: query live by scope.
- Opening the events list for a case can be audited (**Optional**): "who viewed check events".

---

## 6. Outcome and closing

**Required.** The design's "Ready to close?" checklist and the footer note *"Closing a case records your name, the time and the outcome in the audit log."*

### 6.1 Outcome object

```json
"outcome": { "kind": "no_issue", "summary": "Transit damage. Packaging supplier notified." }
```

| `kind` | Meaning |
|---|---|
| `no_issue` | activity looks genuine (for example a pack re-scanned by buyers); no action on codes |
| `monitor` | inconclusive; keep the batch under watch |
| `action` | action needed: deactivate codes, or recall or withdraw the batch |

`outcome` can be saved as a draft on the case (`PATCH`) before closing. `kind` may be `null` until chosen.

### 6.2 Close — `POST /risk/cases/{id}/close`

Validation, returning `422 case_not_ready` with the failing items in `details`:

| Check | Required to close? |
|---|---|
| Owner assigned | **Yes** |
| `outcome.kind` chosen | **Yes** |
| `outcome.summary` non-empty | **Yes** |
| At least one note | Decision 7. The mock's checklist requires it; confirm server enforcement |

Effects, atomically:

- `status = closed`, `closed_at`, `closed_by` set.
- **All linked flags → `reviewed`** (with `reviewed_by` = the closer).
- Audit entry with the closer's name, time and the full outcome.
- If `outcome.kind = action`: **Optional** link to the follow-up, e.g. `linked_actions: [{ "type": "deactivation_request", "id": "..." }, { "type": "batch_recall", "batch_id": "..." }]`. Without it, the frontend only links to the batch page.

### 6.3 Reopen — `POST /risk/cases/{id}/reopen`

- Allowed from `resolved` and `closed` (mock: "Reopen case"). Sets `status = investigating`, clears `closed_at`/`closed_by`, **returns linked flags to `in_case`**, and writes an audit entry.
- **Decision 8:** is `closed` terminal for some roles (only the Owner can reopen)?

---

## 7. Notes

**Required.** Today `PATCH /risk/cases/{id}` takes "status or notes", which reads like a single field. The detail page needs an append-only log.

| Method | Path | Notes |
|---|---|---|
| `GET` | `/risk/cases/{id}/notes` | oldest first |
| `POST` | `/risk/cases/{id}/notes` | body `{ "text": "..." }`, 1–2,000 chars |

Note object: `{ "id", "author": { "id", "name" }, "created_at", "text" }`.

- **Append-only.** No edit or delete (Decision 10: or allow the author to delete within a short window, leaving a tombstone).
- Writing a note updates the case's `updated_at` and creates an audit entry.
- Server-added system notes (e.g. "Case opened from FLG-0142") are marked `"system": true` (**Optional**).

---

## 8. Metadata and counts

### 8.1 KPIs and sidebar badge — Optional

The page header shows: open flags (and how many are high severity), flags without a case, open cases (and the oldest in days), unassigned cases. The sidebar badge shows open flags. Extend `GET /analytics/risk`:

```json
{
  "flags": { "open": 7, "high": 2, "without_case": 3, "by_severity": { "high": 2, "medium": 3, "low": 2 } },
  "cases": { "open": 3, "unassigned": 1, "oldest_open_days": 6 }
}
```

Without it, the frontend derives the numbers by listing everything (`page_size=1` and reading `count`, four calls), and the sidebar badge costs an extra request on every page.

### 8.2 Rule catalogue — Optional

`GET /risk/rules` → `[ { "kind", "label", "description", "default_severity" } ]`. Without it, the frontend shows `rule_label` from each flag and cannot render a rule picker or help text.

The rules seen in the design, as an example: repeat checks after first sale; checks in distant regions within 1 hour; check on a deactivated code; consumer report (seal broken, damaged seal); checks at unusual hours; high repeat rate on one batch; unusual check volume for one batch.

### 8.3 Notifications — Optional

Suggested webhook and in-app events: `flag.created` (high severity first), `case.assigned`, `case.closed`. Confirm the existing `/webhooks` event list.

---

## 9. Roles and permissions

**Required (Decision 11).** Documented roles are `owner` and `admin` (👑). The product mentions quality and production staff doing investigation work.

| Capability | Suggested minimum role |
|---|---|
| View flags, cases, notes, events | any active member (🏢) |
| Review a flag, open a case, add notes, change status, close, reopen | owner, admin, `quality_lead`, `investigator` |
| Assign an owner | owner, admin, `quality_lead` |
| See full (unmasked) codes | owner, admin, `quality_lead` |

The assignable-owner dropdown needs a member list. `GET /tenants/me/members` is 👑-only; an investigator role needs read access to the list (name and id only).

---

## 10. Open decisions

1. **Severity scale:** is `critical` used? The design shows High, Medium, Low only.
2. **`reviewing` flag state:** how is it set (explicit action or implicit)?
3. **One flag, one open case?** Or may a flag appear in several cases?
4. **Consumer reports:** report categories, and whether reporter contact details are stored (and who can see them).
5. **Auto-status:** does assigning an owner move a case to `investigating`?
6. **Which check events belong to a case:** a frozen list at open time, or a live query by scope and window?
7. **Close requirements:** is "at least one note" enforced by the server?
8. **Reopen:** who may reopen a `closed` case?
9. **Code visibility:** who sees full code strings in cases and events?
10. **Notes:** strictly append-only, or author-delete with a tombstone?
11. **Roles:** names and permissions in [section 9](#9-roles-and-permissions).

## 11. Error codes introduced

| HTTP | `code` | When |
|---|---|---|
| 409 | `flag_already_in_case` | opening a case from a flag that already belongs to an open case |
| 409 | `invalid_status_transition` | e.g. closing through `PATCH` instead of `/close`, if disallowed |
| 422 | `case_not_ready` | close with missing owner, outcome kind, summary (or note); `details` lists the failing items |
| 409 | `case_closed` | adding notes or flags to a closed case, if Decision 8 locks it |
| 422 | `owner_not_eligible` | owner is not an active member with an investigator-capable role |
| 403 | `insufficient_role` | role cannot perform the action |
