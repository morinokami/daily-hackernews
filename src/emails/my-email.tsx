import { Html, Markdown } from '@react-email/components';
import * as React from 'react';

export default function Email({
	summaries,
}: {
	summaries: {
		id: number;
		newsTitle: string;
		url: string;
		newsSummary: string;
		commentsSummary: string;
	}[];
}) {
	return (
		<Html>
			<Markdown>{`
Here are the today's top stories from Hacker News:

${summaries.map(({ id, newsTitle, url, newsSummary, commentsSummary }, index) => buildItem({ id, newsTitle, url, newsSummary, commentsSummary }, index)).join('\n')}
`}</Markdown>
		</Html>
	);
}

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
