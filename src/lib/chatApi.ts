import { API_BASE_URL, parseApiResponse } from "@/lib/apiConfig";

interface ChatResponse {
    answer?: string;
    error?: string;
}

export async function sendChatQuestion(question: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
    });
    const result = await parseApiResponse<ChatResponse>(response);

    if (!response.ok || !result.answer) {
        throw new Error(result.error || "The assistant is temporarily unavailable.");
    }

    return result.answer;
}
