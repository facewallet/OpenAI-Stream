# OpenAI SDK

#### 插件介绍

1. 支持最新的GPT接口，支持智能聊天、文字翻译、AI绘图等。支持Markdown显示、支持上下文语境，支持保存聊天记录等。
2. 兼容性强，支持H5、小程序、安卓、IOS等所有平台。支持Vue2、Vue3，支持二次开发，可无缝接入到现有系统。
3. 支持**SSE**和**WebSocket**双模式，2种模式都可实现**流式响应**，速度快、交互体验好。浏览器和微信小程序环境下均支持SSE。
4. 代码简单、易懂，注释完整。
5. 支持设定机器人身份，小程序轻松过审。**文档最下方联系作者咨询**。
6. 没有OpenAi账号？没有ApiKey？额度不够？没有海外卡？要使用GPT4模型？**文档最下方联系作者提供AI一条龙服务**。
7. 联系作者，免费获取前后端所有代码、Nginx配置、使用说明等全部资源。**文档最下方联系作者**。

#### 演示

移动端/H5：[https://chat.xvii.pro](https://chat.xvii.pro)

> 此地址仅为演示、测试使用，服务器资源有限，请勿过度使用。

#### 使用方法

##### 最简单的聊天机器人

```js
import openai from 'uni_modules/qq-openai';

// 插件设置
openai.setConfig({
    // 接口地址。网络环境好，或者有代理服务时，可直接使用官网接口: https://api.openai.com。
    // 对于无自建服务器的插件付费用户，可使用公共测试地址(付费后联系作者获取)。此地址仅供学习使用，服务器配置偏低，可能会卡顿或随时失效，绝不可用于生产环境和商业用途。
    baseUri: 'https://xxx.com',

    // 默认情况下，浏览器和微信小程序环境会使用SSE，其他环境均使用websocket。
    // 可以将type设置为websocket，强制所有环境使用websocket。
    // type: 'websocket',

    // socket地址，在使用WebSocket模式时必填。
    socketUrl: 'wss://xxx.com',

    // OpenAi申请的apiKey，申请地址：https://platform.openai.com/account/api-keys
    apiKey: '',

    // OpenAI创建的组织ID，查看地址：https://platform.openai.com/account/org-settings
    organization: '',

    // 系统身份设定
    system: '你是由作者迁迁基于OpenAi接口开发的UniApp插件。xxxxxx....',
});

// 1. 同步方式直接获取聊天回复
let reply = openai.chat('可以夸我一下吗？');

// 2. 自定义聊天参数
let reply = openai.chat('可以夸我一下吗？', {
    // 模型参数
    model: 'gpt-4-16k',
});

// 3. 携带聊天上下文
let reply = openai.createChat({
    // 模型参数
    model: 'gpt-4-16k',
    messages: [
        // ... 聊天上下文数据
        {
            role: 'user',
            content: '可以夸一下我吗？'
        }
    ]
})
// 

```

##### 流式响应

> 浏览器环境(H5)和微信小程序环境下，默认使用SSE，其他环境默认使用WebSocket。无论使用哪种方式，上层调用方式一致。
> 调用流式响应方法，将会返回一个事件对象，可通过监听事件获取接口数据，参考下面的案例。


使用案例：

```js

import openai from 'uni_modules/qq-openai';

// 1. 直接获取聊天回复
let stream = openai.chatStreamed('可以夸一下我吗？');

// 2. 自定义聊天参数
let stream = openai.chatStreamed('可以夸一下我吗？', {
    model: 'gpt-4-32k',
});

// 3. 携带聊天上下文
let stream = openai.createChatStreamed({
    // 模型参数
    model: 'gpt-4-32k',
    messages: [
        // ... 聊天上下文数据
        {
            role: 'user',
            content: '可以夸一下我吗？'
        }
    ]
});

// 消息事件，可用来接收消息内容。
stream.on('message', (reply) => {
    console.log(reply);
});

// 错误事件，用来接收异常消息。
stream.on('error', (error) => {
    console.log(error.message);
});

// 消息接收完毕事件。
stream.on('done', () => {
    console.log('消息接收完毕');
});

// 支持链式调用：
stream.on('message', () => {
})
    .on('error', () => {
    })
    .done(() => {
    });

```

##### 调用其他openai接口

```js
import openai from 'uni_modules/qq-openai';

const response = await openai.request('GET', '/v1/models', {});
console.log(response);
```

#### 常见问题

##### 为什么必须要开通云空间才能试用？

> 答：由于DCloud平台的限制，收费插件必须开通云空间才能使用。但**云空间开通是免费的**，开通后可以选择不使用。

#### 学习交流

感兴趣的朋友，可以加我微信(SHQ0977)，一起学习ChatGPT、学习AI。希望能把更多实用的工具、有趣的想法，分享给大家。
