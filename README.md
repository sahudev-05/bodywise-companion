# Bodywise Companion

An independent Be Bodywise product-use prototype for the Mosaic Fellowship Builder Round. The working question is whether a customer can use their own routine to understand how long an opened bottle may last.

**Try it:** Open `index.html` in a browser. All app assets are included. No build, account or API key is required.

## A two-minute walkthrough

1. On **Today**, inspect the example lotion. The sample has 128 mL left and consumes an illustrative 2 mL per day, giving about 64 days.
2. Choose **Log use**. The level drops to 126 mL. **Journal** records the use. **Undo** on Today restores it. A skipped use leaves the quantity alone.
3. Choose **Example shelf → Start or open my personal shelf**. Select the wash or lotion, read its guide and set up your bottle.
4. Enter the package size, the quantity left, dispenser, units per use, weekly schedule and times. Add the mL per unit only if you know it. You can log check-ins without a conversion.
5. Use **My shelf** to pause a routine, enter a corrected quantity, or enter a full level after replacing a bottle.

## Calculation and data

Average daily consumption = units per use × mL per unit × uses per scheduled day × scheduled days per week ÷ 7. Estimated days left = recorded quantity ÷ average daily consumption. Logged uses deduct at most the recorded remaining amount. A skip makes no deduction. Calendar time alone never consumes product.

A browser-local journal stores routine choices and check-ins. Example and personal records are separate. Browser storage is specific to this browser and origin. Clearing site data removes saved records. Opening the local file and visiting a hosted copy can produce separate shelves.

Product names, example pack capacities and directions are drawn from the [official Be Bodywise product guide](https://bebodywise.com/product/aha-bha-body-pack). The bottle illustration is generic. The example pump conversion and schedule are illustrative. Use your pack's directions and your own measured dispensing volume.

## Fellowship evidence

The supplied fellowship working brief describes a hypothesis. Five genuine, consented customer interviews and observed usability sessions still need to establish whether this problem deserves priority. This repository contains no interview responses, customer identities or claimed outcomes. Keep identifiable research outside the public repository.

Codex assisted with implementation and automated checks. Vanilla HTML, CSS and JavaScript keep the prototype portable and avoid server-side collection of routine data. The release focuses on product guides, scheduling, check-ins and a correctable estimate.

## Verification

The calculation tests use the Node.js built-in test runner: `node --test model.test.cjs`. The app can be served from the repository root by any static host, including GitHub Pages.
