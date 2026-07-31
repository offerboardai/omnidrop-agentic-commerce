import { createHash, randomBytes } from 'node:crypto';

/**
 * Thin public stand-in for OmniDROP's sealed commercial package.
 *
 * Full encrypt/chunk/RAM-relay lives in the private monorepo / www.omnidrop.com.
 * Here we only bind payment ↔ package content hash so judges see the contract link.
 */

export interface CommercialPackageStub {
    packageId: string;
    /** SHA-256 hex of canonical payload (objects + tasks + rules + bill) */
    contentHash: string;
    sellerLabel: string;
    buyerLabel: string;
    billAmountUsdc: string;
    subscriptionName: string;
    cycle: number;
    payload: string;
}

export function buildSubscriptionPackage(input: {
    sellerLabel: string;
    buyerLabel: string;
    billAmountUsdc: string;
    subscriptionName: string;
    cycle: number;
    /** Opaque service payload (e.g. weekly brief bytes) */
    payload: string;
}): CommercialPackageStub {
    const canonical = JSON.stringify({
        v: 1,
        kind: 'omnidrop.subscription.cycle',
        subscriptionName: input.subscriptionName,
        cycle: input.cycle,
        billAmountUsdc: input.billAmountUsdc,
        sellerLabel: input.sellerLabel,
        buyerLabel: input.buyerLabel,
        payload: input.payload,
    });
    const contentHash = createHash('sha256').update(canonical).digest('hex');
    const packageId = `pkg_${randomBytes(8).toString('hex')}`;
    return {
        packageId,
        contentHash,
        sellerLabel: input.sellerLabel,
        buyerLabel: input.buyerLabel,
        billAmountUsdc: input.billAmountUsdc,
        subscriptionName: input.subscriptionName,
        cycle: input.cycle,
        payload: input.payload,
    };
}

export interface DeliveryUnlock {
    unlocked: boolean;
    packageId: string;
    contentHash: string;
    paymentReferenceId: string;
    reason: string;
}

/** Unlock only when payment reference matches the package bill binding. */
export function unlockAfterPayment(
    pkg: CommercialPackageStub,
    paymentReferenceId: string,
    paymentOk: boolean,
): DeliveryUnlock {
    const expectedRef = billReferenceId(pkg);
    if (!paymentOk) {
        return {
            unlocked: false,
            packageId: pkg.packageId,
            contentHash: pkg.contentHash,
            paymentReferenceId,
            reason: 'Payment failed or denied by policy',
        };
    }
    if (paymentReferenceId !== expectedRef) {
        return {
            unlocked: false,
            packageId: pkg.packageId,
            contentHash: pkg.contentHash,
            paymentReferenceId,
            reason: 'Payment reference does not bind to this package bill',
        };
    }
    return {
        unlocked: true,
        packageId: pkg.packageId,
        contentHash: pkg.contentHash,
        paymentReferenceId,
        reason: 'USDC settled — sealed delivery unlocked (courier may be private/live OmniDROP)',
    };
}

export function billReferenceId(pkg: CommercialPackageStub): string {
    return `bill:${pkg.packageId}:${pkg.contentHash.slice(0, 16)}`;
}
