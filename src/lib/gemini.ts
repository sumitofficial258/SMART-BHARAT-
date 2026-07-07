import { ChatMessage } from "../types";

/**
 * Backend proxy fetcher to route chat requests securely through full-stack endpoints.
 * This completely satisfies security constraints by ensuring no API keys are exposed or used in the browser.
 */
async function fetchViaServerProxy(
  messages: ChatMessage[],
  attachedFile?: { name: string; mimeType: string; base64: string } | null
): Promise<string> {
  console.log("Routing request through secure full-stack /api/chat backend proxy...");
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      attachedFile,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch AI response from server proxy (Status ${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.text || "I was unable to retrieve a response from the server proxy.";
}

/**
 * Main generator service that connects React companion chats to Google's servers.
 * It is fully server-proxied for maximum security and reliability.
 */
export async function generateCivicResponse(
  messages: ChatMessage[],
  attachedFile?: { name: string; mimeType: string; base64: string } | null
): Promise<string> {
  return fetchViaServerProxy(messages, attachedFile);
}
