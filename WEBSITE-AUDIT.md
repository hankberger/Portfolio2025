Website audit — h4nk.com

Audited September 7, 2026 (America/Chicago).

Implementation update: the first batch is now implemented locally. Project links and employment disclosure support keyboards; artwork uses lightweight posters and loads only when selected and in view; graphics initialization and autoplay failures preserve the portfolio; mobile text and hit targets are larger; desktop overflow and short landscape layout are fixed; the hero exposes work, résumé, and LinkedIn actions; and the server returns real 404s, consolidates URLs, and caches fingerprinted assets. The initial JavaScript bundle is 268 kB rather than 871 kB. Build, lint, simulation smoke checks, HTTP regression tests, responsive browser checks, and simulated WebGL/autoplay failures passed. Physical-device validation, case studies, conversion tracking, and a site-wide motion control remain follow-up work. Changes have not been deployed. The findings below retain the original audit baseline.

The strongest opportunity is to turn the visual experience into an accessible, discoverable body of work. Keep the fish and artistic identity; make projects easy to read, link to, and act on. Additional metadata alone will have less value than better project pages, reliable interaction, and a clear next step for visitors.

This audit combines the current repository, live HTTP responses, and the live site's rendered DOM and appearance. Browser checks covered 1280×720, 1440×900, 390×844, 320×568, and 844×390 viewports in the Codex browser. These are responsive checks, not physical iOS/Android or Safari/Firefox certification. The production JavaScript filename differs from the local build; findings explicitly observed live are identified below. No application code or deployment was changed.

Priority means suggested implementation order: P1 = first batch; P2 = next batch; P3 = polish. Effort estimates are approximate engineering time, excluding writing case studies and collecting device results.

1. **P1 — Make project links and disclosures accessible.** Confirmed in source and live DOM. Effort: 0.5–1 day.

   Project cards use `div onClick` and `window.open`, with no link semantics or keyboard handler. Their live `tabIndex` is -1. The employment disclosure is also a click-only div. Keyboard users cannot activate these controls normally, and project destinations are absent from the live page's anchor list. The no-JavaScript fallback has links, but it does not repair the interactive experience. Google recommends real anchors with `href` for reliable link discovery. [Google's link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).

   Use an ordinary anchor for each project destination and a separate button for selecting a carousel item if needed. Use a disclosure button with `aria-expanded` and `aria-controls` for employment and portfolio expansion. Preserve visible focus styling and normal open-in-new-tab behavior. Verify all projects can be reached and opened using only Tab and Enter, and employment expands using Enter/Space.

   Evidence: [ProjectsSection.tsx:242](/Users/hankberger/Coding/Portfolio2025/src/components/ProjectsSection.tsx:242), [EmploymentCard.tsx:51](/Users/hankberger/Coding/Portfolio2025/src/components/EmploymentCard.tsx:51), [HankCard.tsx:165](/Users/hankberger/Coding/Portfolio2025/src/components/HankCard.tsx:165).

2. **P1 — Stop eagerly loading the entire artwork collection.** Confirmed loading behavior live; asset sizes measured locally. Effort: 0.5–1.5 days.

   The inline script creates hidden videos for all eight artwork files after window load, before visitors open the portfolio. All eight had reached media ready state 4 during the untouched live landing-page inspection. They total **63.01 MB / 60.09 MiB** locally; the largest file is about 20 MiB. This is the size of the eligible media set, not a measured per-visit transfer total. The DOM also contains separate React video elements for those same files; browser caching may avoid duplicate transfers, but the extra media elements remain.

   Remove the hidden artwork warmup. Give each video a lightweight poster, defer its source until near the viewport or selected, and preload at most the next item. Pause media when it leaves view, not merely when another carousel item is selected. The current `visible` flag means the entire portfolio is expanded, so the selected artwork can play while far offscreen. Also remove the uncancelled warmup timeout: both `canplaythrough` and its fallback call `preloadNext`, so the intended sequential queue can branch.

   Acceptance: no artwork MP4 requests on the initial landing screen; selecting an artwork loads only that item and an intentional neighbor.

   Evidence: [index.html:133](/Users/hankberger/Coding/Portfolio2025/index.html:133), [ArtworkSection.tsx:220](/Users/hankberger/Coding/Portfolio2025/src/components/ArtworkSection.tsx:220).

