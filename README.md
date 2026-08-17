# OmniDROP Agentic Commerce

Public proof for the [Circle Agentic Economy Prize](https://xprize.devpost.com/) (Build with Gemini XPRIZE bonus).

**Team:** John A. Ananian, CTO (inventor on multiple granted U.S. patents; built the product with AI) · William Nahm, CEO (Harvard Business degree).

AI agents **make and receive USDC** via [Circle Agent Stack](https://developers.circle.com/agent-stack), bound to a sealed commercial package hash — not a human clicking Pay.

The sealed package is the contract (work, rules, bill). Circle moves the dollars. No human Pay click, no card in a prompt. That rail is integral to OmniDROP’s agentic product, not a bolt-on wallet demo.

Live product: [www.omnidrop.com](https://www.omnidrop.com) · Patent context: [U.S. #8,386,288 B2](https://patents.google.com/patent/US8386288B2/en) (workflow package exchange between drop-box programs). Circle/USDC settlement is not claimed under that patent.

---

## Eligibility proof

| Requirement | Status |
|-------------|--------|
| Circle Agent Stack pay/receive | ✅ Agent Wallets + confirmed USDC transfer (BASE-SEPOLIA) |
| Public GitHub (this repo) | ✅ |
| Recorded demo of real USDC tx | ✅ [Circle Video 2](https://www.youtube.com/watch?v=oQgunU9ePCM) |
| Agent wallet + block-explorer URL | ✅ Below |
| Agent-driven (no human checkout) | ✅ Circle CLI Agent Wallet transfer |

```
Buyer Agent Wallet:   0x6b9bd993a86396b050faeed1688eb085cda10d2c
Seller Agent Wallet:  0x96729c9cacfd030fec6906184af65f4c171ba1db
Chain:                BASE-SEPOLIA
Amount:               0.01 USDC
Tx hash:              0xeda2ce6aa6f68ad1fce6607e2e572052cc104e1f47bc20e52d2c28f2402a0dda
Block explorer URL:   https://sepolia.basescan.org/tx/0xeda2ce6aa6f68ad1fce6607e2e572052cc104e1f47bc20e52d2c28f2402a0dda
Demo video:           https://www.youtube.com/watch?v=oQgunU9ePCM
Devpost project:      <PASTE public Devpost URL when available>
```

---

## Reproduce

```bash
npm install
cp .env.example .env
npm test                         # local spend policy (per-tx, per-day, allowlist)
npm run demo:subscription:dry    # policy + package bind (no chain)
```

Live pay requires [Circle CLI](https://developers.circle.com/agent-stack/circle-cli) Agent Wallets and:

```bash
DRY_RUN=false CIRCLE_LIVE_PAY=1 npm run demo:film
```

See Circle docs: [Agent Stack](https://developers.circle.com/agent-stack) · [Starter kits](https://github.com/circlefin/agent-stack-starter-kits)

---

## Layout

```
src/circle/            Agent Stack adapters (transfer, policy)
src/subscription/      Recurring bill domain
src/omnidrop-bridge/   Package hash ↔ payment binding (no private courier crypto)
scripts/               Dry-run + live film demo entrypoints
docs/THREAT_MODEL_PUBLIC.md
```

## Not in this repo

Full OmniDROP gateway/crypto, production secrets, and private monorepo sources. Judges verify agentic USDC here; XPRIZE private share covers the courier.

## License

**All rights reserved.** Source is available for XPRIZE / Circle prize verification and personal non-commercial evaluation only — see [`LICENSE`](./LICENSE). Product and patent rights remain with Intentionize, LLC / Offerboard as applicable.
