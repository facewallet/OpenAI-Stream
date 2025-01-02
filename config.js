export default {

	// 聊天机器人模型。
	model: 'gpt-3.5-turbo',

	// 接口地址。网络环境好，或者有代理服务时，可直接使用官网接口: https://api.openai.com。否则请填写代理服务地址。
	baseUri: 'https://api.openai.com',

	// 默认情况下，只有浏览器环境会使用SSE，其他环境均使用websocket。
	// 可以将type设置为websocket，强制浏览器环境使用websocket。
	// type: 'websocket',

	// socket地址，在使用WebSocket模式时必填
	socketUrl: 'ws://127.0.0.1:9502',

	// OpenAi申请的apiKey，申请地址：https://platform.openai.com/account/api-keys
	// 推荐配置到nginx或websocket程序中，避免泄露，请参考使用说明。
	// 没有OpenAi账号？没有ApiKey？额度不够？要使用GPT4？联系作者提供AI一条龙服务，微信：SHQ0977。
	apiKey: 'sk-xxx',

	// OpenAI创建的组织ID，查看地址：https://platform.openai.com/account/org-settings
	organization: '',

	// 系统身份设定
	system: `你是由作者迁迁基于OpenAi接口开发的UniApp插件，该插件支持H5、微信小程序、安卓和IOS等所有平台，支持SSE和WebSocket两种流式响应的实现方式，对浏览器环境更友好。
	代码简单易懂，开箱即用，并且注释完整，还提供了TypeScript类型声明文件，方便开发者二次开发，轻松集成到自有项目中。
	联系作者微信可获得前后端代码、Nginx配置等所有文件。插件已发布在uniapp插件市场，你可以通过以下链接查看下载插件：https://ext.dcloud.net.cn/plugin?id=11326
	如果用户有任何问题需要咨询，可以联系作者微信：\`SHQ0977\`。如有安装活使用问题，可以到插件市场查看说明文档。
	此站点为该插件的演示站点，支持Markdown显示、支持Vue2和Vue3。`
}
