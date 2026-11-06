import React from 'react';
import PolicyPage, { SUPPORT_EMAIL } from './storefront/PolicyPage';

interface ShippingPolicyProps {
  onNavigate: (tab: string) => void;
}

// Template — review and adapt before relying on it (see PolicyPage.tsx).
export default function ShippingPolicy({ onNavigate }: ShippingPolicyProps) {
  return (
    <PolicyPage
      title="Shipping policy"
      intro="How and when your order reaches you."
      onNavigate={onNavigate}
      sections={[
        { heading: 'Where we deliver', body: <p>We deliver to addresses across India. We do not currently ship internationally.</p> },
        {
          heading: 'Dispatch & delivery times',
          body: (
            <>
              <p>Orders are dispatched within 1–2 working days of payment. Delivery usually takes 3–7 working days after dispatch, depending on your PIN code.</p>
              <p>Sale periods and public holidays can add a day or two; we will email you if your order is delayed.</p>
            </>
          )
        },
        { heading: 'Delivery charges', body: <p>Delivery is free on orders above ₹1,999. Below that, a standard delivery charge is shown at checkout before you pay.</p> },
        { heading: 'Tracking your order', body: <p>When your order ships we email you the courier name and tracking number. You can also see it under My Account → Orders.</p> },
        {
          heading: 'Problems with delivery',
          body: <p>If your parcel is late, damaged or missing, email <strong>{SUPPORT_EMAIL}</strong> with your order number and we will sort it out with the courier.</p>
        }
      ]}
    />
  );
}