3. **P1 — Protect the portfolio from WebGL and autoplay failures.** Source-confirmed missing safeguards; failure modes require device testing. Effort: 0.5–1.5 days.

   `createScene()` constructs `WebGLRenderer` synchronously inside a React effect without a guard or error boundary. A context-creation exception can therefore take down the React experience rather than simply removing the decorative fish. Treat the scene as optional: catch initialization failure, retain readable content and working navigation, and load the scene separately from essential UI.

   Artwork calls `video.play()` without handling rejection and supplies neither a poster nor a playback fallback. Handle rejection, show an accessible Play control, and retain the poster when decoding or playback fails. The hero already has a static fallback, which is worth preserving. The two browser-detection implementations have drifted: the React helper recognizes Twitter iOS while the HTML preloader does not, so a Twitter user agent without a Safari token selects different formats in the two paths. Consolidate selection and verify actual alpha playback on target devices. [MDN documents playback rejection](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play).

   Acceptance: content and contact/project links remain usable with WebGL unavailable, blocked autoplay, and a failed video request. Test iOS Safari, Chrome on Android, and the Instagram/X in-app browsers on actual devices.

   Evidence: [useFishScene.ts:43](/Users/hankberger/Coding/Portfolio2025/src/hooks/useFishScene.ts:43), [scene/index.ts:49](/Users/hankberger/Coding/Portfolio2025/src/scene/index.ts:49), [ArtworkSection.tsx:225](/Users/hankberger/Coding/Portfolio2025/src/components/ArtworkSection.tsx:225), [browserDetection.ts:43](/Users/hankberger/Coding/Portfolio2025/src/util/browserDetection.ts:43).

4. **P1 — Fix responsive overflow and small text.** Confirmed live. Effort: 0.5–1 day.

   At 1440×900, the expanded `.constraint` measured 1440 px wide with a 1551 px scroll width. The desktop row's content, gap, and side padding do not fit cleanly. At 320 px, character splitting lets “Designer” break within the word. Project descriptions compute to **9.6 px** and tags to **7.8 px** at phone widths below 400 px. At 390 px, artwork/project arrows are 24×24 px; employment arrows measure 18×18 px.

   Let the desktop columns shrink within their available width or stack before their intrinsic widths overflow. Preserve whole-word wrapping in the animated subtitle. Set readable text minimums independent of the 12 px root size; approximately 14–16 px body/description text is a useful design target. Enlarge interactive hit areas toward 44×44 px. WCAG's 24 px minimum has spacing and other exceptions, so the dimensions alone are not a complete compliance determination. [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

   Verify the expanded page at the tested sizes, 200% browser zoom, and mobile landscape with browser controls visible. Fixed positioning and `100vh` also warrant physical-device checks for browser chrome and safe-area behavior.

   Evidence: [HankCard.css:76](/Users/hankberger/Coding/Portfolio2025/src/components/styles/HankCard.css:76), [HankCard.tsx:23](/Users/hankberger/Coding/Portfolio2025/src/components/HankCard.tsx:23), [index.css:57](/Users/hankberger/Coding/Portfolio2025/src/index.css:57), [ProjectsSection.css:33](/Users/hankberger/Coding/Portfolio2025/src/components/styles/ProjectsSection.css:33).

5. **P1 — Give visitors an immediate reason and route to continue.** Confirmed live; proposed growth improvement. Effort: 0.5–1 day.

   The initial screen offers only a name, role, and “Get Started.” Projects, social links, and experience are behind expansion. The expanded React UI has no résumé anchor and no direct contact action; `/resume` is linked only in the no-JavaScript fallback. A visitor attracted by the animation has no obvious “contact Hank” or “follow this work” invitation.

   Rename the primary action to “View my work,” expose selected work and contact/résumé links immediately, and add one sentence explaining your specialty. Suggested copy to adapt: “I build interactive websites and 3D experiences with React, Three.js, and motion design.” Add a direct contact route and an explicit “Follow my experiments” action to your preferred public channel. Do not imply freelance availability unless that is your intent. Keep the fish interaction available as part of the experience.

   Evidence: [PostContent.tsx:93](/Users/hankberger/Coding/Portfolio2025/src/components/PostContent.tsx:93), [HankCard.tsx:162](/Users/hankberger/Coding/Portfolio2025/src/components/HankCard.tsx:162), [index.html:349](/Users/hankberger/Coding/Portfolio2025/index.html:349).

