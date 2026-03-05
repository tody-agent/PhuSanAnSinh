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
            'cong-cu',
        ]),
        tags: z.array(z.string()).default([]),
        author: z.string().default('BS. An Sinh'),
        readingTime: z.number().optional(),
        featured: z.boolean().default(false),
    }),
});

const handbook = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        category: z.enum([
            'nen-tang',
            'vo-sinh-hiem-muon',
            'ho-tro-sinh-san',
            'di-truyen',
            'phu-khoa',
            'san-khoa',
            'hau-san',
        ]),
        tags: z.array(z.string()).default([]),
        author: z.string().default('Giáo sư Sản Phụ khoa'),
        readingTime: z.number().optional(),
        volume: z.string().optional(),
    }),
});

export const collections = { blog, handbook };

