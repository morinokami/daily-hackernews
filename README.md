# daily-hackernews

Receive Hacker News summaries in your inbox every day.


## Local Development

> [!NOTE]
> Before you start, make sure you have created an account on [OpenAI](https://platform.openai.com/signup) and [Resend](https://resend.com/).

Install dependencies:

```bash
pnpm install
```

Create a `.dev.vars` file in the root directory with the following content:

```
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
RESEND_API_KEY="YOUR_RESEND_API_KEY"
EMAIL_TO="to@example.com"
EMAIL_FROM="from@example.com"
```

Start the development server:

```bash
pnpm run dev
```

Send a test email:

```bash
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

## Deployment

You can deploy this project to Cloudflare Workers. Note that you need to enroll in the Workers paid plan because the free plan's subrequest limit is insufficient for this project.
