import React from 'react';
import PolicyPage, { SUPPORT_EMAIL } from './storefront/PolicyPage';

interface PrivacyPolicyProps {
  onNavigate: (tab: string) => void;
}

// Template — review and adapt before relying on it (see PolicyPage.tsx).
export default function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
  return (
    <PolicyPage
      title="Privacy policy"
      intro="What we collect, why, and the choices you have."
      onNavigate={onNavigate}
      sections={[
        {
          heading: 'What we collect',
          body: (
            <ul>
              <li>Your name, email, phone number and delivery address when you order or create an account</li>
              <li>Your order history and wishlist</li>
              <li>Basic technical data such as browser type, collected through cookies</li>
            </ul>
          )
        },
        {
          heading: 'How we use it',
          body: (
            <ul>
              <li>To process, deliver and support your orders</li>
              <li>To run your account and wishlist</li>
              <li>To send marketing emails, only if you opt in — you can unsubscribe at any time</li>
            </ul>
          )
        },
        { heading: 'Payments', body: <p>Payments are handled by Razorpay. Your card and UPI details are entered in Razorpay’s secure checkout and are never stored by us.</p> },
        {
          heading: 'Who we share it with',
          body: <p>Only the services needed to run the store: our payment partner, delivery couriers, email provider and hosting providers. We do not sell your personal data.</p>
        },
        { heading: 'Cookies', body: <p>We use essential cookies to keep your bag and sign-in working. You can control cookies in your browser settings.</p> },
        {
          heading: 'Your rights',
          body: <p>You can ask to see, correct or delete your personal data by emailing <strong>{SUPPORT_EMAIL}</strong>. We will respond within 30 days.</p>
        }
      ]}
    />
  );
}
