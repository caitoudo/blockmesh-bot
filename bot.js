const axios = require('axios');
const faker = require('faker');
const UserAgent = require('faker-useragent');
const cheerio = require('cheerio');
const fs = require('fs');
const readline = require('readline');
const { URL } = require('url');

// 日志打印的辅助函数
function logInfo(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] INFO → ${message}`);
}

function logSuccess(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] SUCCESS → ${message}`);
}

function logError(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ERROR → ${message}`);
}

function logWarning(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] WARNING → ${message}`);
}

// 从文件中加载代理列表，并进行格式化解析
function loadProxies() {
    try {
        const proxies = fs.readFileSync('proxies.txt', 'utf-8').split('\n').filter(line => line.trim());
        if (proxies.length === 0) logWarning("代理文件为空或未找到，将不使用代理。");
        return proxies.map(parseProxy);
    } catch (e) {
        logWarning(`读取 proxies.txt 文件出错：${e.message}，将不使用代理。`);
        return [];
    }
}

// 解析代理字符串，例如 http://username:password@ip:port
function parseProxy(proxyString) {
    const [protocol, authAndHost] = proxyString.split('://');
    if (!authAndHost) return null;

    const [auth, host] = authAndHost.includes('@') ? authAndHost.split('@') : [null, authAndHost];
    const [hostPart, port] = host.split(':');

    return {
        protocol,
        host: hostPart,
        port,
        auth: auth ? { username: auth.split(':')[0], password: auth.split(':')[1] } : null,
    };
}

// 随机延迟函数
function randomDelay(min = 1000, max = 3000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}

// 从 URL 提取推荐码
function extractRefCodeFromUrl(url) {
    try {
        const parsedUrl = new URL(url);
        const refCode = parsedUrl.searchParams.get('invite_code');
        if (!refCode) {
            logError('URL 中未找到推荐码（invite_code）。');
            process.exit(1);
        }
        return refCode;
    } catch (error) {
        logError("URL 格式无效，请输入正确的推荐链接。");
        process.exit(1);
    }
}

// 临时邮箱 API 类
class TempMailAPI {
    constructor() {
        this.baseUrl = 'https://api.tempmail.lol';
    }

    async createInbox() {
        try {
            const response = await axios.get(`${this.baseUrl}/generate`);
            return {
                address: response.data.address,
                token: response.data.token,
            };
        } catch (error) {
            logError("创建临时邮箱失败：" + error.message);
            throw error;
        }
    }

    async checkInbox(token) {
        try {
            const response = await axios.get(`${this.baseUrl}/auth/${token}`);
            return response.data.email || [];
        } catch (error) {
            logError("检查邮箱失败：" + error.message);
            throw error;
        }
    }
}

// 注册机器人类
class RegistrationBot {
    constructor() {
        this.tempMail = new TempMailAPI();
        this.ua = new UserAgent();
        this.proxies = loadProxies();
    }

    getRandomProxy() {
        if (this.proxies.length === 0) return null;
        return this.proxies[Math.floor(Math.random() * this.proxies.length)];
    }

    async createAndRegister(refCode, registrationNumber) {
        try {
            logInfo(`开始第 ${registrationNumber} 次注册`);
            const proxy = this.getRandomProxy();
            const ipAddress = await this.getIpAddress(proxy);

            logInfo(`使用 IP 地址：${ipAddress}`);
            
            const inbox = await this.tempMail.createInbox();
            const randPass = faker.internet.password();

            logSuccess('生成的账户信息：');
            console.log(`邮箱：${inbox.address}`);
            console.log(`密码：${randPass}`);

            const registrationData = {
                email: inbox.address,
                password: randPass,
                password_confirm: randPass,
                invite_code: refCode,
            };

            const headers = {
                'User-Agent': this.ua.random(),
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*',
                'Origin': 'https://app.blockmesh.xyz',
                'Referer': 'https://app.blockmesh.xyz/ext/register',
            };

            const proxyConfig = proxy ? { proxy: { host: proxy.host, port: proxy.port, auth: proxy.auth } } : {};

            try {
                const response = await axios.post(
                    'https://app.blockmesh.xyz/register_api',
                    new URLSearchParams(registrationData).toString(),
                    {
                        headers,
                        ...proxyConfig,
                    }
                );

                if (response.status === 200) {
                    logSuccess('注册成功！');
                    const confirmationLink = await this.handleEmailConfirmation(inbox.token, proxy);
                    this.saveCredentials(inbox.address, randPass, inbox.token, confirmationLink, ipAddress);
                } else {
                    logError(`注册失败，状态码：${response.status}`);
                }
            } catch (error) {
                logError(`注册时发生错误：${error.message}`);
            }
        } catch (error) {
            logError(`注册流程中发生错误：${error.message}`);
        }
    }

    async getIpAddress(proxy = null) {
        try {
            const proxyConfig = proxy
                ? { proxy: { host: proxy.host, port: proxy.port, auth: proxy.auth } }
                : {};
            const response = await axios.get('https://api.ipify.org?format=json', proxyConfig);
            return response.data.ip;
        } catch (error) {
            logError("获取 IP 地址失败：" + error.message);
            return '未知 IP';
        }
    }

    async handleEmailConfirmation(token, proxy) {
        const emails = await this.tempMail.checkInbox(token);
        for (const email of emails) {
            if (email.subject.includes('Confirmation')) {
                const $ = cheerio.load(email.html);
                const confirmationLink = $('a[href*="awstrack"]').attr('href');
                if (confirmationLink) {
                    logSuccess(`找到确认链接：${confirmationLink}`);
                    return confirmationLink;
                }
            }
        }
        logError('未找到确认邮件。');
        return null;
    }

    saveCredentials(email, password, token, confirmationLink, ipAddress) {
        const credentials = `邮箱：${email}\n密码：${password}\n邮箱令牌：${token}\n确认链接：${confirmationLink}\nIP 地址：${ipAddress}\n${'-'.repeat(50)}\n`;
        fs.appendFileSync('accounts.txt', credentials);
        logSuccess('账户信息已保存至 accounts.txt');
    }
}

// 主执行函数
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('输入推荐链接：', async (refUrl) => {
        const refCode = extractRefCodeFromUrl(refUrl);
        rl.question('输入注册次数：', async (numRegistrations) => {
            const bot = new RegistrationBot();
            let successfulRegistrations = 0;
            let failedRegistrations = 0;

            for (let i = 0; i < numRegistrations; i++) {
                try {
                    await bot.createAndRegister(refCode, i + 1);
                    successfulRegistrations++;
                } catch (error) {
                    failedRegistrations++;
                    logError(`注册失败：${error.message}`);
                }
                if (i < numRegistrations - 1) {
                    await randomDelay(1000, 3000);
                }
            }

            logInfo(`注册完成，总成功数：${successfulRegistrations}，总失败数：${failedRegistrations}`);
            rl.close();
        });
    });
}

main().catch(error => logError(error.message));
