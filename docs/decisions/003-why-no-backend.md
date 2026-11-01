# 003. Why No Backend Server

## Status
Accepted

## Context
Label Padho requires product metadata lookup and ingredient interpretation. Adding a custom backend introduces infrastructure costs, auth management, hosting maintenance, and operational complexity.

## Decision
Operate entirely as a client-side application without a custom backend service.

## Rationale & Consequences
1. **Zero Infrastructure Cost**: No servers, load balancers, or hosted databases to deploy, monitor, or pay for.
2. **Enhanced Privacy**: The app holds no user personal identifiable information on external servers. Barcode queries go directly from the client to the public Open Food Facts API.
3. **No Auth Vulnerabilities**: Eliminating accounts eliminates credential storage, session management, password resets, and token leakage risks.
4. **Offline Resilience**: Eliminates dependency on a custom server being online. If Open Food Facts is unreachable, previously scanned products open seamlessly from the local SQLite cache.
5. **Scale Trade-offs**: In year one, direct queries to Open Food Facts are sufficient. If high query volume ever causes API throttling, a lightweight caching proxy can be introduced in a future version.

