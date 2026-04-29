# Election-Night Results Workflow

This is the safe operating checklist for adding Local Authority election results to Politiscope.

## 1. Find Official Result Sources

Use official council result pages only. Good sources are usually:

- Council election results pages.
- Official declaration of result PDFs.
- Official ward/division result pages in council democracy or CMIS systems.
- Official council press releases only when they include full candidate-level results.

Do not use social media screenshots, party posts, news summaries, or user-submitted figures as result sources.

## 2. Prepare The Results CSV

Create or update the relevant CSV under the configured result source path, normally:

```text
data/local-result-sources/<council>-2026-results.csv
```

Use this header:

```csv
council,ward,candidateName,party,votes,elected,turnout,sourceUrl,lastChecked
```

Example row:

```csv
Birmingham City Council,Acocks Green,"Candidate Name",Party Name,1234,true,42.1%,https://official-council-result-url,07-05-2026
```

Rules:

- `council` should match the Local Authority name.
- `ward` should match the ward/division name in the Local Vote Guide lookup.
- `candidateName` and `party` must match the official result source.
- `votes` should be a number without commas where possible.
- `elected` should be `true` for winners and `false` for non-winners.
- `turnout` can be blank if the official source does not publish it.
- `sourceUrl` must be the official result URL.
- `lastChecked` should use `dd-mm-yyyy`.

## 3. Always Dry-Run First

Run a dry-run before importing real results:

```powershell
npm run local-results:import:remote -- --dry-run
```

If importing one council only:

```powershell
npm run local-results:import:remote -- --council=<council-slug> --dry-run
```

Check:

- `rowsReady` is greater than zero.
- `skipped` is empty or understood.
- No wards are unmatched.
- No rows are missing `sourceUrl`.

## 4. Import Real Results

Only after the dry-run is clean:

```powershell
npm run local-results:import:remote
```

For one council:

```powershell
npm run local-results:import:remote -- --council=<council-slug>
```

## 5. Run Health Checks

After import:

```powershell
npm run local-authority:health:remote
```

For broader readiness:

```powershell
npm run health:pre-election
```

Confirm:

- Result coverage increases.
- Result rows are not missing source URLs.
- Latest local ingest run is `success`.

## 6. UI Spot Checks

Open the app and check:

- Elections -> Locals.
- Search for the council or a postcode in the result area.
- Open the relevant ward/division guide.
- Confirm the guide switches from candidate view/result pending to result summary.
- Confirm the winner is shown correctly.
- Confirm the official source link opens the council result page.

## Warnings

- Do not import test or fake data.
- Always dry-run first.
- Use official council sources only.
- Do not mix candidate lists, officeholders, and results. Results are a separate dataset.
- If a result source is unclear, pause and verify before importing.
