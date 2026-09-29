import dotenv from 'dotenv';
dotenv.config();
import { getStripe } from './src/utils/stripe.js';

const stripe = getStripe();
try {
  const sessions = await stripe.checkout.sessions.list({ limit: 5 });
  console.log('recent sessions:', sessions.data.length);
  for (const s of sessions.data) {
    console.log('---');
    console.log('  id:', s.id);
    console.log('  status:', s.status, '| payment_status:', s.payment_status);
    console.log('  amount_total:', s.amount_total, s.currency);
    if (s.payment_intent) {
      const piId = typeof s.payment_intent === 'string' ? s.payment_intent : s.payment_intent.id;
      const pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] });
      console.log('  PI status:', pi.status);
      console.log('  PI last_payment_error:', pi.last_payment_error?.message, '| code:', pi.last_payment_error?.code);
      const ch = pi.latest_charge;
      if (ch && typeof ch !== 'string') {
        console.log('  charge failure_message:', ch.failure_message);
        console.log('  outcome:', ch.outcome?.type, '| network_status:', ch.outcome?.network_status, '| reason:', ch.outcome?.reason);
      }
    }
  }
} catch (e) {
  console.error('STRIPE ERROR:', e.type, e.code, e.message);
}
