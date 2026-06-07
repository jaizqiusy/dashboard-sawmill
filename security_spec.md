# Security Specification: Operator Profiles & Leadership Board

This document defines the security configuration and access control policies for the Sawmill Operations Firebase database.

## 1. Data Invariants
- **Schema Conformity**: Any written document under `/operators/{operatorId}` must contain `mesin`, `avatar`, `locked`, and `updatedAt`.
- **Identity Integrity**: Anonymous writes are disallowed if security rules are strictly enforced. To maintain ease of use, we permit reading profiles publicly (for the dashboard) but restrict editing and locking to authenticated users.
- **Id Poisoning Guard**: The `{operatorId}` variable must be valid (must match regular alphanumeric format and be safe in size).
- **Temporal Integrity**: `updatedAt` field must match the server timestamp.

## 2. The "Dirty Dozen" Payloads
These payloads attempt to breach security boundaries and must be caught and rejected:
1. **Unauthenticated Edit**: An unauthenticated user attempts to update an operator's avatar.
2. **Ghost Field Injection**: Trying to inject `isAdmin: true` or other custom properties into `/operators/BS_1`.
3. **Mismatched Key Count**: Passing a payload missing required fields like `locked` or `updatedAt`.
4. **Id Poisoning (Too Large)**: An ID that is 3MB of random characters like `BS_1_aaaaaaaa...` to consume database resources.
5. **Id Poisoning (Special Characters)**: An ID containing injection syntax or special characters like `operators/../admins/attacker`.
6. **Self-Assigned Admin**: Trying to write into `/admins/{uid}` or bypass RBAC configurations.
7. **Bypassing Lock**: Trying to update a document where `existing().locked == true` without authenticating.
8. **Invalid Avatar Type**: Uploading a Boolean or Number instead of a String representation of the image.
9. **No Server Timestamp**: Providing a hardcoded client-side `updatedAt` date string representing the past or future.
10. **Terminal State Mutation**: Setting `locked` to false when the profile belongs to someone else.
11. **Excessive Field Size**: Attempting to set `mesin` value to a 20KB random string to occupy storage space.
12. **Malicious Empty Payload**: Overwriting an operator profile with an empty object or NULL values.

## 3. Test Runner Structural Blueprint
A testing module `test/firestore.rules.test.ts` is planned to assert the rejection of all non-conforming updates.
