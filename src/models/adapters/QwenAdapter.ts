import { Message, Tool } from '../../types/agentSystem';
import { ModelAdapter, ProcessedResponse, FunctionCall } from './ModelAdapter';
import { Logger } from '../../utils/logger';


export class QwenAdapter extends ModelAdapter {

  constructor(modelName: string) {
    super(modelName);
  }

  public buildParams(
    messages: Message[],
    tools: Tool[],
    toolChoice?: any,
    systemPrompt?: string,
    outputSchema?: any
  ): any {
    let systemMsg = '';
    let nonSystemMessages = messages.filter(m => m.role !== 'system');
    const finalMessages = nonSystemMessages.map(m => {
      let role = m.role;
      if (role === 'system') role = 'user';

      const contentArr = m.content ? [{ type: "text", text: m.content }] : [];
      return { role, content: contentArr };
    });

    if (finalMessages.length === 0) {
      finalMessages.push({
        role: 'user',
        content: [{ type: 'text', text: '.' }]
      });
    }

    if (systemPrompt) {
      systemMsg = systemPrompt;
    }

    const params: any = {
      model: this.modelName,
      max_tokens: 1024,
      temperature: 0,
      system: systemMsg,
      messages: finalMessages
    };

    let hasTools = false;
    if (tools && tools.length > 0) {
      params.tools = tools;
      hasTools = true;
    }

    if (hasTools) {
      if (toolChoice) {
        if (typeof toolChoice === 'string') {
          params.tool_choice = { type: toolChoice };
        } else {
          params.tool_choice = toolChoice;
        }
      } else {
        params.tool_choice = { type: "auto" };
      }
    }

    if (outputSchema) {
      params.output_schema = outputSchema;
    }

    return params;
  }

  public formatTools(tools: Tool[]): any[] {
    const processed = tools.map(tool => {
      if (!tool.function || !tool.function.name || !tool.function.parameters || !tool.function.description) {
        Logger.error('[QwenAdapter] Tool missing function fields in formatTools:', tool);
        return null;
      }
      return {
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters
      };
    }).filter(Boolean);
    return processed;
  }

  public buildToolChoice(tools: Tool[]): any {
    if (tools && tools.length > 0) {
      return { type: "auto" };
    }
    return undefined;
  }

  public processResponse(response: any): ProcessedResponse {
    // TODO: Implement tool usage
    if (!response) {
      Logger.error('[QwenAdapter] Got no response from model.');
      return { functionCalls: [] };
    }
    Logger.debug('[QwenAdapter] Processing response:', response);

    const assistantMarker = 'assistant';
    const markerIndex = response.indexOf(assistantMarker);
    const contentAfterMarker = markerIndex !== -1 ? response.substring(markerIndex + assistantMarker.length).trim() : '';

    const aiMessage = {
      role: 'assistant',
      content: contentAfterMarker
    };

    return { aiMessage, functionCalls: [] };
  }
}