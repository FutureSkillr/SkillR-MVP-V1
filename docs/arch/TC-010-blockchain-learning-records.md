# TC-010: Blockchain-Based Learning Record Verification

**Status:** draft
**Created:** 2026-02-18

## Context

The user said: *"We aim on tracking the proved learning steps on a blockchain. The profile must be transparent and tamperproofed."*

The Erinnerungsraum (TC-009) stores all evidence — system-observed interactions, third-party endorsements, and external artifacts. But storage in Firebase is centrally controlled. A student's profile credibility depends entirely on trusting Future Skiller as an institution. If the platform disappears, the evidence disappears. If the platform modifies data, there is no external proof.

Blockchain anchoring solves this: the student's learning record becomes independently verifiable, tamper-evident, and survives the platform.

## Decision

Use blockchain as a **verification layer** — not a storage layer. The actual evidence stays in Firebase (TC-004, TC-009). The blockchain stores **hashes and attestations** that prove the evidence existed at a specific time and has not been modified.

### What Goes On-Chain

| Data | On-Chain? | Why |
|---|---|---|
| Hash of completed station matrix | Yes | Proves this learning step happened at this time |
| Hash of endorsement | Yes | Proves a third party endorsed at this time |
| Hash of complete profile snapshot | Yes | Proves profile state at a point in time |
| Endorser identity (pseudonymized) | Yes | Proves WHO endorsed (without revealing personal data) |
| Actual interaction content | No | Too large, too personal, GDPR-incompatible |
| Personal data (name, email) | No | GDPR Article 17 (right to erasure) incompatible with immutable ledger |
| Raw dialogue transcripts | No | Privacy-sensitive, large, unnecessary for verification |

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  FUTURE SKILLER                          │
│                                                          │
│  ┌──────────────────────┐    ┌─────────────────────┐    │
│  │  Erinnerungsraum     │    │  Blockchain          │    │
│  │  (TC-009)            │    │  Verification Layer   │    │
│  │                      │    │                       │    │
│  │  Full evidence:      │    │  Hashes only:         │    │
│  │  - Interactions      │───▶│  - Station hash       │    │
│  │  - Endorsements      │    │  - Endorsement hash   │    │
│  │  - Artifacts         │    │  - Profile hash       │    │
│  │  - Profile data      │    │  - Timestamp          │    │
│  │                      │    │  - Endorser DID       │    │
│  │  (Firebase)          │    │  (Blockchain)         │    │
│  └──────────────────────┘    └─────────┬─────────────┘    │
│                                        │                  │
│                               ┌────────▼────────┐        │
│                               │  Verification    │        │
│                               │  API             │        │
│                               │                  │        │
│                               │  "Is this profile│        │
│                               │   genuine?"      │        │
│                               │   → Compare hash │        │
│                               │   → Check chain  │        │
│                               │   → Return proof │        │
│                               └─────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Verification Flow

```
1. Student completes a station
   → System computes hash of: station_id + learner_id + matrix_state + timestamp + evidence_refs
   → Hash is written to blockchain with metadata
   → Station record in Firebase includes the blockchain transaction reference

2. Third party endorses a skill
   → System computes hash of: endorsement_id + endorser_DID + skill_dimensions + statement_hash
   → Hash is written to blockchain
   → Endorsement record in Firebase includes the blockchain transaction reference

3. Profile snapshot (periodic or on-demand)
   → System computes Merkle root of all current evidence hashes
   → Merkle root is anchored to blockchain
   → Student receives a verifiable credential (W3C VC format)

4. Employer wants to verify
   → Student shares profile link + verification token
   → Employer calls Verification API
   → API retrieves profile from Firebase, computes hash, compares with blockchain
   → Returns: "Profile verified: matches chain record from [date]" or "Mismatch detected"
```

### What "Tamperproof" Means in Practice

