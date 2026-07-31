/**
 * Demo-domain "service subscription" — recurring sealed drop paid in USDC.
 * Not Netflix; a sellable OmniDROP-shaped recurring encrypted service.
 */

export type SubscriptionStatus = 'active' | 'cancelled';

export interface SubscriptionState {
    name: string;
    status: SubscriptionStatus;
    priceUsdc: string;
    cyclesCompleted: number;
    cancelReason?: string;
}

export interface SubscriptionRules {
    /** Cancel if a cycle payment would exceed this (mirrors wallet maxPerTx) */
    maxPriceUsdc: string;
    /** Cancel after this many successful renewals (demo bound) */
    maxCycles: number;
}

export function createSubscription(name: string, priceUsdc: string): SubscriptionState {
    return {
        name,
        status: 'active',
        priceUsdc,
        cyclesCompleted: 0,
    };
}

export function shouldAutonomousCancel(
    sub: SubscriptionState,
    rules: SubscriptionRules,
    nextPriceUsdc: string,
): { cancel: boolean; reason?: string } {
    if (sub.status === 'cancelled') {
        return { cancel: true, reason: sub.cancelReason || 'already cancelled' };
    }
    if (Number(nextPriceUsdc) > Number(rules.maxPriceUsdc)) {
        return {
            cancel: true,
            reason: `Price ${nextPriceUsdc} exceeds policy max ${rules.maxPriceUsdc}`,
        };
    }
    if (sub.cyclesCompleted >= rules.maxCycles) {
        return {
            cancel: true,
            reason: `Reached maxCycles=${rules.maxCycles} — agent cancels without human`,
        };
    }
    return { cancel: false };
}

export function markRenewed(sub: SubscriptionState): SubscriptionState {
    return { ...sub, cyclesCompleted: sub.cyclesCompleted + 1 };
}

export function markCancelled(sub: SubscriptionState, reason: string): SubscriptionState {
    return { ...sub, status: 'cancelled', cancelReason: reason };
}
