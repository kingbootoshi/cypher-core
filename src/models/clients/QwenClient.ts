import axios from 'axios';
import { ModelClient, ModelType, Message } from '../../types/agentSystem';

export class QwenClient implements ModelClient {
  modelType: ModelType = 'local';
  private _serverUrl: string;
  private _modelName: string;

  constructor(modelName: string, serverUrl: string) {
    this._modelName = modelName;
    this._serverUrl = serverUrl;
  }

  get modelName(): string {
    return this._modelName;
  }

  public async initialize(): Promise<any> {
    try {
      const response = await axios.post(`${this._serverUrl}/initialize`, {model_name: this._modelName});
      return response.data;
    } catch (error) {
      throw new Error(`Error during chat completion: ${(error as Error).message}`);
    }
  }

  async chatCompletion(params: any): Promise<any> {
    try {
      const response = await axios.post(`${this._serverUrl}/generate`, params);
      return response.data;
    } catch (error) {
      throw new Error(`Error during chat completion: ${(error as Error).message}`);
    }
  }
}