<template>
    <view class="page">
        <view class="main">
            <scroll-view scroll-y :scroll-top="scrollTop" id="scroll-view">
                <view id="messages">
                    <template v-for="(item,index) in messages" :key="index">
                        <view :class="['message',item.type,item.role]" v-if="item">
                            <image src="@/static/logo.png" class="avatar" v-if="item.role==='user'"></image>
                            <image src="@/static/avatar.png" class="avatar" v-else></image>
                            <view class="box">
                                <view class="wrapper">
                                    <view class="content">
                                        <text v-if="item.role==='user'" user-selectable>
                                            {{ item.content }}
                                        </text>
                                        <image class="content-image" :src="'data:image/jpeg;base64,'+item.b64_json"
                                               v-else-if="item.type==='image'" mode="widthFix"></image>
                                        <MpHtml :key="'markdown'+item.index" :markdown="true" :content="item.content"
                                                :tag-style="styles" v-else></MpHtml>
                                    </view>
                                    <image src="@/static/loading.gif" class="loading" v-if="item.loading"></image>

                                    <view class="failed" v-else-if="item.error" @click="handleReply(index)">
                                        !
                                    </view>
                                </view>
                                <view class="error" v-if="item.error">
                                    {{ item.error }}
                                </view>
                            </view>
                        </view>
                    </template>
                </view>
            </scroll-view>
        </view>
        <view class="footer">
            <view class="footer-wrapper">
                <picker class="mode" :range="modes" :value="mode" range-key="name" @change="handleChangeMode">
                    {{ modes[mode].name }}
                </picker>
                <view class="input-wrapper">
                    <input class="input" v-model="text" @confirm="handleSend"/>
                    <button class="send" :class="{disabled:text.length<1}" @click="handleSend">
                        发送
                    </button>
                </view>
            </view>
        </view>
    </view>
</template>
<script>
// #ifndef VUE3
import Vue from "vue";
// #endif
// #ifdef VUE3
import {
    reactive,
    toRaw
} from "vue";
// #endif
import openai from '../../uni_modules/qq-openai-sdk';
import config from '../../config';
import MpHtml from '../../components/mp-html/mp-html.vue';
import {
    countOccurrences,
    debounce
} from '../../utils/helper.js';

const helper = {
    role: 'assistant',
    type: 'text',
    content: "您好，我是OpenAi插件智能助手，您可以向我咨询有关插件的问题。如您需要购买OpenAi账号、MidJourney账号、ApiKey及账单代付、使用GPT4模型，或者需要开通ChatGPT Plus会员的，请联系作者微信：SHQ0977。"
};
// #ifndef VUE3
const reactive = Vue.observable;
const toRaw = (item) => item;
// #endif
export default {
    name: 'index',
    components: {
        MpHtml
    },
    data() {
        const messages = uni.getStorageSync('messages');
        return {
            scrollTop: 0,
            text: '',
            messages: messages || [helper],
            styles: {
                p: `margin:5px 0;`
            },
            modes: [{
                name: '聊天',
                type: 'text'
            }, {
                name: '绘图',
                type: 'image'
            }, {
                name: '清空聊天记录',
                type: 'clear'
            }],
            mode: uni.getStorageSync('mode') || 0
        }
    },
    watch: {
        messages: {
            handler: function () {
                this.scrollToBottom()
            },
            deep: true
        }
    },
    mounted() {
        // 设置openai配置
        openai.setConfig(config);
        this.scrollToBottom = debounce(this.execScrollToBottom, 100, true)
    },
    methods: {
        handleChangeMode(e) {
            const type = this.modes[e.detail.value];
            if (type?.type === 'clear') {
                this.messages = [helper];
                this.saveMessageToStorage();
                return;
            }
            this.mode = e.detail.value;
            uni.setStorageSync('mode', e.detail.value);
        },

        /**
         * 点击发送按钮
         */
        handleSend() {
            const content = this.text;
            if (content) {
                this.text = '';
                return this.handleSendMessage(content);
            }
            return false;
        },

        /**
         * 点击重试按钮
         */
        handleReply(index) {
            const message = this.messages[index];
            if (!message) {
                return;
            }
            this.messages.splice(index);
            return this.handleSendMessage(message.content);
        },

        /**
         * 发送消息
         */
        async handleSendMessage(content) {
            const currentType = this.modes[this.mode]?.type;

            const message = reactive({
                content,
                type: 'text',
                role: 'user',
                loading: true,
                error: ''
            });
            this.messages.push(message);
            try {
                if (currentType === 'image') {
                    await this.sendChatImage(message);
                } else {
                    await this.sendChatStreamed(message);
                }
            } catch (e) {
                message.error = e.message || e.errMsg || ' ';
            } finally {
                message.loading = false;
            }
            // 存储聊天记录
            this.saveMessageToStorage();
            return true;
        },

        /**
         * 发送绘图消息
         */
        async sendChatImage(message) {
            const reply = reactive({
                role: 'assistant',
                type: 'image',
                b64_json: '',
            });
            reply.b64_json = await openai.createImage(message.content);
            this.messages.push(reply);
            return reply;
        },

        /**
         * 发送流式响应文本消息
         */
        sendChatStreamed(message) {
            const stream = openai.createChatStreamed({
                model: config.model || 'gpt-3.5-turbo',
                messages: this.getMessages()
            });
            const reply = reactive({
                role: 'assistant',
                type: 'text',
                content: '',
                tempContent: ''
            });
            return new Promise((sendResolve) => {
                new Promise((resolve) => {
                    stream.on('message', (content) => {
                        message.loading = false;
                        reply.tempContent += content;
                        reply.content = countOccurrences(reply.tempContent, '```') % 2 ===
                        0 ? reply.tempContent :
                            reply.tempContent + '\n\n```\n';
                        resolve();
                    }).on('error', (e) => {
                        message.error = e.message;
                        message.loading = false;
                    }).on('done', () => {
                        reply.tempContent = '';
                        sendResolve();
                    });
                }).then(() => {
                    this.messages.push(reply);
                })
            })

        },

        /**
         * 更新滚动条，使其自动滚动到页面最底部
         */
        execScrollToBottom() {
            setTimeout(() => {
                const query = uni.createSelectorQuery().in(this);
                // 获取节点信息
                query.select('#scroll-view').boundingClientRect();
                query.select('#messages').boundingClientRect();
                query.exec((res) => {
                    if (res[1].height > res[0].height) {
                        this.scrollTop = res[1].height - res[0].height
                    }
                })
            }, 20);
        },

        /**
         * 保存聊天记录
         */
        saveMessageToStorage() {
            uni.setStorageSync('messages', this.messages.map(toRaw));
        },


        /**
         * 获取所有聊天上下文
         * @returns {{role: *, content: *}[]}
         */
        getMessages() {
            let length = 0;
            return [...this.messages].reverse().filter((item) => {
                return item.type === 'text' && !item.error;
            }).map((item) => {
                length += item.content.length;
                // 限制字数，防止超出
                if (length > 10000) {
                    return;
                }
                return {
                    role: item.role,
                    content: item.content
                }
            }).filter(item => !!item).reverse();
        }
    }
}
</script>

