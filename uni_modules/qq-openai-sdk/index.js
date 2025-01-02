let config = {};


// 事件响应类
class EventResponse {

	constructor() {
		this.events = {};
	}

	// 监听事件
	on(event, callback) {
		this.events[event] = callback;
		return this;
	}

	call(event, ...args) {
		setTimeout(() => {
			const allCallback = this.events['*'];
			if (allCallback) {
				allCallback(event, ...args);
			}
			const callback = this.events[event];
			if (callback) {
				callback(...args);
			}
		});
		return this;
	}
}

/**
 * 基础请求接口
 */
async function request(method, endpoint, data = {}) {

	if (!config.baseUri) {
		throw new Error('请在config.js中配置baseUri');
	}

	const headers = {
		'Content-Type': 'application/json'
	};
	if (config.apiKey) {
		headers['Authorization'] = 'Bearer ' + config.apiKey;
	}
	if (config.organization) {
		headers['OpenAI-Organization'] = config.organization;
	}

	// @ts-ignore
	let res = await uni.request({
		url: config.baseUri + '/v1' + endpoint,
		method,
		header: headers,
		dataType: 'json',
		data: JSON.stringify(data),
	});
	console.log(res);
	// #ifndef VUE3
	if (res[0]) {
		throw new Error(res[0].errMsg || res[0].message);
	}
	res = res[1] || res;
	// #endif
	if (res.statusCode !== 200) {
		if (res.data && res.data.error) {
			// 接口返回错误
			throw new Error(res.data.error.message);
		}
		throw new Error('Network Error:' + res.data);
	}

	return res;
}


/**
 * 生成图片
 * @link https://platform.openai.com/docs/api-reference/images/create
 */
async function createImage(prompt, params = {}) {
	if (
		!prompt
	) {
		throw new Error("参数prompt不能为空");
	}
	const res = await request('POST', '/images/generations', {
		prompt,
		size: '256x256',
		...params,
		// 固定为json格式，如果使用URL可能出现国内无法加载的情况
		response_format: 'b64_json'
	});

	return res.data.data[0].b64_json;
}

function createChat(data) {
	return request('POST', '/v1/chat/completions', data);
}

async function chat(message, parameters = {}) {
	const res = await createChat({
		model: 'gpt-3.5-turbo',
		messages: [{
			role: 'user',
			content: message
		}],
		...parameters
	});

	return res.choices[0].message.content;
}

/**
 * WebSocket模式，适用于所有端。
 */
function sendWebsocket(data) {
	const response = new EventResponse();
	setTimeout(() => {
		const websocketUrl = config.socketUrl;
		if (!config.socketUrl) {
			response.call('error', new Error('请在config.js中配置socketUrl'));
			return response;
		}
		// 创建websocket链接
		// @ts-ignore
		const socket = uni.connectSocket({
			url: websocketUrl,
			fail(err) {
				response.call('error', new Error(err.errMsg || err.message || 'websocket链接失败'));
			}
		});
		socket.onOpen(() => {
			setTimeout(() => {
				// 链接成功后发送数据
				socket.send({
					data: JSON.stringify({
						data,
						apiKey: config.apiKey,
						organization: config.organization
					})
				});
			});
		});

		socket.onError((error) => {
			response.call('error', new Error(error.errMsg || error.message || 'websocket连接失败!'));
		});

		socket.onClose(() => {
			response.call('close');
		})

		// 接收消息
		socket.onMessage((message) => {
			const data = JSON.parse(message.data);
			if (data.command) {
				response.call(data.command, data.data);
				if (data.command === 'done') {
					// 接收完毕，关闭链接
					socket.close({});
				}
			} else {
				response.call('error', {
					message: '解析失败：' + message
				})
			}
		});
	})
	return response;
}

/**
 * 将服务器返回的SSE数据，拆分成多行
 * @param str
 * @returns {*[]}
 */
function splitDataLines(str) {
	let regex = /data:(.*?)(?=data:|$)/gs;
	let matches = [];
	let match;

	while (match = regex.exec(str)) {
		matches.push(match[0].trim());
	}

	return matches;
}

/**
 *
 * @param event
 * @param string
 */
