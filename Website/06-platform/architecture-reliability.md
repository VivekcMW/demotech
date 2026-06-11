---
page: "Architecture & Reliability"
slug: /platform/architecture-reliability
hub: Platform
meta_title: "Hospital Software That Works on Real Indian Infrastructure | {Product}"
meta_description: "Built for 1366×768 desktops, shared ward PCs, and flaky bandwidth. Offline-tolerant charting, Indian-region cloud hosting, uptime SLAs, and tested DR."
---

# Built for the worst machine in the hospital

Most hospital software is demoed on the vendor's MacBook and deployed onto a 2014 desktop at a nursing station with a humid keyboard and a 4 Mbps line. We designed for the second machine.

---

## The worst-machine principle

- **Screens:** every workflow is fully usable at 1366×768 — the most common hospital desktop resolution in India — without horizontal scrolling
- **Hardware:** runs in the browser on modest CPUs and 4 GB RAM machines; no client installs, no agent software, no GPU anything
- **Bandwidth:** interfaces are payload-light; the system stays workable on shared connections and 4G fallback
- **Shared machines:** fast user switching with automatic session protection, because ward PCs are communal property

## When the network drops

Clinical charting — vitals, nursing notes, medication administration — continues offline on ward devices and syncs when the connection returns, with conflict-safe merging. A network blip never costs a nurse her last twenty minutes of charting. Critical reference data (the patient banner, allergies, active orders) is cached locally on ward devices for resilience.

## When the power drops

The system is cloud-hosted, so the hospital's own server room (and its UPS, and its air-conditioner, and its prayers) is no longer the single point of failure. Ward devices on basic UPS power keep working through outages; everything reconciles on restoration.

---

## The hosting layer

- **Indian-region cloud hosting** with multi-zone redundancy; data residency in India, contractually
- **Uptime SLA** with service credits — published, not whispered
- **RPO/RTO** defined in the agreement; encrypted automated backups with scheduled restore drills
- **Capacity** that scales with your census — Monday-morning OPD load is an engineering input, not a surprise
- **Monitoring** — 24×7 platform monitoring with proactive incident communication; status visible to your IT team

## Deployment options

Cloud-first is the default and what we recommend for almost everyone. Hybrid arrangements (local resilience nodes for ICU/OT continuity) are available for large facilities; fully on-premise deployments are considered for institutional cases that genuinely require them, with the trade-offs stated honestly — on-premise means your team owns the 3 am disk failure.

---

## Why this page exists

Because 'will it work on our computers, with our internet?' is the question every Indian hospital IT head asks, and the question most vendor websites dodge. The answer is yes, and now you know specifically why.

[Book a demo] · Related: [Security & Data Privacy](/platform/security-data-privacy) · [Interoperability](/platform/interoperability)
