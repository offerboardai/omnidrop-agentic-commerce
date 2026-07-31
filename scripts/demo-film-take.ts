/**
 * ONE-TAKE film demo — do not record until rehearsal succeeds off-camera.
 *
 * Cycle 1: LIVE Circle Agent Wallet USDC transfer + package unlock
 * Cycle 2: policy renew + autonomous cancel (no second on-chain spend)
 *
 * Usage (after preflight):
 *   DRY_RUN=false CIRCLE_LIVE_PAY=1 npx tsx scripts/demo-film-take.ts
 */
import 'dotenv/config';
import { CircleAgentPayments } from '../src/circle/client.js';
import type { AgentWalletRef, SpendPolicy } from '../src/circle/types.js';
import {
    billReferenceId,
    buildSubscriptionPackage,
    unlockAfterPayment,
} from '../src/omnidrop-bridge/package-binding.js';
import {
    createSubscription,
    markCancelled,
    markRenewed,
    shouldAutonomousCancel,
} from '../src/subscription/subscription.js';

async function main(): Promise<void> {
    const dryRun = process.env.DRY_RUN === 'true' || process.env.CIRCLE_LIVE_PAY !== '1';
    const buyerAddr = process.env.BUYER_AGENT_WALLET_ADDRESS || '';
    const sellerAddr = process.env.SELLER_AGENT_WALLET_ADDRESS || '';

    if (!buyerAddr || !sellerAddr) {
        throw new Error('Set BUYER_AGENT_WALLET_ADDRESS and SELLER_AGENT_WALLET_ADDRESS in .env');
    }
    if (dryRun) {
        throw new Error(
            'Film take requires LIVE pay. Set DRY_RUN=false and CIRCLE_LIVE_PAY=1. '
            + 'Rehearse once off-camera before recording.',
        );
    }

    const buyer: AgentWalletRef = { address: buyerAddr, label: 'BuyerAgent' };
    const seller: AgentWalletRef = { address: sellerAddr, label: 'SellerAgent' };
    const price = process.env.SUBSCRIPTION_PRICE_USDC || '0.01';
    const name = process.env.SUBSCRIPTION_NAME || 'OmniDROP Encrypted Weekly Brief';
    const policy: SpendPolicy = {
        maxPerTxUsdc: process.env.POLICY_MAX_PER_TX_USDC || '1.00',
        maxPerDayUsdc: process.env.POLICY_MAX_PER_DAY_USDC || '5.00',
        allowlist: [sellerAddr],
    };

    const payments = new CircleAgentPayments(policy, {
        dryRun: false,
        explorerTxBaseUrl: process.env.BLOCK_EXPLORER_TX_BASE_URL
            || 'https://sepolia.basescan.org/tx',
    });

    console.log('=== FILM TAKE — OmniDROP × Circle Agent Stack ===');
    console.log(`chain: ${process.env.CIRCLE_CHAIN || 'BASE-SEPOLIA'}`);
    console.log(`buyer:  ${buyer.address}`);
    console.log(`seller: ${seller.address}`);
    console.log(`policy: maxPerTx=${policy.maxPerTxUsdc} allowlist=seller`);
    console.log('');

    // ── Cycle 1: LIVE USDC ─────────────────────────────────────
    const pkg = buildSubscriptionPackage({
        sellerLabel: seller.label,
        buyerLabel: buyer.label,
        billAmountUsdc: price,
        subscriptionName: name,
        cycle: 1,
        payload: 'Encrypted weekly brief — unlock after USDC settle',
    });
    const referenceId = billReferenceId(pkg);

    console.log('--- Cycle 1 (LIVE USDC) ---');
    console.log(`packageId=${pkg.packageId}`);
    console.log(`contentHash=${pkg.contentHash}`);
    console.log(`billRef=${referenceId}`);
    console.log('Buyer agent paying via Circle Agent Wallet…');

    const receipt = await payments.pay({
        from: buyer,
        to: seller,
        amountUsdc: price,
        referenceId,
        memo: `${name} cycle 1`,
    });

    if (!receipt.ok || !receipt.txId) {
        throw new Error(`LIVE PAY FAILED — do NOT record. ${receipt.error || 'no txId'}`);
    }

    console.log(`✅ LIVE PAY CONFIRMED ${receipt.amountUsdc} USDC`);
    console.log(`   txHash: ${receipt.txId}`);
    console.log(`   explorer: ${receipt.explorerUrl}`);
    console.log(`✅ Seller agent RECEIVE bound to ${receipt.referenceId}`);

    const unlock = unlockAfterPayment(pkg, receipt.referenceId, true);
    console.log(
        unlock.unlocked
            ? `🔓 Delivery unlocked for ${unlock.packageId}`
            : `🔒 LOCKED: ${unlock.reason}`,
    );

    let sub = markRenewed(createSubscription(name, price));
    console.log(`📅 Cycles completed: ${sub.cyclesCompleted}`);
    console.log('');

    // ── Cycle 2 boundary: autonomous cancel (no second chain spend) ──
    const rules = { maxPriceUsdc: policy.maxPerTxUsdc, maxCycles: 1 };
    const decision = shouldAutonomousCancel(sub, rules, price);
    if (decision.cancel) {
        sub = markCancelled(sub, decision.reason || 'cancelled');
        console.log('--- Policy / subscription control ---');
        console.log(`🛑 Agent cancelled subscription (no human Pay click): ${sub.cancelReason}`);
    }

    console.log('');
    console.log('=== FILM TAKE OK — copy explorer URL into browser NOW ===');
    console.log(JSON.stringify({
        explorerUrl: receipt.explorerUrl,
        txHash: receipt.txId,
        buyer: buyer.address,
        seller: seller.address,
        packageId: pkg.packageId,
        contentHash: pkg.contentHash,
    }, null, 2));
}

main().catch((err) => {
    console.error('\n❌ FILM TAKE ABORTED — fix before recording:\n', err);
    process.exitCode = 1;
});