function dataEmitMessage(event, string) {
	const lines = splitDataLines(string);
	for (const line of lines) {
		if (line.startsWith('data: ')) {
			const data = line.substring(6);
			if (data === '[DONE]') {
				break;
			}
			try {
				const json = JSON.parse(data);
				if (json?.choices && json.choices[0].delta.content) {
					event.call('message', json.choices[0].delta.content);
				}
			} catch (e) {
				console.warn('数据解析失败：' + data);
				console.error(e);
			}
		}

	}
}

// #ifdef H5
/**
 * SSE模式，适用于浏览器端。
 */
function sendSse(data) {

	const event = new EventResponse();

	if (!config.baseUri) {
		event.call('error', new Error('请在config.js中配置baseUri'));
		return event;
	}

	const headers = {
		['Content-Type']: 'application/json'
	};
	if (config.apiKey) {
		headers['Authorization'] = 'Bearer ' + config.apiKey;
	}
	if (config.organization) {
		headers['OpenAI-Organization'] = config.organization;
	}

	fetch(config.baseUri + '/v1/chat/completions', {
		method: 'POST',
		headers,
		body: JSON.stringify({
			...data,
			stream: true
		}),
	}).then(async (response) => {
		if (!response.ok) {
			// 请求失败，
			if (response.headers.get('content-type')?.includes('json')) {
				const json = await response.json();
				if (json.error?.message) {
					event.call('error', new Error(json.error?.message))
					return;
				}
			}
			event.call('error', new Error(`网络请求失败: ${response.body}`))
			return;
		}
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');
		while (true) {
			const {
				done,
				value
			} = await reader.read();
			if (done) {
				// 接收完成
				event.call('done');
				return;
			}
			dataEmitMessage(event, decoder.decode(value, {
				stream: true
			}))
		}
	}).catch((e) => {
		event.call('error', e);
	});

	return event;
}

// #endif

// #ifdef MP-WEIXIN
function sendChunk(data) {
	const event = new EventResponse();

	if (!config.baseUri) {
		event.call('error', new Error('请在config.js中配置baseUri'));
		return event;
	}

	const headers = {
		['Content-Type']: 'application/json'
	};
	if (config.apiKey) {
		headers['Authorization'] = 'Bearer ' + config.apiKey;
	}
	if (config.organization) {
		headers['OpenAI-Organization'] = config.organization;
	}

	const request = uni.request({
		url: config.baseUri + '/v1/chat/completions',
		method: 'POST',
		header: headers,
		data: {
			...data,
			stream: true
		},
		enableChunked: true,
		complete(res) {
			console.log(res);
		},
		success(res) {
			if (res.statusCode !== 200) {
				console.log(res);
				const message = res.errMsg || res.message;
				event.call('error', new Error((message === 'request:ok' ? res.data : message) || '网络请求失败：' + res
					.statusCode));
				return;
			}
			event.call('done');
		},
		fail(res) {
			const message = res.errMsg || res.message;
			event.call('error', new Error(message || '网络请求失败'));
		}
	});
	request.onChunkReceived((res) => {
		dataEmitMessage(event, textDecode(new Uint8Array(res.data)));
	});


	return event;
}

/**
 * 模拟TextDecoder(微信小程序环境)
 * @param view
 * @returns {string}
 */
function textDecode(view) {
	if (!ArrayBuffer.isView(view)) {
		throw new TypeError('passed argument must be an array buffer view');
	}
	const arr = new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
		charArr = new Array(arr.length);
	arr.forEach(function(code, i) {
		charArr[i] = String.fromCharCode(code);
	});
	return decodeURIComponent(escape(charArr.join('')));
}

// #endif

// 发起自定义聊天
function createChatStreamed(data) {

	if (config.system) {
		// 设定系统身份
		data.messages = data.messages || [];
		data.messages = [{
			role: 'system',
			content: config.system
		}].concat(data.messages || []);
	}

	if (config.type === 'websocket') {
		return sendWebsocket(data);
	}
	// #ifdef H5
	// H5模式直接调用SSE模式
	return sendSse(data);
	// #endif
	// #ifdef MP-WEIXIN
	// 小程序模式使用chunk
	return sendChunk(data);
	// #endif
}


// 直接发起聊天
function chatStreamed(message, data = {}) {
	return createChatStreamed({
		model: 'gpt-3.5-turbo',
		messages: [{
			role: 'user',
			content: message
		}],
		...data
	})
}

function setConfig(configParameters = {}) {
	config = {
		...config,
		...configParameters
	}
}

export default {
	setConfig,
	request,
	createImage,
	createChat,
	createChatStreamed,
	chatStreamed,
	chat,
}