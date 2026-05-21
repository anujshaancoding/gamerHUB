import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Disclaimer & Intellectual Property Notice",
  description:
    "ggLobby is an independent, fan-made platform. VALORANT and all related assets, trademarks, and intellectual property are the property of Riot Games, Inc.",
  alternates: { canonical: "https://gglobby.in/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-text mb-2">
          Legal Disclaimer & Intellectual Property Notice
        </h1>
        <p className="text-text-muted mb-8">Last updated: May 18, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text">1. Independent Fan Platform</h2>
            <p>
              ggLobby (&quot;the Service&quot;) is an independent, community-driven platform built by and
              for gamers. It is <strong>not affiliated with, endorsed, sponsored, or specifically
              approved</strong> by Riot Games, Inc., or any of its subsidiaries or affiliates. Any
              opinions expressed on the Service are those of ggLobby and its community, and do not
              reflect the views of Riot Games.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">
              2. Ownership of Game Assets &amp; Trademarks
            </h2>
            <p>
              All game-related content displayed on ggLobby — including but not limited to game
              titles, logos, agent and character names and likenesses, weapon and skin imagery, map
              names and artwork, in-game screenshots, icons, fonts, sounds, and other visual or
              audio assets (collectively, &quot;Game Assets&quot;) — are the exclusive property of their
              respective owners. ggLobby claims <strong>no ownership</strong> over any Game Assets
              and uses them only for informational, reference, and community purposes.
            </p>
            <p>
              <strong>VALORANT</strong> and all related assets, trademarks, and copyrights are the
              exclusive property of <strong>Riot Games, Inc.</strong> All trademarks, service marks,
              trade names, and registered trademarks are the property of their respective holders.
              Reference to any product, game, or company does not constitute or imply endorsement,
              sponsorship, or recommendation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">
              3. Riot Games Fan Content Notice
            </h2>
            <p>
              ggLobby was created under Riot Games&apos; &quot;Legal Jibber Jabber&quot; policy using assets
              owned by Riot Games. Riot Games does not endorse or sponsor this project.
            </p>
            <p>
              VALORANT&copy; Riot Games, Inc. All rights to VALORANT, its characters, artwork, and
              related content are reserved by Riot Games. ggLobby&apos;s use of this content falls
              within Riot Games&apos; fan-content guidelines and is non-commercial in respect of those
              assets.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">4. Fair Use &amp; Purpose</h2>
            <p>
              Game Assets are used on ggLobby for the purposes of identification, commentary,
              criticism, news reporting, statistics, education, and community discussion. We believe
              such use constitutes &quot;fair use&quot; / &quot;fair dealing&quot; under applicable copyright law. No
              copyright or trademark infringement is intended, and ggLobby does not claim any
              official association with the rights holders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">
              5. User-Generated Content
            </h2>
            <p>
              Some content on ggLobby is submitted by users (such as crosshair codes, sensitivity
              configs, blog posts, images, and comments). ggLobby does not verify the originality or
              licensing of user-submitted content and is not responsible for it. Users are solely
              responsible for ensuring they have the rights to any content they upload. See our{" "}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a> for
              more details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">
              6. No Warranty on Accuracy
            </h2>
            <p>
              Statistics, rankings, patch information, and other game data presented on ggLobby are
              provided for informational purposes only and may not be accurate, complete, or current.
              ggLobby is not an official source for VALORANT and makes no warranties regarding the
              accuracy of any third-party game data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">
              7. Copyright Concerns &amp; Takedown Requests
            </h2>
            <p>
              We respect the intellectual property rights of others. If you are a rights holder (or
              an authorized representative) and believe that content on ggLobby infringes your
              copyright or trademark, or if you would like specific Game Assets removed, please
              contact us and we will respond promptly:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The specific content or asset in question (with URLs).</li>
              <li>Proof of ownership or authorization to act on the owner&apos;s behalf.</li>
              <li>Your contact information.</li>
            </ul>
            <p className="mt-2">
              Send requests to{" "}
              <a href="mailto:legal@gglobby.in" className="text-primary hover:underline">
                legal@gglobby.in
              </a>
              . We will review and, where appropriate, remove or modify the content in question
              without undue delay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">8. Changes to This Notice</h2>
            <p>
              We may update this Legal Disclaimer from time to time to reflect changes in our
              practices or the requirements of rights holders. The &quot;Last updated&quot; date above
              indicates when this notice was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text">9. Contact</h2>
            <p>
              For any questions regarding this notice or intellectual property matters, contact us
              at{" "}
              <a href="mailto:legal@gglobby.in" className="text-primary hover:underline">
                legal@gglobby.in
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
