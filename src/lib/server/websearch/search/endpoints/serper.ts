import { env } from "@env";
import type { WebSearchSource } from "@lib/types/WebSearch";

export default async function search(query: string): Promise<WebSearchSource[]> {
	const params = {
		q: query,
		hl: "en",
		gl: "us",
	};

	const serperApiKey = env.SERPER_API_KEY ?? "";
	if (!serperApiKey) {
		throw new Error("SERPER_API_KEY is not set");
	}

	const response = await fetch("https://google.serper.dev/search", {
		method: "POST",
		body: JSON.stringify(params),
		headers: {
			"x-api-key": serperApiKey,
			"Content-type": "application/json",
		},
	});

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const data = (await response.json()) as Record<string, any>;

	if (!response.ok) {
		throw new Error(
			data["message"] ??
				`Serper API returned error code ${response.status} - ${response.statusText}`
		);
	}

	return data["organic"] ?? [];
}
