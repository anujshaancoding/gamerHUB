import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the terms and conditions for using ggLobby.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-text mb-2">Terms of Service</h1>
        <p className="text-text-muted mb-8">Last updated: February 20, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ggLobby (&quot;the Service&quot;), you agree to be bound by these Terms of
              Service (&quot;Terms&quot;). If you do not agree, you may not use the Service. These Terms
              constitute a legally binding agreement between you and ggLobby.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">2. Eligibility</h2>
            <p>
              You must be at least <strong>13 years of age</strong> to create an account and use ggLobby.
              By registering, you represent and warrant that you meet this age requirement. If you are
              between 13 and 18 years old (or the age of majority in your jurisdiction), you must have
              your parent or legal guardian&apos;s consent to use the Service.
            </p>
            <p>
              We reserve the right to terminate accounts that we reasonably believe belong to users
              under 13 years of age.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">3. Your Account</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must not share your account with others or create multiple accounts.</li>
              <li>You must provide accurate and truthful information during registration.</li>
              <li>You must notify us immediately if you suspect unauthorized access to your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">4. User Conduct</h2>
            <p>When using ggLobby, you agree <strong>not</strong> to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Harass, bully, threaten, or intimidate other users.</li>
              <li>Post hate speech, discriminatory content, or content that promotes violence.</li>
              <li>Share NSFW, sexually explicit, or illegal content.</li>
              <li>Impersonate other users, public figures, or ggLobby staff.</li>
              <li>Doxx (share private/personal information of others without consent).</li>
              <li>Spam, flood, or disrupt the Service or other users&apos; experience.</li>
              <li>Promote or facilitate cheating, hacking, or exploiting in games.</li>
              <li>Promote account boosting, selling, or real-money trading of in-game items.</li>
              <li>Attempt to rig tournaments, manipulate rankings, or defraud other users.</li>
              <li>Use bots, scrapers, or automated tools to access the Service without authorization.</li>
              <li>Attempt to gain unauthorized access to the Service, other accounts, or systems.</li>
              <li>Use the Service for any illegal purpose.</li>
            </ul>
            <p className="mt-2">
              Violations may result in content removal, account suspension, or permanent ban at our
              sole discretion. Please also review our{" "}
              <a href="/guidelines" className="text-primary hover:underline">Community Guidelines</a> for
              detailed rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">5. User Content</h2>

            <h3 className="text-lg font-medium text-text mt-4">5.1 Ownership</h3>
            <p>
              You retain ownership of the content you create and post on ggLobby (blog posts,
              comments, images, etc.). By posting content, you grant ggLobby a non-exclusive,
              worldwide, royalty-free license to use, display, reproduce, and distribute your
              content in connection with operating and promoting the Service.
            </p>

            <h3 className="text-lg font-medium text-text mt-4">5.2 Content Responsibility</h3>
            <p>
              You are solely responsible for the content you post. We do not endorse or guarantee
              the accuracy of user-generated content. We reserve the right to remove any content
              that violates these Terms or our Community Guidelines.
            </p>

            <h3 className="text-lg font-medium text-text mt-4">5.3 DMCA / Copyright</h3>
            <p>
              We respect intellectual property rights. If you believe content on ggLobby infringes
              your copyright, please send a DMCA takedown notice to{" "}
              <a href="mailto:legal@gglobby.in" className="text-primary hover:underline">legal@gglobby.in</a>{" "}
              with:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A description of the copyrighted work.</li>
              <li>The URL of the infringing content on ggLobby.</li>
              <li>Your contact information.</li>
              <li>A statement of good faith belief that the use is not authorized.</li>
              <li>A statement under penalty of perjury that the information is accurate.</li>
              <li>Your physical or electronic signature.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">6. Premium Services</h2>
            <p>
              ggLobby offers optional premium features (&quot;ggLobby Pro&quot;) available via paid subscription.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Subscriptions are billed monthly or annually through Stripe.</li>
              <li>You can cancel your subscription at any time from your Settings page.</li>
              <li>Upon cancellation, you retain access until the end of your current billing period.</li>
              <li>Refunds are handled on a case-by-case basis. Contact us within 7 days of purchase.</li>
              <li>We reserve the right to change pricing with 30 days&apos; notice to active subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">7. Moderation and Enforcement</h2>
            <p>We reserve the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Remove any content that violates these Terms or Community Guidelines.</li>
              <li>Issue warnings, temporary mutes, suspensions, or permanent bans.</li>
              <li>Restrict access to certain features for users who violate rules.</li>
              <li>Cooperate with law enforcement if required by law.</li>
            </ul>
            <p className="mt-2">
              Our moderation decisions are final, though we provide an appeal process for
              permanent bans. See our{" "}
              <a href="/guidelines" className="text-primary hover:underline">Community Guidelines</a> for
              the full enforcement ladder.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">8. Third-Party Services</h2>
            <p>
              ggLobby integrates with third-party gaming platforms and services (Riot Games, Steam,
              Discord, etc.). Your use of those platforms is governed by their respective terms of
              service and privacy policies. We are not responsible for the content, policies, or
              practices of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">9. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
              express or implied. We do not guarantee that the Service will be uninterrupted,
              error-free, or secure. We do not warrant the accuracy, reliability, or completeness
              of any content on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ggLobby and its operators shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising from
              your use of the Service, including but not limited to loss of data, profits, or
              goodwill. Our total liability for any claim shall not exceed the amount you paid to
              us in the 12 months preceding the claim, or $100, whichever is greater.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless ggLobby and its operators from any claims,
              damages, or expenses arising from your use of the Service, your content, or your
              violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes
              by posting a notice on the Service or sending you an email at least 14 days before
              the changes take effect. Your continued use of the Service after changes constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">13. Termination</h2>
            <p>
              You may delete your account at any time from your Settings page. We may suspend or
              terminate your account if you violate these Terms. Upon termination, your right to
              use the Service ceases immediately, and we may delete your data in accordance with
              our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws.
              Any disputes arising from these Terms or the Service shall be resolved through good
              faith negotiation first, and if unresolved, through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">15. Contact</h2>
            <p>
              For questions about these Terms, contact us at:{" "}
              <a href="mailto:legal@gglobby.in" className="text-primary hover:underline">legal@gglobby.in</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
