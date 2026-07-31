# OmniDROP Agentic Commerce

Public proof for the [Circle Agentic Economy Prize](https://xprize.devpost.com/) (Build with Gemini XPRIZE bonus).

AI agents **make and receive USDC** via [Circle Agent Stack](https://developers.circle.com/agent-stack), bound to a sealed commercial package hash — not a human clicking Pay.

Live product: [www.omnidrop.com](https://www.omnidrop.com) · Patent context: [U.S. #8,386,288 B2](https://patents.google.com/patent/US8386288B2/en) (workflow package exchange between drop-box programs). Circle/USDC settlement is not claimed under that patent.

---

## Eligibility proof

| Requirement | Status |
|-------------|--------|
| Circle Agent Stack pay/receive | ✅ Agent Wallets + confirmed USDC transfer (BASE-SEPOLIA) |
| Public GitHub (this repo) | ✅ |
| Recorded demo of real USDC tx | ⏳ Add video URL below when published |
| Agent wallet + block-explorer URL | ✅ Below |
| Agent-driven (no human checkout) | ✅ Circle CLI Agent Wallet transfer |

```
Buyer Agent Wallet:   0x6b9bd993a86396b050faeed1688eb085cda10d2c
Seller Agent Wallet:  0x96729c9cacfd030fec6906184af65f4c171ba1db
Chain:                BASE-SEPOLIA
Amount:               0.01 USDC
Tx hash:              0x068c38b199f36fd4b2ea9425c66c69a324287459dc07413e671cb815976a2022
Block explorer URL:   https://sepolia.basescan.org/tx/0x068c38b199f36fd4b2ea9425c66c69a324287459dc07413e671cb815976a2022
Demo video:           <PASTE when recorded>
```

---

## Reproduce

```bash
npm install
cp .env.example .env
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