| Scenario | Without Blockchain | With Blockchain |
|---|---|---|
| Future Skiller inflates a profile | Undetectable | Hash mismatch → fraud detected |
| Student claims skills they didn't earn | Only platform controls access | Employer verifies against chain |
| Platform goes offline | All evidence lost | Hashes survive on-chain, portable |
| Endorser denies endorsing | Word against word | On-chain timestamp + endorser DID proves it happened |
| Student wants profile deleted (GDPR) | Firebase data deleted | Firebase data deleted, on-chain hash becomes unresolvable (privacy preserved) |

### Blockchain Selection Criteria

| Criterion | Requirement | Rationale |
|---|---|---|
| Cost per transaction | < 0.01 EUR | We write ~10-50 hashes per student per month |
| Throughput | > 100 TPS | Sufficient for our scale (thousands of students) |
| Finality time | < 30 seconds | Hash should be anchored before student leaves station |
| Environmental impact | Low (PoS or equivalent) | Minors' platform cannot justify high-energy PoW |
| Standards support | W3C Verifiable Credentials, DIDs | Interoperability with education ecosystem |
| Longevity | Established chain, likely to exist in 10+ years | Evidence must outlast the platform |

### Recommended Approach: Phased

**Phase 1 (MVP): Hash anchoring on a public L2**

- Use an Ethereum L2 (e.g., Polygon PoS, Base, or Arbitrum) for low-cost hash anchoring
- Write Merkle roots of batched evidence (not individual hashes) to reduce costs
- Batch frequency: once per hour or per 100 completions, whichever comes first
- Estimated cost: < 5 EUR/month for thousands of students
- Simple smart contract: `anchor(merkle_root, batch_metadata) → event`

**Phase 2: Verifiable Credentials (W3C VC)**

- Issue W3C Verifiable Credentials to students for completed journeys
- Credentials contain: profile claims + blockchain proof reference
- Student stores credential in a digital wallet (e.g., Walt.id, Sphereon)
- Employer verifies credential without contacting Future Skiller servers

**Phase 3: Decentralized Identifiers (DIDs)**

- Endorsers register DIDs (Decentralized Identifiers) on-chain
- Endorsements are signed with DID private keys
- Full decentralized verification: no dependency on Future Skiller as intermediary
- Interoperable with European Digital Identity Wallet (eIDAS 2.0)

### GDPR Compatibility

Blockchain and GDPR seem contradictory (immutable ledger vs. right to erasure). Our approach resolves this:

| GDPR Requirement | How We Handle It |
|---|---|
| **Right to erasure (Art. 17)** | Personal data lives in Firebase (deletable). On-chain data is only hashes — hashes alone cannot identify a person. Deleting Firebase data makes the hash unresolvable. |
| **Right to rectification (Art. 16)** | Profile data is updated in Firebase. New hash is written to chain. Old hash remains but links to nothing. Chain shows full history without exposing old personal data. |
| **Data minimization (Art. 5(1)(c))** | Only hashes go on-chain. No personal data, no content, no transcripts. |
| **Purpose limitation (Art. 5(1)(b))** | On-chain data serves exactly one purpose: verification of learning record integrity. |
| **Consent (Art. 6/Art. 8)** | Blockchain anchoring requires explicit consent. Students can opt out and still use the platform (unanchored profile). |

### Data Model

