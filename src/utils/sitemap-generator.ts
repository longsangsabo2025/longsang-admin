// Automatic Sitemap Generator
export interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export interface SitemapOptions {
  baseUrl: string;
  includeImages?: boolean;
  includeNews?: boolean;
}

export class SitemapGenerator {
  private baseUrl: string;
  private urls: SitemapURL[] = [];

  constructor(private options: SitemapOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
  }

  // Add static pages
  addStaticPages() {
    const staticPages = [
      { path: "", priority: "1.0", changefreq: "daily" as const },
      { path: "/about", priority: "0.8", changefreq: "monthly" as const },
      { path: "/contact", priority: "0.7", changefreq: "monthly" as const },
      { path: "/gaming", priority: "0.9", changefreq: "weekly" as const },
      { path: "/tournaments", priority: "0.9", changefreq: "daily" as const },
      { path: "/blog", priority: "0.8", changefreq: "daily" as const },
      { path: "/agents", priority: "0.9", changefreq: "weekly" as const },
    ];

    staticPages.forEach((page) => {
      this.urls.push({
        loc: `${this.baseUrl}${page.path}`,
        lastmod: new Date().toISOString().split("T")[0],
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });
  }

  // Add blog posts from Supabase
  async addBlogPosts(supabaseClient: { from: (table: string) => any }) {
    try {
      const { data: posts, error } = await supabaseClient
        .from("blog_posts")
        .select("slug, updated_at, created_at, status")
        .eq("status", "published")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching blog posts:", error);
        return;
      }

      posts?.forEach((post: { slug: string; updated_at?: string; created_at?: string }) => {
        this.urls.push({
          loc: `${this.baseUrl}/blog/${post.slug}`,
          lastmod: post.updated_at?.split("T")[0] || post.created_at?.split("T")[0],
          changefreq: "weekly",
          priority: "0.8",
        });
      });

      console.log(`Added ${posts?.length || 0} blog posts to sitemap`);
    } catch (error) {
      console.error("Error adding blog posts to sitemap:", error);
    }
  }

  // Add tournament pages
  async addTournaments(supabaseClient: { from: (table: string) => any }) {
    try {
      const { data: tournaments, error } = await supabaseClient
        .from("tournaments")
        .select("id, name, updated_at, status")
        .eq("status", "active")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching tournaments:", error);
        return;
      }

      tournaments?.forEach((tournament: { id: string; updated_at?: string }) => {
        this.urls.push({
          loc: `${this.baseUrl}/tournaments/${tournament.id}`,
          lastmod: tournament.updated_at?.split("T")[0],
          changefreq: "daily",
          priority: "0.9",
        });
      });

      console.log(`Added ${tournaments?.length || 0} tournaments to sitemap`);
    } catch (error) {
      console.error("Error adding tournaments to sitemap:", error);
    }
  }

  // Add agent pages
  async addAgents(supabaseClient: { from: (table: string) => any }) {
    try {
      const { data: agents, error } = await supabaseClient
        .from("ai_agents")
        .select("id, name, updated_at, status")
        .eq("status", "active")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching agents:", error);
        return;
      }

      agents?.forEach((agent: { id: string; updated_at?: string }) => {
        this.urls.push({
          loc: `${this.baseUrl}/agents/${agent.id}`,
          lastmod: agent.updated_at?.split("T")[0],
          changefreq: "weekly",
          priority: "0.7",
        });
      });

      console.log(`Added ${agents?.length || 0} agents to sitemap`);
    } catch (error) {
      console.error("Error adding agents to sitemap:", error);
    }
  }

  // Generate XML sitemap
  generateXML(): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const urlsetClose = "</urlset>";

    const urlEntries = this.urls
      .map((url) => {
        let urlXML = `  <url>
    <loc>${url.loc}</loc>`;

        if (url.lastmod) {
          urlXML += `
    <lastmod>${url.lastmod}</lastmod>`;
        }

        if (url.changefreq) {
          urlXML += `
    <changefreq>${url.changefreq}</changefreq>`;
        }

        if (url.priority) {
          urlXML += `
    <priority>${url.priority}</priority>`;
        }

        urlXML += `
  </url>`;
        return urlXML;
      })
      .join("\n");

    return `${xmlHeader}\n${urlsetOpen}\n${urlEntries}\n${urlsetClose}`;
  }

  // Generate sitemap index for multiple sitemaps
  static generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const sitemapIndexOpen = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const sitemapIndexClose = "</sitemapindex>";

    const sitemapEntries = sitemaps
      .map((sitemap) => {
        let sitemapXML = `  <sitemap>
    <loc>${sitemap.loc}</loc>`;

        if (sitemap.lastmod) {
          sitemapXML += `
    <lastmod>${sitemap.lastmod}</lastmod>`;
        }

        sitemapXML += `
  </sitemap>`;
        return sitemapXML;
      })
      .join("\n");

    return `${xmlHeader}\n${sitemapIndexOpen}\n${sitemapEntries}\n${sitemapIndexClose}`;
  }

  // Generate robots.txt content
  static generateRobotsTxt(baseUrl: string): string {
    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-blog.xml
Sitemap: ${baseUrl}/sitemap-tournaments.xml

# Block admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /*.json$
Disallow: /*.xml$

# Allow important resources
Allow: /api/og
Allow: /assets/
Allow: /images/
Allow: /_next/static/

# Crawl delay for politeness
Crawl-delay: 1`;
  }
}

// Utility function to generate complete sitemap
export async function generateCompleteSitemap(
  supabaseClient: { from: (table: string) => any },
  baseUrl: string
): Promise<{ main: string; blog: string; tournaments: string; robots: string }> {
  // Main sitemap
  const mainSitemap = new SitemapGenerator({ baseUrl });
  mainSitemap.addStaticPages();
  await mainSitemap.addAgents(supabaseClient);

  // Blog sitemap
  const blogSitemap = new SitemapGenerator({ baseUrl });
  await blogSitemap.addBlogPosts(supabaseClient);

  // Tournaments sitemap
  const tournamentSitemap = new SitemapGenerator({ baseUrl });
  await tournamentSitemap.addTournaments(supabaseClient);

  return {
    main: mainSitemap.generateXML(),
    blog: blogSitemap.generateXML(),
    tournaments: tournamentSitemap.generateXML(),
    robots: SitemapGenerator.generateRobotsTxt(baseUrl),
  };
}

// Auto-update sitemap function (call this on content updates)
export async function updateSitemap(
  supabaseClient: { from: (table: string) => any },
  baseUrl: string
) {
  try {
    const sitemaps = await generateCompleteSitemap(supabaseClient, baseUrl);

    // Here you would save the sitemaps to your storage/CDN
    // For example, save to Supabase Storage or update database
    console.log("Sitemaps generated successfully");
    console.log("Main sitemap URLs:", sitemaps.main.split("<url>").length - 1);
    console.log("Blog sitemap URLs:", sitemaps.blog.split("<url>").length - 1);
    console.log("Tournament sitemap URLs:", sitemaps.tournaments.split("<url>").length - 1);

    return sitemaps;
  } catch (error) {
    console.error("Error generating sitemaps:", error);
    throw error;
  }
}
