import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines | ggLobby",
  description: "The rules that keep ggLobby a positive, fair, and fun gaming community for everyone.",
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-text mb-2">Community Guidelines</h1>
        <p className="text-text-muted mb-8">Last updated: February 20, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-text-secondary">
          <section>
            <p className="text-lg text-text">
              ggLobby is built by gamers, for gamers. These guidelines exist to keep our community
              positive, fair, and fun. Think of them as the rulebook for our lobby &mdash; follow
              them and everyone has a good time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">1. Respect Everyone</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>No harassment or bullying.</strong> Disagreements happen, but personal attacks, threats, and targeted harassment are never okay.</li>
              <li><strong>No hate speech.</strong> Discrimination based on race, ethnicity, gender, sexual orientation, religion, disability, or any other characteristic will not be tolerated.</li>
              <li><strong>No doxxing.</strong> Never share someone&apos;s real name, address, phone number, or other private information without their explicit consent.</li>
              <li><strong>Be a good teammate.</strong> Toxicity drives people away from gaming. We&apos;re here to lift each other up, not tear each other down.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">2. Keep It Clean</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>No NSFW content.</strong> This includes sexually explicit images, graphic violence, and gore. ggLobby is open to users 13+.</li>
              <li><strong>No illegal content.</strong> Don&apos;t post anything that violates any law, including pirated software, illegal drugs, or weapons.</li>
              <li><strong>Keep language reasonable.</strong> Casual swearing in the heat of the moment is fine. Targeted slurs and excessive profanity are not.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">3. Play Fair</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>No cheating promotion.</strong> Don&apos;t share, promote, or discuss game hacks, exploits, aimbots, or cheating tools.</li>
              <li><strong>No account boosting or selling.</strong> Don&apos;t offer or request account boosting services, account selling, or rank manipulation.</li>
              <li><strong>No real-money trading.</strong> Don&apos;t use ggLobby to trade in-game items for real money unless the game officially supports it.</li>
              <li><strong>No tournament rigging.</strong> Match-fixing, win-trading, or any form of competitive manipulation will result in a permanent ban.</li>
              <li><strong>Represent yourself honestly.</strong> Don&apos;t fake your rank, stats, or achievements. Your fellow gamers deserve honesty.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">4. No Spam or Scams</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>No spam.</strong> Don&apos;t flood chat, post repetitive content, or send unsolicited messages to users.</li>
              <li><strong>No self-promotion spam.</strong> Sharing your content is fine. Posting your YouTube/Twitch link in every conversation is not.</li>
              <li><strong>No scams or phishing.</strong> Don&apos;t try to trick users into giving away their account credentials, personal info, or money.</li>
              <li><strong>No impersonation.</strong> Don&apos;t pretend to be another user, a pro player, or a ggLobby staff member.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">5. Clan Rules</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Clan names and descriptions must follow all guidelines above.</li>
              <li>Clan leaders are responsible for their members&apos; conduct within clan spaces.</li>
              <li>Clans with repeated violations may be disbanded.</li>
              <li>Don&apos;t create clans with offensive, discriminatory, or misleading names.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">6. Blog &amp; Content Rules</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Give credit where it&apos;s due. Don&apos;t plagiarize.</li>
              <li>Don&apos;t post misleading or intentionally false information.</li>
              <li>Constructive criticism of games and players is welcome. Hit pieces and targeted negativity are not.</li>
              <li>Respect copyright. Only upload images and media you have the right to use.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">7. What Happens If You Break the Rules</h2>
            <p>We use a progressive enforcement system:</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-light border border-border">
                <span className="shrink-0 w-8 h-8 rounded-full bg-warning/20 text-warning flex items-center justify-center font-bold text-sm">1</span>
                <div>
                  <p className="font-medium text-text">Warning</p>
                  <p className="text-sm text-text-muted">First offense for minor violations. Your content may be removed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-light border border-border">
                <span className="shrink-0 w-8 h-8 rounded-full bg-warning/30 text-warning flex items-center justify-center font-bold text-sm">2</span>
                <div>
                  <p className="font-medium text-text">24-Hour Mute</p>
                  <p className="text-sm text-text-muted">Repeated minor violations. You can browse but cannot post, comment, or message.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-light border border-border">
                <span className="shrink-0 w-8 h-8 rounded-full bg-error/20 text-error flex items-center justify-center font-bold text-sm">3</span>
                <div>
                  <p className="font-medium text-text">7-Day Suspension</p>
                  <p className="text-sm text-text-muted">Serious or continued violations. Full account suspension for one week.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-light border border-border">
                <span className="shrink-0 w-8 h-8 rounded-full bg-error/30 text-error flex items-center justify-center font-bold text-sm">4</span>
                <div>
                  <p className="font-medium text-text">Permanent Ban</p>
                  <p className="text-sm text-text-muted">Severe violations (doxxing, threats, illegal activity) or repeated offenses. Permanent removal from the platform.</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-text-muted">
              Severe violations such as doxxing, credible threats, illegal content, or CSAM will
              result in an <strong>immediate permanent ban</strong> without prior warnings and may
              be reported to law enforcement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">8. Appeals</h2>
            <p>
              If you believe you were banned unfairly, you can appeal by emailing{" "}
              <a href="mailto:appeals@gglobby.com" className="text-primary hover:underline">appeals@gglobby.com</a>{" "}
              with your username and a description of the situation. We review appeals within 7
              business days. Appeal decisions are final.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">9. Reporting</h2>
            <p>
              If you see someone breaking these guidelines, please report them using the report
              button on their profile, post, or message. You can also email{" "}
              <a href="mailto:reports@gglobby.com" className="text-primary hover:underline">reports@gglobby.com</a>.
              All reports are reviewed by our moderation team and kept confidential.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <p className="text-text-muted">
              These guidelines may be updated as our community grows. We&apos;ll announce significant
              changes. By using ggLobby, you agree to follow these guidelines. Let&apos;s build the
              best gaming community together. GG!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
