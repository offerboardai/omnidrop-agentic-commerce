/**
 * Circle Agent Stack — domain types used by this public proof repo.
 * Concrete CLI/SDK calls live in client.ts and will track Circle's current docs.
 */

export interface AgentWalletRef {
    /** On-chain / Circle agent wallet address */
    address: string;
    label: string;
}

export interface SpendPolicy {
    /** Max USDC per single autonomous payment */
    maxPerTxUsdc: string;
    /** Max USDC per rolling day */
    maxPerDayUsdc: string;
    /** Optional allowlisted counterparty addresses */
    allowlist?: string[];
}

export interface PaymentIntent {
    from: AgentWalletRef;
    to: AgentWalletRef;
    amountUsdc: string;
    /** Idempotency — bind to sealed package / bill id */
    referenceId: string;
    memo?: string;
}

export interface PaymentReceipt {
    ok: boolean;
    dryRun: boolean;
    referenceId: string;
    amountUsdc: string;
    fromAddress: string;
    toAddress: string;
    /** On-chain or Gateway payment id when live */
    txId?: string;
    explorerUrl?: string;
    error?: string;
}