6. **P2 — Publish individual case studies and render useful content initially.** Confirmed structure; indexing impact unmeasured. Effort: 1–3 days for the page system, plus writing.

   The sitemap contains only the homepage and résumé. Project destinations lead to external demos or a raw MP4; artworks have no titles, explanations, or individual URLs. This gives people little to link to and search engines little subject-specific content on h4nk.com.

   Start with `/work/dithered-fish`, `/work/motion-planning`, and `/work/gaussian-splatting` as proposed URLs. Each should explain the problem, your contribution, technical choices, constraints, and a demonstrated result, followed by a demo/source/contact link. Add titled artwork pages or captions with tools and process notes. Give each page its own title, canonical, social image, and sitemap entry.

   Render the meaningful copy and anchors into initial HTML, then enhance with React and WebGL. The current `<noscript>` content is useful, and React keeps portfolio content mounted, but that content is `display:none` before interaction. Do not infer that Google definitely cannot index it; validate Google's rendered HTML in Search Console. Google does not interact with pages to reveal lazy-loaded content. [Google's rendering guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading).

   Evidence: [sitemap.xml](/Users/hankberger/Coding/Portfolio2025/public/sitemap.xml), [PostContent.css:13](/Users/hankberger/Coding/Portfolio2025/src/components/styles/PostContent.css:13), [ProjectsSection.tsx:10](/Users/hankberger/Coding/Portfolio2025/src/components/ProjectsSection.tsx:10), [ArtworkSection.tsx:49](/Users/hankberger/Coding/Portfolio2025/src/components/ArtworkSection.tsx:49).

