export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  guid: string | null;
  content: string | null;
  thumbnail: string | null;
}

function extractText(xml: string, tag: string): string | null {
  // Match both <tag>content</tag> and <tag><![CDATA[content]]></tag>
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
  const match = xml.match(regex);
  if (!match) return null;
  return match[1].trim();
}

function extractAttribute(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function extractThumbnail(itemXml: string): string | null {
  // Try media:content url
  const mediaContent = extractAttribute(itemXml, 'media:content', 'url');
  if (mediaContent) return mediaContent;

  // Try media:thumbnail url
  const mediaThumbnail = extractAttribute(itemXml, 'media:thumbnail', 'url');
  if (mediaThumbnail) return mediaThumbnail;

  // Try enclosure url (for image types)
  const enclosureMatch = itemXml.match(/<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]*)"/i)
    || itemXml.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image[^"]*"/i);
  if (enclosureMatch) return enclosureMatch[1];

  // Try first img src in content/description
  const content = extractText(itemXml, 'content:encoded') || extractText(itemXml, 'description') || '';
  const imgMatch = content.match(/<img[^>]*src="([^"]*)"/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

function parseRSSItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  // Split by <item> tags (RSS 2.0)
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractText(itemXml, 'title');
    const link = extractText(itemXml, 'link');

    if (!title || !link) continue;

    // Strip HTML from description for excerpt
    const rawDescription = extractText(itemXml, 'description') || '';
    const description = rawDescription.replace(/<[^>]*>/g, '').trim();

    items.push({
      title: title.replace(/<[^>]*>/g, '').trim(),
      link: link.trim(),
      description: description.substring(0, 500),
      pubDate: extractText(itemXml, 'pubDate'),
      guid: extractText(itemXml, 'guid') || link.trim(),
      content: extractText(itemXml, 'content:encoded'),
      thumbnail: extractThumbnail(itemXml),
    });
  }

  return items;
}

function parseAtomItems(xml: string): RSSItem[] {
  const items: RSSItem[] = [];

  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    const title = extractText(entryXml, 'title');

    // Atom links use href attribute
    const link = extractAttribute(entryXml, 'link', 'href');

    if (!title || !link) continue;

    const rawSummary = extractText(entryXml, 'summary') || extractText(entryXml, 'content') || '';
    const description = rawSummary.replace(/<[^>]*>/g, '').trim();

    items.push({
      title: title.replace(/<[^>]*>/g, '').trim(),
      link: link.trim(),
      description: description.substring(0, 500),
      pubDate: extractText(entryXml, 'published') || extractText(entryXml, 'updated'),
      guid: extractText(entryXml, 'id') || link.trim(),
      content: extractText(entryXml, 'content'),
      thumbnail: extractThumbnail(entryXml),
    });
  }

  return items;
}

export async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'GamerHub/1.0 (News Aggregator)',
      'Accept': 'application/rss+xml, application/xml, application/atom+xml, text/xml',
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();

  // Detect feed type and parse accordingly
  if (xml.includes('<feed') && xml.includes('xmlns="http://www.w3.org/2005/Atom"')) {
    return parseAtomItems(xml);
  }

  return parseRSSItems(xml);
}
