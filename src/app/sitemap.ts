import { MetadataRoute } from 'next';
import type { SanityDocument } from '@sanity/client';
import { client } from '@/sanity/lib/client';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

async function getData() {
	const query = `*[_type == "post"] {
    "currentSlug": slug.current,
      publishedAt
  }`;
	const data = await client.fetch(query);
	return data;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const data = await getData();
	const posts: MetadataRoute.Sitemap = data.map((post: SanityDocument) => ({
		url: `${BASE_URL}/blog/${post.currentSlug}`,
		lastModified: post.publishedAt,
		changeFrequency: 'daily',
		priority: 0.8,
	}));

	return [
		{
			url: BASE_URL,
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 1,
		},
		{
			url: `${BASE_URL}/privacy`,
			lastModified: new Date(),
			changeFrequency: 'yearly',
			priority: 0.7,
		},
        {
			url: `${BASE_URL}/terms`,
			lastModified: new Date(),
			changeFrequency: 'yearly',
			priority: 0.7,
		},
        {
			url: `${BASE_URL}/refund`,
			lastModified: new Date(),
			changeFrequency: 'yearly',
			priority: 0.7,
		},
		{
			url: `${BASE_URL}/blog`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.9,
		},
		...posts,
	];
}