7. **P2 — Return accurate HTTP statuses and consolidate duplicate URLs.** Confirmed live. Effort: 0.25–0.5 day.

   `/audit-missing-page-20260907` returned HTTP 200 and the homepage because Express sends `index.html` for every unmatched path. Return an actual 404 with useful navigation for unknown paths and missing assets. This avoids misleading responses and potential duplicate/soft-404 handling; Search Console classification was not inspected. [Google's error guidance](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors).

   HTTP correctly redirects to HTTPS. However, `https://www.h4nk.com/` serves 200 without redirecting to the canonical non-www host. The canonical tag helps; add a permanent host redirect for consistency. Both `/resume` and `/hank-berger-resume.pdf` serve the PDF with 200, without a canonical Link header. Choose one public URL and redirect the other, or supply an HTTP canonical header for the PDF.

   Evidence: [server.ts:46](/Users/hankberger/Coding/Portfolio2025/server.ts:46).

8. **P2 — Add a real motion preference and pause control.** Confirmed in source and live controls. Effort: 0.5–1 day.

   Only the animated tab title checks `prefers-reduced-motion`. Fish rendering, heading reveals, looping hero video, and artwork do not. There is no general pause control. Honor reduced motion across these systems, keep essential content visible without delayed entrance effects, and offer a visible animation toggle. Suspending the scene after scattered fish leave view can also save GPU work. Continuous movement alongside content should have an appropriate pause/stop/hide mechanism. [W3C motion guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

   Evidence: [useTitleFish.ts:40](/Users/hankberger/Coding/Portfolio2025/src/hooks/useTitleFish.ts:40), [scene/index.ts:179](/Users/hankberger/Coding/Portfolio2025/src/scene/index.ts:179), [HankCard.tsx:21](/Users/hankberger/Coding/Portfolio2025/src/components/HankCard.tsx:21).

9. **P2 — Measure and reduce essential startup work.** Build and response facts confirmed; visitor performance unmeasured. Effort: 0.5–1.5 days after establishing a baseline.

   The local production build emits one **871.11 kB JavaScript bundle, 244.31 kB gzip**, and loads a roughly 2.2 MiB fish model. Split optional scene code from essential content and defer initializing it until the page is usable. Merely placing Three.js in another eagerly imported chunk does not defer its work. The font request includes four families; trim families, styles, and weights to those actually used.

   Production already serves Brotli and the inspected hashed JS has a four-hour cache lifetime. Use longer immutable caching for fingerprinted assets while keeping HTML revalidated; fingerprint media before applying immutable caching to it.

   Establish mobile field measurements before claiming a speed improvement. Targets at the 75th percentile: LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1. No Lighthouse score or Core Web Vitals pass/fail is claimed by this audit. [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds).

   Evidence: [useFishScene.ts:2](/Users/hankberger/Coding/Portfolio2025/src/hooks/useFishScene.ts:2), [index.html:77](/Users/hankberger/Coding/Portfolio2025/index.html:77), [server.ts:46](/Users/hankberger/Coding/Portfolio2025/server.ts:46).

10. **P3 — Align titles, headings, and social metadata.** Confirmed in source/live DOM. Effort: 0.25–0.5 day.

    The title is only “Hank Berger 🐟,” while the visible role, description, and Open Graph title use different positioning. Use a stable, descriptive title such as “Hank Berger — Design Engineer & Motion Designer,” adapted to the role you actually want to emphasize. Updating only HTML will not work: `useTitleFish` continually restores its own name-only title. The fish can remain visually distinctive without repeatedly inserting an emoji inside your name in the document title. [Google's title guidance](https://developers.google.com/search/docs/appearance/title-link).

    Employment uses another H1 while Projects, Artwork, and About Me are div labels. Use a logical outline: name H1, section H2s, individual project H3s. This is primarily a semantic/navigation improvement, not a claim that multiple H1s incur a ranking penalty. Mark decorative SVGs/canvases appropriately; the accessibility tree currently includes an unhelpful “Layer_1” image.

    The local social image is 1787×938 while metadata declares 1200×630. Resize it or declare its actual dimensions, and add `og:image:alt`. The live social-image URL returns 200; actual social-platform preview rendering was not tested.

    Evidence: [index.html:8](/Users/hankberger/Coding/Portfolio2025/index.html:8), [useTitleFish.ts:18](/Users/hankberger/Coding/Portfolio2025/src/hooks/useTitleFish.ts:18), [EmploymentCard.tsx:63](/Users/hankberger/Coding/Portfolio2025/src/components/EmploymentCard.tsx:63).

Audience-growth plan

Treat the following as experiments, not traffic forecasts. The portfolio suggests two plausible audiences: people interested in creative engineering, and employers/collaborators evaluating your work. Shareable technical breakdowns can serve both.

| Timing | Action | Evidence of progress |
| --- | --- | --- |
| Week 1 | Fix links, loading, readability, and contact/résumé access. Inspect existing Cloudflare analytics and establish a Search Console baseline. | Visitors can reach every project with keyboard or touch; baseline search impressions, referrals, and meaningful actions recorded. |
| Week 2 | Publish the fish/WebGL case study, including a short demo and a useful explanation of dithering, flocking, or the canvas/DOM layering. Add a follow/contact action at the end. | One substantive URL that can be linked directly and inspected for indexing. |
| Week 3 | Reuse that work as a short visual clip, a technical post, and a professional project summary on your existing Instagram, X, GitHub, and LinkedIn channels as appropriate. Link to the case study with source-specific UTM tags. | Compare engaged case-study visits and contact/follow clicks by source. |
| Week 4 | Publish the next project breakdown and cross-link related work. Add an RSS feed or an optional email signup if you intend to publish regularly. | A second entry point, a return-visit mechanism, and an initial comparison of which topic attracts useful interest. |

Suggested first topics: “How I built a dithered Three.js fish flock,” “Motion planning around moving obstacles in Three.js,” and “Capturing 3D scenes with a mobile Gaussian-splatting app.” Use actual implementation decisions and measured outcomes; avoid generic tool lists or invented performance claims. Feature the strongest current project ahead of the 2022 portfolio unless the older work is deliberately the best introduction.

The live site includes a Cloudflare Insights beacon, so analytics is already present. No custom conversion tracking was found in the inspected source. Build on existing measurement: track work opened, project/demo clicks, résumé clicks, contact clicks, and follow clicks where the chosen analytics setup supports it. A follow-link click is not a verified new follower. Review search clicks/impressions by landing page, qualified referral visits, returning visitors, and actual inquiries over time; raw pageviews alone will not show whether the portfolio is doing its job.

Verification and remaining limits

`npm run build` and `npm run lint` passed. The build reported the large-chunk warning described above. No console warnings/errors appeared in the inspected live browser session. The homepage, résumé, robots.txt, sitemap, social image, and all three project destination URLs responded successfully; successful HTTP responses do not certify the external demos' functionality. Canonical metadata, JSON-LD, a no-JavaScript fallback, social tags, HTTPS redirection, and a hero-video fallback are already useful foundations.

Remaining validation: actual Safari/Firefox/Edge and mobile in-app browser runs; touch gestures and orientation changes on devices; reduced-motion, disabled-WebGL, blocked-autoplay, and slow-network cases; social preview debuggers; Search Console indexing/rendered HTML; and real-user performance and conversion data. These need verification rather than assumed failures. Prioritize findings 1–5 before adding more decorative effects or expanding metadata.
