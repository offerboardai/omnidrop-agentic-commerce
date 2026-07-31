# Public threat model (short)

## Guarantees in this proof repo

- Fail-closed local policy before pay attempts  
- No synthetic explorer URLs in dry-run  
- Payment reference must bind to package content hash to unlock  

## Out of scope here

- Full OmniDROP RAM-relay / crypto properties (private monorepo)  
- Circle platform / chain finality  
- Protection if CLI sessions or `.env` are leaked — treat agent wallets as real money  

## Human vs agent

- Human may set policy and fund the wallet  
- Prize demo payment must be agent/CLI-driven — not a manual web checkout  