```
// On-chain (smart contract storage)
struct EvidenceAnchor {
    bytes32 merkle_root;      // Merkle root of batched evidence hashes
    uint256 timestamp;         // Block timestamp
    uint256 batch_size;        // Number of evidence items in batch
    string  metadata_uri;      // IPFS or HTTP link to batch manifest (optional)
}

// Off-chain (Firebase, linked to on-chain)
evidence_anchor {
    id: string
    learner_id: string
    evidence_type: "station_completion" | "endorsement" | "profile_snapshot" | "artifact"
    evidence_hash: bytes32          // SHA-256 of evidence content
    merkle_proof: [bytes32]         // Proof of inclusion in on-chain Merkle root
    chain_tx_hash: string           // Blockchain transaction reference
    chain_id: number                // Which chain (for multi-chain future)
    anchored_at: datetime
    verification_url: string        // Public URL for third-party verification
}

// Verifiable Credential (W3C VC format, issued to student)
{
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "LearningRecordCredential"],
    "issuer": "did:web:futureskiller.de",
    "credentialSubject": {
        "id": "did:key:z6Mk...",                      // Student DID
        "achievement": "VUCA Journey Completion",
        "evidence_hash": "0xabc...",
        "chain_proof": {
            "chain": "polygon",
            "tx": "0xdef...",
            "merkle_root": "0x123...",
            "merkle_proof": ["0x...", "0x..."]
        }
    },
    "proof": { ... }                                   // Platform signature
}
```

### Integration with Existing Architecture

| Component | Role |
|---|---|
| TC-004 (Multimodal Storage) | Stores raw evidence → hashed for anchoring |
| TC-007 (Portfolio Evidence) | Structures evidence into claims → claims are individually hashable |
| TC-008 (Auditierbare Methodik) | Audit trail now extends to blockchain — method is externally verifiable |
| TC-009 (Erinnerungsraum) | The memory space whose integrity blockchain protects |
| FR-008 (Profile Generation) | Profile snapshots are periodically anchored |
| FR-030 (Endorsements) | Each endorsement is individually hashable and anchorable |
| BC-005 (Portfolio Verification) | Blockchain adds the "tamperproof" layer to portfolio-backed verification |

### What This Enables

1. **Student-owned records**: Even if Future Skiller disappears, the student's Verifiable Credentials and on-chain proofs remain valid.
2. **Employer trust without platform dependency**: An employer can verify a profile using public blockchain data + the student's VC, without calling our API.
3. **Cross-platform portability**: Other education platforms can verify Future Skiller credentials. Future Skiller can verify external credentials. The hash + chain + DID system is standard-based.
4. **European Digital Identity alignment**: eIDAS 2.0 requires EU citizens to have digital wallets for credentials by 2026-2027. Future Skiller's VCs will be wallet-compatible.

## Consequences

- Adds operational complexity: smart contract deployment, chain monitoring, gas management
- Requires student consent for blockchain anchoring (GDPR)
- Small ongoing cost (~5-50 EUR/month depending on batch frequency and chain choice)
- Creates a genuine technical moat — no competitor can retroactively anchor years of learning evidence
- Phase 1 is simple (hash anchoring) and can be implemented in 1-2 sprints
- Phases 2-3 (VCs, DIDs) require ecosystem maturity and can be deferred

## Alternatives Considered

| Alternative | Why Not |
|---|---|
| **No blockchain, trust the platform** | Defeats the purpose — "tamperproof" requires external verification |
| **Private/permissioned blockchain** | No better than a centralized database. The whole point is public verifiability |
| **Store everything on-chain** | Too expensive, GDPR-incompatible, unnecessary. Hashes suffice for verification |
| **IPFS only** | IPFS provides content addressing but not timestamping or immutability guarantees. Combine with blockchain for full verification |
| **Bitcoin (OP_RETURN anchoring)** | Low throughput, high fees per byte. Not practical for per-station granularity |
| **Hyperledger Fabric** | Permissioned chain — loses public verifiability advantage |

## Related

- TC-004 (Multimodal Storage Layer — source data that gets hashed)
- TC-007 (Portfolio Evidence Layer — structured claims anchored to chain)
- TC-008 (Auditierbare Methodik — audit trail now blockchain-backed)
- TC-009 (Multimodaler Erinnerungsraum — the memory space blockchain protects)
- BC-005 (Portfolio-Backed Skill Verification — blockchain adds the trust layer)
- FR-008 (Skill Profile Generation — profile snapshots anchored to chain)
- FR-030 (Third-Party Skill Endorsement — endorsements individually verifiable)
- DC-015 (Three Core Training Matrices — all three journeys' evidence is anchored)
