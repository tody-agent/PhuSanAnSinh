import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().optional(),
        category: z.enum([
            'mang-thai',
            'phu-khoa',
            'vo-sinh',
            'nam-khoa',
            'suc-khoe-sinh-san',
            'local-seo',
            'hiem-muon',
            'sieu-am',
        ]),
        tags: z.array(z.string()).default([]),
        author: z.string().default('BS. An Sinh'),
        readingTime: z.number().optional(),
        featured: z.boolean().default(false),
    }),
});

export const collections = { blog };
