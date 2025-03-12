import { z } from 'zod';

import { Html, Markdown } from '@react-email/components';

export const SummarySchema = z.object({
	id: z.number(),
	newsTitle: z.string(),
	url: z.string(),
	newsSummary: z.string(),
	commentsSummary: z.string(),
});

export default function Email({ summaries }: { summaries: z.infer<typeof SummarySchema>[] }) {
	return (
		<Html>
			<Markdown>{`
Here are the today's top stories from Hacker News:

${summaries.map(({ id, newsTitle, url, newsSummary, commentsSummary }, index) => buildItem({ id, newsTitle, url, newsSummary, commentsSummary }, index)).join('\n')}
`}</Markdown>
		</Html>
	);
}

Email.PreviewProps = {
	summaries: [
		{
			id: 1,
			newsTitle: 'Example News Title',
			url: 'https://example.com',
			newsSummary: 'Example news summary',
			commentsSummary: 'Example comments summary',
		},
	],
};

function buildItem(
	{
		id,
		newsTitle,
		url,
		newsSummary,
		commentsSummary,
	}: {
		id: number;
		newsTitle: string;
		url: string;
		newsSummary: string;
		commentsSummary: string;
	},
	index: number,
) {
	return `${index + 1}. [${newsTitle}](${url}) ([Comments](https://news.ycombinator.com/item?id=${id}))
    - Summary: ${newsSummary}
    - How people reacted: ${commentsSummary}
`;
}
