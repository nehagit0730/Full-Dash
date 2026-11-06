import React from 'react';
import PolicyPage, { SUPPORT_EMAIL } from './storefront/PolicyPage';

interface TermsConditionsProps {
  onNavigate: (tab: string) => void;
}

// Template — review and adapt before relying on it (see PolicyPage.tsx).
export default function TermsConditions({ onNavigate }: TermsConditionsProps) {
  return (
    <PolicyPage
      title="Terms & conditions"
      intro="The terms that apply when you shop with us."
      onNavigate={onNavigate}
      sections={[
        { heading: 'About these terms', body: <p>By placing an order on this website you agree to these terms, our shipping policy and our returns policy.</p> },
        {
          heading: 'Products & pricing',
          body: (
            <>
              <p>We try to show every product’s colour and details accurately, but screens vary and handmade or printed fabrics can differ slightly from the photos.</p>
              <p>All prices are in Indian Rupees (₹) and include applicable taxes. If a price is shown incorrectly, we will contact you before processing the order.</p>
            </>
          )
        },
        {
          heading: 'Orders & payment',
          body: <p>Your order is confirmed once payment is verified by our payment partner, Razorpay. We may cancel and fully refund an order if an item is out of stock or cannot be delivered to your address.</p>
        },
        { heading: 'Your account', body: <p>You are responsible for keeping your account password private and for activity on your account.</p> },
        {
          heading: 'Liability',
          body: <p>To the extent permitted by law, our liability for any order is limited to the amount you paid for it. Nothing in these terms limits your rights under Indian consumer protection law.</p>
        },
        { heading: 'Contact', body: <p>Questions about these terms? Email <strong>{SUPPORT_EMAIL}</strong>.</p> }
      ]}
    />
  );
}
