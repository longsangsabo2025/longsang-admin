import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export interface SupportMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export class AISupportBot {
  private threadId: string | null = null;
  private assistantId: string;

  constructor(private productName: string, private productDescription: string) {
    this.assistantId = "";
  }

  async initialize() {
    // Create assistant for this product
    const assistant = await openai.beta.assistants.create({
      name: `${this.productName} Support Bot`,
      instructions: `You are a helpful customer support assistant for ${this.productName}.
${this.productDescription}

Your role is to:
- Answer questions about features and functionality
- Help troubleshoot common issues
- Provide step-by-step guidance
- Direct users to relevant documentation
- Be friendly, professional, and concise

If you don't know the answer, admit it and suggest contacting human support.`,
      model: "gpt-4o-mini",
      tools: [{ type: "file_search" }],
    });

    this.assistantId = assistant.id;
    return assistant;
  }

  async createThread() {
    const thread = await openai.beta.threads.create();
    this.threadId = thread.id;
    return thread;
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.threadId) {
      await this.createThread();
    }

    // Add user message to thread
    await openai.beta.threads.messages.create(this.threadId!, {
      role: "user",
      content: message,
    });

    // Run assistant
    const run = await openai.beta.threads.runs.create(this.threadId!, {
      assistant_id: this.assistantId,
    });

    // Wait for completion
    let runStatus = await openai.beta.threads.runs.retrieve(this.threadId!, run.id);

    while (runStatus.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(this.threadId!, run.id);

      if (runStatus.status === "failed") {
        throw new Error("Assistant run failed");
      }
    }

    // Get messages
    const messages = await openai.beta.threads.messages.list(this.threadId!);
    const lastMessage = messages.data[0];

    if (lastMessage.content[0].type === "text") {
      return lastMessage.content[0].text.value;
    }

    return "Sorry, I could not process that request.";
  }

  async streamMessage(message: string, onChunk: (text: string) => void): Promise<void> {
    if (!this.threadId) {
      await this.createThread();
    }

    await openai.beta.threads.messages.create(this.threadId!, {
      role: "user",
      content: message,
    });

    const stream = await openai.beta.threads.runs.stream(this.threadId!, {
      assistant_id: this.assistantId,
    });

    for await (const event of stream) {
      if (
        event.event === "thread.message.delta" &&
        event.data.delta.content?.[0]?.type === "text"
      ) {
        const textDelta = event.data.delta.content[0].text?.value;
        if (textDelta) {
          onChunk(textDelta);
        }
      }
    }
  }
}

// Factory function for each product
export const createLongSangBot = () =>
  new AISupportBot(
    "LongSang Forge",
    "An AI-powered automation platform for LinkedIn and Facebook marketing, with n8n workflow integration and comprehensive analytics."
  );

export const createSABOBot = () =>
  new AISupportBot(
    "SABO Arena",
    "A tournament management platform for gaming competitions with ELO rating system, VNPAY payment integration, and support for multiple tournament formats."
  );

export const createLSSecretaryBot = () =>
  new AISupportBot(
    "LS Secretary",
    "An AI-powered virtual assistant with 3D avatar, multi-tenant architecture, and advanced conversation capabilities."
  );

export const createVungTauBot = () =>
  new AISupportBot(
    "VungTauLand",
    "A real estate platform for Vung Tau properties with map integration, property management, and inquiry handling."
  );
