import React from 'react';
import PolicyPage, { SUPPORT_EMAIL } from './storefront/PolicyPage';

interface RefundPolicyProps {
  onNavigate: (tab: string) => void;
}

// Template — review and adapt before relying on it (see PolicyPage.tsx).
export default function RefundPolicy({ onNavigate }: RefundPolicyProps) {
  return (
    <PolicyPage
      title="Returns & refunds"
      intro="Not quite right? Here is how returns and exchanges work."
      onNavigate={onNavigate}
      sections={[
        {
          heading: '7-day returns',
          body: (
            <>
              <p>You can return most items within 7 days of delivery. To be accepted, items must be:</p>
              <ul>
                <li>unworn, unwashed and unaltered</li>
                <li>returned with all original tags and packaging</li>
              </ul>
            </>
          )
        },
        {
          heading: 'Items we cannot accept',
          body: <p>For hygiene reasons we cannot accept returns of innerwear, swimwear, earrings, or items marked “final sale”, unless they arrived damaged or faulty.</p>
        },
        {
          heading: 'How to start a return',
          body: <p>Go to My Account → Orders and choose the item to return, or email <strong>{SUPPORT_EMAIL}</strong> with your order number. We will confirm the return and how to send it back.</p>
        },
        {
          heading: 'Refunds',
          body: (
            <>
              <p>Once we receive and check your return, we refund to your original payment method (UPI, card or netbanking) through Razorpay. Banks usually take 5–7 working days to show the refund.</p>
              <p>If you prefer, we can issue store credit instead, available immediately.</p>
            </>
          )
        },
        {
          heading: 'Damaged or wrong items',
          body: <p>If something arrives damaged or is not what you ordered, email us within 48 hours of delivery with photos and we will replace it or refund you in full, including delivery.</p>
        },
        { heading: 'Cancellations', body: <p>You can cancel an order from My Account until it has been dispatched. After dispatch, please return it instead.</p> }
      ]}
    />
  );
}
