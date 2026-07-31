import { spawn } from 'node:child_process';
import { assertPaymentAllowed, PolicyDeniedError } from './policy.js';
import type { PaymentIntent, PaymentReceipt, SpendPolicy } from './types.js';

export interface CircleClientOptions {
    dryRun: boolean;
    cliBin?: string;
    explorerTxBaseUrl?: string;
}

/**
 * Thin adapter over Circle Agent Stack.
 *
 * Live path (verified): `circle wallet transfer` with Agent Wallets.
 * Dry-run: policy + package bind without inventing explorer URLs.
 */
export class CircleAgentPayments {
    constructor(
        private readonly policy: SpendPolicy,
        private readonly opts: CircleClientOptions,
    ) {}

    async pay(intent: PaymentIntent): Promise<PaymentReceipt> {
        try {
            assertPaymentAllowed(intent, this.policy);
        } catch (err) {
            if (err instanceof PolicyDeniedError) {
                return {
                    ok: false,
                    dryRun: this.opts.dryRun,
                    referenceId: intent.referenceId,
                    amountUsdc: intent.amountUsdc,
                    fromAddress: intent.from.address,
                    toAddress: intent.to.address,
                    error: err.message,
                };
            }
            throw err;
        }

        if (this.opts.dryRun || !intent.from.address || !intent.to.address) {
            return {
                ok: true,
                dryRun: true,
                referenceId: intent.referenceId,
                amountUsdc: intent.amountUsdc,
                fromAddress: intent.from.address || '(buyer-wallet-unset)',
                toAddress: intent.to.address || '(seller-wallet-unset)',
                txId: undefined,
                explorerUrl: undefined,
            };
        }

        const txId = await this.executeCirclePay(intent);
        const explorerUrl = this.opts.explorerTxBaseUrl
            ? `${this.opts.explorerTxBaseUrl.replace(/\/$/, '')}/${txId}`
            : undefined;

        return {
            ok: true,
            dryRun: false,
            referenceId: intent.referenceId,
            amountUsdc: intent.amountUsdc,
            fromAddress: intent.from.address,
            toAddress: intent.to.address,
            txId,
            explorerUrl,
        };
    }

    /**
     * Verified path: Circle CLI Agent Wallet USDC transfer
     * (same command used for BASE-SEPOLIA eligibility proof).
     */
    private async executeCirclePay(intent: PaymentIntent): Promise<string> {
        if (process.env.CIRCLE_LIVE_PAY !== '1') {
            throw new Error(
                'Live pay blocked: set CIRCLE_LIVE_PAY=1 and DRY_RUN=false for on-chain settle.',
            );
        }

        const bin = this.opts.cliBin || process.env.CIRCLE_CLI || 'circle';
        const chain = process.env.CIRCLE_CHAIN || 'BASE-SEPOLIA';
        const usdc =
            process.env.USDC_TOKEN_ADDRESS
            || '0x036cbd53842c5426634e7929541ec2318f3dcf7e';

        const args = [
            'wallet',
            'transfer',
            intent.to.address,
            '--amount',
            intent.amountUsdc,
            '--token',
            usdc,
            '--address',
            intent.from.address,
            '--chain',
            chain,
            '--output',
            'json',
        ];

        const stdout = await runCommand(bin, args);
        let txHash: string | undefined;
        try {
            const parsed = JSON.parse(stdout) as { data?: { txHash?: string } };
            txHash = parsed?.data?.txHash;
        } catch {
            txHash = stdout.match(/0x[a-fA-F0-9]{64}/)?.[0];
        }
        if (!txHash) {
            throw new Error(
                `Circle CLI transfer did not return txHash. Output:\n${stdout}`,
            );
        }
        return txHash;
    }
}

function runCommand(bin: string, args: string[]): Promise<string> {
    const pathEnv = [
        process.env.PATH || '',
        `${process.env.HOME || ''}/.hermes/node/bin`,
        '/usr/local/bin',
    ].filter(Boolean).join(':');

    return new Promise((resolve, reject) => {
        const child = spawn(bin, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env, PATH: pathEnv },
        });
        let out = '';
        let err = '';
        child.stdout.on('data', (d) => { out += String(d); });
        child.stderr.on('data', (d) => { err += String(d); });
        child.on('error', (e) => reject(e));
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`${bin} ${args.join(' ')} exited ${code}: ${err || out}`));
                return;
            }
            resolve(out);
        });
    });
}
