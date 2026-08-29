import AppShell from '@/builder/AppShell';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/seo/site';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web browser',
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <AppShell />
    </>
  );
}
