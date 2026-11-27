# Bodywise Companion

[Open the live app](https://sahudev-05.github.io/bodywise-companion/). An independent Mosaic Fellowship Builder Round prototype for people who already use Be Bodywise products.

## First visit

The **Find my routine** experience is the default first-visit page and the primary entry point in the navigation. It opens as a guided, conversational assistant (tap-based, rule-driven—not a live AI chatbot) with a five-step consultation covering care area, skin type, concerns, sensitivity and products already owned. It filters a broader product catalogue across face, body, underarm and foot care, explains why each shortlist result matched, avoids suggesting products the user already owns, and declines to guess when there is no responsible match. Skin type is used as context, not diagnosis. Product pages link to Be Bodywise. The usage estimator lets users change mL per use and uses per week to see an approximate bottle lifespan; it is an estimate, not a promise. It is educational guidance, not a diagnosis or personalised medical advice. The **Wellness** page rotates a date-stable wellbeing tip and an original daily thought. Both are optional supporting experiences. The **Rewards** page demonstrates a low-pressure loyalty layer: points are earned for reading product guidance, sharing feedback and confirming responsible empty-pack disposal—not for increasing usage or buying unnecessarily. Points are local-only and not redeemable. Real purchase-linked rewards require a brand-authorised commerce integration and order verification.

**Help me choose** opens a side-by-side comparison of the two bottles, including their purpose, shower step, rinse-off or leave-on directions and brand sources. **I own this already** opens a pack picker and creates or edits the chosen bottle on the personal shelf when saved.

Each bottle overview and usage guide includes **What to expect**. The lotion guide attributes the 3–4 month range to Be Bodywise. The wash guide describes variable results without assigning a deadline.

## Try a bottle

Choose **Body lotion** or **Body wash** on Today. Drag or swipe the pack to rotate it, pinch or scroll to zoom, or use the rotation buttons. **Front** restores the initial facing direction. The 200 mL 5% Lactic Acid Body Lotion and 250 mL 1% Salicylic Acid Body Wash each have their own textured GLB mesh. Front artwork comes from the brand's pack photography. Geometry is reconstructed from the photographs. The unphotographed rear retains the label colours.

**Explore ingredients** opens the selected formula. Search by name or function, or select a role such as cleansing, hydration or preservation. Each listed component has a description. The guide splits compound blends into their individual named constituents. Only brand-disclosed percentages appear.

## Routine and bottle estimates

The example lotion has 128 mL remaining and uses an illustrative 2 mL per day. Log a use to record 126 mL, or skip to leave the balance unchanged. Undo restores the previous balance. Journal preserves check-ins across page reloads.

Open **Example shelf** to switch to a separate personal shelf. Add your product and enter your capacity, remaining volume, usual dispensing units and schedule. Enter the volume per unit only when measured or supplied by the manufacturer. A user can track uses without a calibrated estimate, pause the routine or correct the remaining quantity.

Average daily consumption = units per use × mL per unit × uses per scheduled day × scheduled days per week ÷ 7. Estimated days left = recorded quantity ÷ average daily consumption. A use debits at most the recorded balance. Skips and calendar time alone make no deduction.

Routine data stays in this browser's local storage. Clearing site data removes its records. Shelf keys and storage format are compatible with the original release.

## Product and visual sources

- [Be Bodywise 5% Lactic Acid Body Lotion](https://bebodywise.com/product/5-lactic-acid-body-lotion) — pack, directions and featured ingredients.
- [Be Bodywise AHA–BHA Body Pack](https://bebodywise.com/product/aha-bha-body-pack) — selected 200 mL lotion formula. It agrees with the lotion page's Important Information panel. Another panel on the individual page gives a conflicting list. The app calls this out and asks users to check their bottle.
- [Be Bodywise 1% Salicylic Acid Body Wash, 250 mL](https://bebodywise.com/product/1-salicylic-acid-body-wash-250ml-xp) — pack, directions and formula.
- [European Commission cosmetic ingredient database](https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-ingredient-database_en) — reference for cosmetic ingredient terminology. Function descriptions are general educational explanations.
- Pack photography, ingredient thumbnails and the wordmark are sourced from Be Bodywise’s product pages. Brand assets belong to their respective owners. This fellowship project is independent of the brand.

## Implementation

The repository root is a static website. Serve it over HTTP or HTTPS for the interactive 3D viewer. Opening the HTML directly from disk supports the routine UI and pack photographs. Devices without compatible WebGL also get the pack photos. The app bundles its viewer, meshes, textures and images locally.

The 3D viewer is Google's [model-viewer](https://github.com/google/model-viewer), version 4.4.0. Its distribution is in viewer.min.js with its license in VIEWER-LICENSE.txt. Formula data and product-specific roles are in formula.js. Routine logic and calculation tests are in model.js and model.test.cjs.

Run the calculation, discovery and loyalty tests with Node's built-in runner: `node --test *.test.cjs`. Browser checks cover rotation on both models, touch dragging, reset, formula counts and filtering, persisted check-ins, and the responsive views.

## Fellowship evidence

The project owner reports completing customer interviews using Joinify and formulating a final problem statement. See `CUSTOMER-RESEARCH.md` for the owner's supplied overall pattern, final problem statement and HMW statement. The reported repeat-purchase observation is treated as a retention hypothesis to validate, not proof that every customer wants loyalty rewards. Observed usability testing should be documented separately. No customer identities should be committed.
