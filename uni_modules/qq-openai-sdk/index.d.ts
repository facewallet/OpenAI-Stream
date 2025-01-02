declare module 'openai' {

    export interface Config {
        apiKey?: string,
        organization?: string,
        baseUri?: string,
        socketUrl?: string,
        system?: string,
        model?: string,
        type?: 'websocket' | 'auto',
    }

    /**
     * 事件回调函数
     */
    export interface EventCallback {
        (...args: any): void
    }

// 请求方法
    export type METHOD = 'GET' | 'POST';

// 事件响应类
    export class EventResponse {
        private readonly events: Record<string, EventCallback>;

        // 监听事件
        on(event: string, callback: EventCallback): this;

        call(event: string, ...args: any): this;
    }

    export interface CreateImageRequestParameters {
        size?: '256x256' | '512x512' | '1024x1024',
        user?: string,
        n?: number
    }

    export interface CreateImageResponse {
        b64_json: string
    }


    export interface CreateChatRequestParametersMessage {
        role: 'user' | 'assistant' | 'system',
        content: string
    }

    export interface SimpleChatRequestParameters {
        model?: string,
        temperature?: number,
        top_p?: number,
        max_tokens?: number,
        presence_penalty?: number,
        frequency_penalty?: number,
        user?: string
    }


    /**
     * 聊天接口
     * @link https://platform.openai.com/docs/api-reference/chat/create
     */
    export interface CreateChatRequestParameters extends SimpleChatRequestParameters {
        model: string,
        messages: CreateChatRequestParametersMessage[]
    }

    /**
     *
     * @export
     * @interface ChatCompletionResponseMessage
     */
    export interface ChatCompletionResponseMessage {
        role: 'user' | 'assistant' | 'system';
        content: string;
    }

    export interface CreateChatCompletionResponseChoicesInner {
        'index'?: number;
        'message'?: ChatCompletionResponseMessage;
        'finish_reason'?: string;
    }

    export interface CreateCompletionResponseUsage {
        prompt_tokens: number;

        completion_tokens: number;

        total_tokens: number;
    }

    /**
     *
     * @export
     * @interface CreateChatCompletionResponse
     */
    export interface CreateChatCompletionResponse {
        /**
         *
         * @type {string}
         * @memberof CreateChatCompletionResponse
         */
        'id': string;
        /**
         *
         * @type {string}
         * @memberof CreateChatCompletionResponse
         */
        'object': string;
        /**
         *
         * @type {number}
         * @memberof CreateChatCompletionResponse
         */
        'created': number;
        /**
         *
         * @type {string}
         * @memberof CreateChatCompletionResponse
         */
        'model': string;
        /**
         *
         * @type {Array<CreateChatCompletionResponseChoicesInner>}
         * @memberof CreateChatCompletionResponse
         */
        'choices': Array<CreateChatCompletionResponseChoicesInner>;
        /**
         *
         * @type {CreateCompletionResponseUsage}
         * @memberof CreateChatCompletionResponse
         */
        'usage'?: CreateCompletionResponseUsage;
    }

    export default interface OpenAi {
        setConfig(config: Config): void;

        chatStreamed(message: string, data ?: SimpleChatRequestParameters): EventResponse;

        createChatStreamed(data: CreateChatRequestParameters): EventResponse;

        chat(message: string, params ?: SimpleChatRequestParameters): Promise<string>;

        createChat(data: CreateChatRequestParameters): Promise<CreateChatCompletionResponse>;

        createImage(prompt: string, params ?: CreateImageRequestParameters): Promise<CreateImageResponse>;

        request<T>(method: METHOD, endpoint: string, data ?: object): Promise<T>;
    }
}
