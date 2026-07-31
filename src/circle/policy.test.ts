import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertPaymentAllowed, PolicyDeniedError } from './policy.js';
import type { PaymentIntent, SpendPolicy } from './types.js';

const policy: SpendPolicy = {
    maxPerTxUsdc: '1.00',
    maxPerDayUsdc: '5.00',
    allowlist: ['0xSELLER'],
};

function intent(amount: string, to = '0xSELLER'): PaymentIntent {
    return {
        from: { address: '0xBUYER', label: 'b' },
        to: { address: to, label: 's' },
        amountUsdc: amount,
        referenceId: 'ref',
    };
}

describe('assertPaymentAllowed', () => {
    it('allows in-policy payment', () => {
        assert.doesNotThrow(() => assertPaymentAllowed(intent('0.01'), policy));
    });

    it('denies over maxPerTx', () => {
        assert.throws(
            () => assertPaymentAllowed(intent('2.00'), policy),
            (e: Error) => e instanceof PolicyDeniedError,
        );
    });

    it('denies payee not on allowlist', () => {
        assert.throws(
            () => assertPaymentAllowed(intent('0.01', '0xOTHER'), policy),
            (e: Error) => e instanceof PolicyDeniedError,
        );
    });
});
