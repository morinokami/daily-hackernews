import { Readability } from '@mozilla/readability';
import { render } from '@react-email/render';
import { parseHTML } from 'linkedom';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import * as React from 'react';
import { Resend } from 'resend';
import { z } from 'zod';

import Email from './emails/my-email';

type Bindings = {
	EMAIL_FROM: string;
	EMAIL_TO: string;
	OPENAI_API_KEY: string;
	RESEND_API_KEY: string;
};

const NUM_NEWS = 5;

const SummarySchema = z.object({
	summaries: z.array(
		z.object({
			id: z.number(),
			newsTitle: z.string(),
			url: z.string(),
			newsSummary: z.string(),
			commentsSummary: z.string(),
		}),
	),
});

export default {
	async fetch(request, env, ctx) {
		return new Response('OK', { status: 200 });
	},
	async scheduled(controller, env, ctx) {
		const topStories = (await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
			.then((response) => response.json() as Promise<number[]>)
			.then((ids) => ids.slice(0, 10))
			.then((ids) =>
				Promise.all(ids.map((id) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((response) => response.json()))),
			)
			.then((stories) => stories.sort((a: any, b: any) => b.score - a.score).slice(0, NUM_NEWS))) as {
			id: number;
			title: string;
			url: string;
			kids: number[];
		}[];

		const news = await Promise.all(
			topStories.map(async (story) => {
				let newsContent: ReturnType<typeof Readability.prototype.parse> | null = null;
				if (!story.url.endsWith('.pdf')) {
					const newsDom = parseHTML(await fetch(story.url).then((response) => response.text()));
					try {
						newsContent = new Readability(newsDom.window.document).parse();
					} catch (error) {
						console.log(`Failed to parse ${story.url}`);
						console.error(error);
					}
				}
				const comments = await Promise.all(
					story.kids.map(async (id) => {
						const comment = (await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((response) => response.json())) as {
							text: string;
						};
						return comment.text;
					}),
				);
				return {
					id: story.id,
					newsTitle: story.title,
					url: story.url,
					news: newsContent?.textContent ?? '',
					comments,
				};
			}),
		);

		const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		});
		const completion = await openai.beta.chat.completions.parse({
			model: 'gpt-4o',
			messages: [
				{
					role: 'user',
					content: `The following is data collected from ${NUM_NEWS} top news articles and comments from Hacker News.
Please summarize the content of the articles and describe how people are reacting to them in the comments.
Note that the articles are from various sources and it's possible that some of them may be empty or contain irrelevant information.

${JSON.stringify(news)}`,
				},
			],
			response_format: zodResponseFormat(SummarySchema, 'summaries'),
		});
		console.log(completion.usage);

		const { parsed } = completion.choices[0].message;
		if (parsed !== null) {
			const resend = new Resend(env.RESEND_API_KEY);
			const resendResult = await resend.emails.send({
				from: env.EMAIL_FROM,
				to: env.EMAIL_TO,
				subject: "Today's Hacker News",
				html: await render(React.createElement(Email, { summaries: parsed.summaries })),
			});
			console.log(resendResult);
		}
	},
} satisfies ExportedHandler<Bindings>;