<style>
page {
    background-color: #efefef;
}

.page {
    position: absolute;
    left: 0;
    right: 0;
    top: var(--window-top);
    bottom: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
}

.main {
    flex: 1;
    z-index: 2;
    padding-bottom: 100rpx;
    padding-top: 15rpx;
    overflow-y: auto;
    background-color: #efefef;
}

#scroll-view {
    flex: 1;
    width: 100%;
    height: 100%;
}

#messages {
    padding-top: 20rpx;
    padding-bottom: 20rpx;
}

.footer {
    border-top: 1rpx solid #dfdfdf;
    background-color: #f5f5f5;
    position: fixed;
    bottom: 0;
    width: 100%;
    z-index: 3;
}

.footer > .footer-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    position: relative;
    margin: 30rpx;
}

.footer > .footer-wrapper > .mode {
    text-align: center;
    flex-shrink: 0;
    margin-right: 30rpx;
}

.input-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    position: relative;
    flex: 1;
}

.input {
    background-color: #fff;
    padding: 5rpx 10rpx;
    border-radius: 5rpx;
    flex: 1;
    height: 50rpx;
}

.send {
    margin-left: 15rpx;
    height: 60rpx;
    background-color: #3b82f6;
    color: white;
    border-radius: 5rpx;
    width: 100rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    position: inherit;
    padding: 0;
    font-size: 16px;
    border-width: 0;
}

.send::after {
    border: 0;
}

.send.disabled {
    pointer-events: none;
    opacity: .3;
}

.message {
    margin-bottom: 30rpx;
    display: flex;
    flex-direction: row;
    margin-left: 15rpx;
}

.message > .avatar {
    width: 60rpx;
    height: 60rpx;
    border-radius: 4rpx;
}

.message > .box {
    position: relative;
    max-width: 80%;
    margin-left: 25rpx;
    flex: 1;

}

.message .wrapper {
    display: flex;
    flex-direction: row;
    flex: 1;
    position: relative;
}

.message.text .content {
    background-color: #fff;
    padding: 10rpx 20rpx;
    border-radius: 10rpx;
    font-size: 14px;
    line-height: 40rpx;
    max-width: 85%;
    min-height: 40rpx;
    min-width: 50rpx;
    word-break: break-all;
}

.message.text .content::after {
    content: " ";
    position: absolute;
    width: 20rpx;
    height: 20rpx;
    background-color: white;
    left: -10rpx;
    top: 20rpx;
    transform: rotate(45deg);
    z-index: 1;
}

.message.image .content .content-image {
    max-width: 500rpx;
}

.message .failed {
    width: 30rpx;
    height: 30rpx;
    background-color: #ef4444;
    border-radius: 20rpx;
    align-self: center;
    margin-left: 15rpx;
    color: white;
    line-height: 30rpx;
    text-align: center;
}

.message .loading {
    width: 30rpx;
    height: 30rpx;
    margin-left: 15rpx;
    align-self: center;
}

.message .error {
    font-size: 14px;
    color: #9ca3af;
    margin-top: 5rpx;
    margin-left: 55rpx;
}

.message.user {
    flex-direction: row-reverse;
    margin-left: 0;
    margin-right: 15rpx;
}

.message.user > .box {
    margin-right: 25rpx;
    margin-left: 0;
}

.message.user .wrapper {
    flex-direction: row-reverse;
}

.message.user.text .content {
    background-color: #3b82f6;
    color: white;
}

.message.user.text .content:after {
    left: unset;
    right: -10rpx;
    background-color: #3b82f6;
}

.message.user .error {
    text-align: right;
}

.message.user .failed,
.message.user .loading {
    margin-left: 0;
    margin-right: 15rpx;
}
</style>
