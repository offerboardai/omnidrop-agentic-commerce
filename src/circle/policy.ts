import type { PaymentIntent, SpendPolicy } from './types.js';

export class PolicyDeniedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PolicyDeniedError';
    }
}

/**
 * Local fail-closed gate before any Circle settle call.
 * Circle Agent Wallet limits are the authoritative on-chain/API fence;
 * this mirrors them so demos never "succeed" when over policy in dry-run either.
 */
export function assertPaymentAllowed(intent: PaymentIntent, policy: SpendPolicy): void {
    const amount = Number(intent.amountUsdc);
    const maxTx = Number(policy.maxPerTxUsdc);
    const maxDay = Number(policy.maxPerDayUsdc);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new PolicyDeniedError(`Invalid amount: ${intent.amountUsdc}`);
    }
    if (amount > maxTx) {
        throw new PolicyDeniedError(
            `Amount ${intent.amountUsdc} USDC exceeds maxPerTx ${policy.maxPerTxUsdc}`,
        );
    }
    if (amount > maxDay) {
        throw new PolicyDeniedError(
            `Amount ${intent.amountUsdc} USDC exceeds maxPerDay ${policy.maxPerDayUsdc}`,
        );
    }
    if (policy.allowlist && policy.allowlist.length > 0) {
        const ok = policy.allowlist.some(
            (a) => a.toLowerCase() === intent.to.address.toLowerCase(),
        );
        if (!ok) {
            throw new PolicyDeniedError(
                `Payee ${intent.to.address} is not on the allowlist`,
            );
        }
    }
}
