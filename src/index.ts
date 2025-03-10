import { parseHTML } from 'linkedom';
import OpenAI from 'openai';
import { Resend } from 'resend';

type Bindings = {
	EMAIL_FROM: string;
	EMAIL_TO: string;
	OPENAI_API_KEY: string;
	RESEND_API_KEY: string;
};

export default {
	async scheduled(controller, env, ctx) {
		const topStories = (await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
			.then((response) => response.json() as Promise<number[]>)
			.then((ids) => ids.slice(0, 50))
			.then((ids) =>
				Promise.all(ids.map((id) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((response) => response.json()))),
			)
			.then((stories) => stories.sort((a: any, b: any) => b.score - a.score).slice(0, 3))) as {
			id: number;
			title: string;
			url: string;
			kids: number[];
		}[];

		const news = await Promise.all(
			topStories.map(async (story) => {
				const newsDom = parseHTML(await fetch(story.url).then((response) => response.text()));
				const comments = await Promise.all(
					story.kids.map(async (id) => {
						const comment = (await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((response) => response.json())) as {
							text: string;
						};
						return comment.text;
					}),
				);
				return {
					title: story.title,
					url: story.url,
					news: newsDom.window.document.querySelector('body')?.textContent as string,
					comments,
				};
			}),
		);

		const client = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		});
		const completion = await client.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [
				{
					role: 'user',
					content: `The following is data collected from 3 top news articles and comments from Hacker News.
Please summarize the content of the articles and describe how people are reacting to them in the comments.

Please output in the following format:
- Title: <title> (URL: <url>)
- Summary: <summary>
- How people are reacting: <comments>

${JSON.stringify(news)}`,
				},
			],
		});

		const resend = new Resend(env.RESEND_API_KEY);
		await resend.emails.send({
			from: env.EMAIL_FROM,
			to: env.EMAIL_TO,
			subject: "Today's Hacker News",
			text: completion.choices[0].message.content ?? '',
		});
	}
} satisfies ExportedHandler<Bindings>;
