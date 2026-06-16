\# Codex Handoff: Moki Market V0.2.6.2



\## Current status



Claude Code previously worked on V0.2.6.2 but stopped because of context/token limit.



Current WIP includes:

\- Bull / Base / Bear Scenarios module

\- Serenity buy-side scenario framework integration

\- Real data integration planning

\- Earnings Expectation and Guidance Compare cleanup



\## Important docs



Read first:

\- docs/REAL\_DATA\_INTEGRATION\_PLAN.md

\- docs/CODEX\_HANDOFF\_V0.2.6.2.md



\## Important files



Main generated card flow:

\- src/components/generate/GeneratedCardPreview.tsx

\- src/components/earnings/EarningsSnapshotPanel.tsx

\- src/components/earnings/GuidanceComparePanel.tsx

\- src/lib/generateResearchCard/mockGenerateResearchCard.ts

\- src/types/earnings.ts



New / WIP scenario and serenity related files may include:

\- src/components/scenarios/\*

\- src/lib/scenarios/\*

\- src/types/scenario.ts

\- src/components/serenity/TamAdjPegPanel.tsx

\- src/lib/serenity/\*



\## Do not do



\- Do not redesign the whole project.

\- Do not restore BasicDataPanel to the main UI.

\- Do not delete basicData providers.

\- Do not add new large features before build passes.

\- Do not invent real target prices or real buy-side expectations.

\- Do not output buy/sell recommendations.



\## Immediate goal



1\. Inspect current WIP.

2\. Run lint/build.

3\. Fix TypeScript/build errors only.

4\. Preserve the existing V0.2.6.2 work.

5\. Make the project build successfully.



\## Known area to inspect



Claude Code was interrupted while fixing:

\- src/components/serenity/TamAdjPegPanel.tsx



\## Commands



On Windows:

npm.cmd run lint

npm.cmd run build



\## Acceptance criteria



\- npm.cmd run lint passes

\- npm.cmd run build passes

\- BasicDataPanel is not restored to main UI

\- Earnings Expectation stays above Guidance Compare

\- Bull/Base/Bear Scenarios appears below Guidance Compare if data exists

\- /generate?query=NVDA works

\- /generate?query=ORCL works

\- /generate?query=SNOW works

\- /generate?query=DELL works

\- /generate?query=MU works

\- /generate?query=00700 does not crash

