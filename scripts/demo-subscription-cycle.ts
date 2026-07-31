/**
 * Closed-loop demo: buyer agent pays seller agent USDC under policy,
 * binds payment to a sealed commercial package hash, renews, then cancels.
 *
 * Default: DRY_RUN=true (no fake explorer success).
 * Live: configure .env wallets, wire Circle CLI in src/circle/client.ts, CIRCLE_LIVE_PAY=1.
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

function envFlag(name: string, fallback: boolean): boolean {
    const v = process.env[name];
    if (v === undefined) return fallback;
    return v === '1' || v.toLowerCase() === 'true';
}

async function main(): Promise<void> {
    const dryRun =
        process.argv.includes('--dry-run')
        || envFlag('DRY_RUN', true)
        || !process.env.BUYER_AGENT_WALLET_ADDRESS
        || !process.env.SELLER_AGENT_WALLET_ADDRESS;

    const buyer: AgentWalletRef = {
        address: process.env.BUYER_AGENT_WALLET_ADDRESS || '',
        label: 'BuyerAgent',
    };
    const seller: AgentWalletRef = {
        address: process.env.SELLER_AGENT_WALLET_ADDRESS || '',
        label: 'SellerAgent',
    };

    const price = process.env.SUBSCRIPTION_PRICE_USDC || '0.01';
    const name = process.env.SUBSCRIPTION_NAME || 'OmniDROP Encrypted Weekly Brief';

    const policy: SpendPolicy = {
        maxPerTxUsdc: process.env.POLICY_MAX_PER_TX_USDC || '1.00',
        maxPerDayUsdc: process.env.POLICY_MAX_PER_DAY_USDC || '5.00',
        allowlist: seller.address ? [seller.address] : undefined,
    };

    const payments = new CircleAgentPayments(policy, {
        dryRun,
        explorerTxBaseUrl: process.env.BLOCK_EXPLORER_TX_BASE_URL,
    });

    let sub = createSubscription(name, price);
    const rules = {
        maxPriceUsdc: policy.maxPerTxUsdc,
        maxCycles: 2, // demo: renew twice, then autonomous cancel
    };

    console.log('=== OmniDROP Agentic Commerce — subscription cycle ===');
    console.log(`mode: ${dryRun ? 'DRY-RUN (no on-chain tx)' : 'LIVE (Circle Agent Stack)'}`);
    console.log(`subscription: ${sub.name} @ ${sub.priceUsdc} USDC / cycle`);
    console.log(`policy: maxPerTx=${policy.maxPerTxUsdc} maxPerDay=${policy.maxPerDayUsdc}`);
    console.log('');

    // Human moment (once): policy already set. No Pay click in this loop.
    for (let cycle = 1; cycle <= rules.maxCycles + 1; cycle++) {
        const decision = shouldAutonomousCancel(sub, rules, price);
        if (decision.cancel) {
            sub = markCancelled(sub, decision.reason || 'cancelled');
            console.log(`🛑 Agent cancelled subscription: ${sub.cancelReason}`);
            break;
        }

        const pkg = buildSubscriptionPackage({
            sellerLabel: seller.label,
            buyerLabel: buyer.label,
            billAmountUsdc: price,
            subscriptionName: name,
            cycle,
            payload: `Encrypted brief cycle ${cycle} — full seal via OmniDROP courier`,
        });
        const referenceId = billReferenceId(pkg);

        console.log(`--- Cycle ${cycle} ---`);
        console.log(`packageId=${pkg.packageId}`);
        console.log(`contentHash=${pkg.contentHash}`);
        console.log(`billRef=${referenceId}`);

        const receipt = await payments.pay({
            from: buyer,
            to: seller,
            amountUsdc: price,
            referenceId,
            memo: `${name} cycle ${cycle}`,
        });

        if (!receipt.ok) {
            console.log(`❌ Payment denied/failed: ${receipt.error}`);
            sub = markCancelled(sub, receipt.error || 'payment failed');
            break;
        }

        console.log(
            receipt.dryRun
                ? `✅ Buyer agent PAY (dry-run) ${receipt.amountUsdc} USDC → seller`
                : `✅ Buyer agent PAY ${receipt.amountUsdc} USDC tx=${receipt.txId}`,
        );
        if (receipt.explorerUrl) console.log(`   explorer: ${receipt.explorerUrl}`);
        console.log(`✅ Seller agent RECEIVE acknowledged (reference ${receipt.referenceId})`);

        const unlock = unlockAfterPayment(pkg, receipt.referenceId, receipt.ok);
        if (unlock.unlocked) {
            console.log(`🔓 Delivery unlocked for ${unlock.packageId}`);
            console.log(`   🧾 Invoice Receipt: [PAID ${receipt.amountUsdc} USDC | billRef: ${receipt.referenceId}]`);
            console.log(`   📦 Unlocked Payload: "${pkg.payload}"`);
        } else {
            console.log(`🔒 Delivery locked: ${unlock.reason}`);
        }

        sub = markRenewed(sub);
        console.log(`📅 Cycles completed: ${sub.cyclesCompleted}`);
        console.log('');
    }

    console.log('=== Summary ===');
    console.log(JSON.stringify({
        status: sub.status,
        cyclesCompleted: sub.cyclesCompleted,
        cancelReason: sub.cancelReason,
        dryRun,
        buyerWallet: buyer.address || null,
        sellerWallet: seller.address || null,
        nextSteps: dryRun
            ? [
                'Create wallets via Circle Agent Stack / starter kits',
                'Fund buyer wallet with USDC',
                'Set BUYER_AGENT_WALLET_ADDRESS + SELLER_AGENT_WALLET_ADDRESS in .env',
                'Wire src/circle/client.ts executeCirclePay to your CLI version',
                'Set DRY_RUN=false and CIRCLE_LIVE_PAY=1 for a verifiable explorer tx',
                'Paste wallet + explorer URL into README Proof section',
            ]
            : [
                'Paste wallet + explorer URL into README Proof section',
                'Record demo video of this script (no human checkout)',
                'Opt in on Devpost Circle Agentic Economy Prize',
            ],
    }, null, 2));
}

main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
