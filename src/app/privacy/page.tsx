import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | ggLobby",
  description: "Learn how ggLobby collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-text mb-2">Privacy Policy</h1>
        <p className="text-text-muted mb-8">Last updated: February 20, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text">1. Introduction</h2>
            <p>
              Welcome to ggLobby (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We are committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our platform at gglobby.com and associated services
              (collectively, the &quot;Service&quot;).
            </p>
            <p>
              By using the Service, you agree to the collection and use of information in accordance
              with this policy. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-text mt-4">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> Email address, username, display name, password (hashed), and date of birth.</li>
              <li><strong>Profile Information:</strong> Avatar image, bio, gaming preferences, linked game accounts (e.g., Riot ID, Steam ID, Discord tag), and rank/stats you choose to display.</li>
              <li><strong>Content:</strong> Blog posts, community posts, comments, messages, and media you upload.</li>
              <li><strong>Social Connections:</strong> Friend requests, follows, clan memberships, and block lists.</li>
              <li><strong>Payment Information:</strong> If you subscribe to ggLobby Pro, payment is processed by Stripe. We do not store your credit card details.</li>
            </ul>

            <h3 className="text-lg font-medium text-text mt-4">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Device Information:</strong> Browser type, operating system, device type, and screen resolution.</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, and interaction patterns.</li>
              <li><strong>IP Address:</strong> Used for security, fraud prevention, and approximate location (country/region).</li>
              <li><strong>Cookies:</strong> Essential cookies for authentication and session management. See Section 7.</li>
            </ul>

            <h3 className="text-lg font-medium text-text mt-4">2.3 Information from Third Parties</h3>
            <p>
              If you link your gaming accounts (Riot Games, Steam, Discord, etc.), we may receive
              your public profile information, game statistics, and rank data from those platforms
              in accordance with their APIs and terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To create and manage your account.</li>
              <li>To display your profile and connect you with other gamers.</li>
              <li>To provide matchmaking, LFG (Looking for Group), and clan features.</li>
              <li>To deliver and improve the Service, including personalized suggestions.</li>
              <li>To process payments for premium features.</li>
              <li>To send important notifications (friend requests, messages, security alerts).</li>
              <li>To moderate content and enforce our Community Guidelines and Terms of Service.</li>
              <li>To detect and prevent fraud, abuse, and security threats.</li>
              <li>To analyze usage patterns and improve the platform (aggregated, anonymized data).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">4. How We Share Your Information</h2>
            <p>We do <strong>not</strong> sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Other Users:</strong> Your public profile, posts, and clan activity are visible to other users as part of the Service.</li>
              <li><strong>Service Providers:</strong> We use trusted third-party services to operate the platform:
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li>Supabase — Database, authentication, and file storage</li>
                  <li>Vercel — Hosting and deployment</li>
                  <li>Stripe — Payment processing</li>
                  <li>LiveKit — Voice and video communication</li>
                </ul>
              </li>
              <li><strong>Legal Requirements:</strong> If required by law, court order, or governmental request.</li>
              <li><strong>Safety:</strong> To protect the rights, property, or safety of ggLobby, our users, or the public.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed
              to provide the Service. If you delete your account, we will delete your personal data
              within 30 days, except where we are required to retain it by law (e.g., transaction records).
            </p>
            <p>
              Messages in conversations may remain visible to other participants even after account deletion.
              Community posts and blog content will be anonymized upon deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">6. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
              <li><strong>Deletion:</strong> Request deletion of your account and personal data.</li>
              <li><strong>Export:</strong> Request a machine-readable export of your data.</li>
              <li><strong>Objection:</strong> Object to certain processing of your data.</li>
              <li><strong>Withdraw Consent:</strong> Where processing is based on consent, withdraw it at any time.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, visit your <strong>Settings</strong> page or contact us at{" "}
              <a href="mailto:privacy@gglobby.com" className="text-primary hover:underline">privacy@gglobby.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">7. Cookies</h2>
            <p>We use the following types of cookies:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Essential Cookies:</strong> Required for authentication, session management, and security. The Service cannot function without these.</li>
              <li><strong>Preference Cookies:</strong> Remember your settings such as theme and language.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how the Service is used (aggregated data only). You can opt out of these in your settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">8. Children&apos;s Privacy</h2>
            <p>
              ggLobby is not intended for users under the age of 13. We do not knowingly collect
              personal information from children under 13. If we learn that we have collected data
              from a child under 13, we will delete it promptly. If you believe a child under 13
              has provided us with personal information, please contact us at{" "}
              <a href="mailto:privacy@gglobby.com" className="text-primary hover:underline">privacy@gglobby.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">9. Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including
              encrypted connections (HTTPS/TLS), hashed passwords, row-level security policies,
              and secure authentication tokens. However, no method of transmission over the
              Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">10. International Data Transfers</h2>
            <p>
              Your data may be processed and stored in servers located outside your country of
              residence. By using the Service, you consent to the transfer of your information
              to countries that may have different data protection laws than your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting a notice on the Service or sending you an email. Your continued use
              of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p className="mt-2">
              <a href="mailto:privacy@gglobby.com" className="text-primary hover:underline">privacy@gglobby.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
