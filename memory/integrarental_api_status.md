---
name: integraRental API status
description: integraRental does NOT publish an open API; partnership-gated only. Contact + scoping notes for Burton's potential integration.
type: reference
originSessionId: 791416d6-c275-4ad6-85f2-a1719bff2664
---
**Burton NDT Rentals uses integraRental** as their internal rental management system. We researched whether we could programmatically integrate bndtrentals.com with it on 2026-05-08.

## Research outcome

- **No public/self-serve API.** integrarental.com and integrasoft.com publish no developer documentation, no portal, no SDK, no OAuth flow.
- **An API clearly exists internally** — the integrations page lists multiple two-way and inbound flows (QuickBooks two-way, integraWMS two-way, eCommerce module two-way, IDScan inbound, RoviTracker inbound, SolarTrak inbound, Rouse Analytics inbound, SmartEquip bidirectional). Two-way + inbound proves they have receive endpoints.
- **Access is partner-program gated.** Their integrations page says verbatim: *"If you are interested in building a new integration with us, please reach out to our sales department."*

## Contact

- **Sales:** `sales@integrasoft.com`
- **Phone:** 563-332-5030
- **Parent company:** integraSoft (Iowa)
- **Product line:** integraRental, integraERP, integraWMS, integraBI, integraService, integraEDI

## Use cases we identified for Burton (ranked by value)

1. **Push** quote-form leads from bndtrentals.com → integraRental opportunities/reservations
2. **Push** customers from `/admin/customers` → integraRental contacts
3. **Pull** calibration due-dates from integraRental → our `calibration_recalls` table to drive the existing daily reminder cron
4. **Pull** real-time inventory availability + pricing → catalog product pages (longer-term)

## Path forward (as of 2026-05-08)

- **No-regret work:** CSV import/export bridge in our admin panel — works regardless of partnership outcome.
- **Partnership inquiry:** Drafted email to `sales@integrasoft.com` pending Russell's send. Two versions (short + long) exist in chat history of session 2026-05-08; can be re-drafted on request.
- **Indirect bridge via QuickBooks Online:** Burton's QBO subscription would let us push customers/invoices to QBO and let integraRental's two-way QBO sync carry them across. Architecturally weird (quote leads aren't invoices) but viable. Not pursued.
- **Reverse-engineering eRental endpoints:** Last-resort path. Fragile + TOS-risky. Not pursued.

## Why partnership matters before building

Until we hear back from integraSoft on (a) whether API access exists, (b) what tier it requires, and (c) cost, we can't scope the actual integration work. The CSV bridge is the safe thing to ship in the meantime.
