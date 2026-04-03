const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');
const atob = require('atob');
const btoa = require('btoa');
const app = express();
const port = process.env.PORT || 3000;

// 配置
let mytoken = process.env.TOKEN || 'auto';
let guestToken = process.env.GUESTTOKEN || ''; //可以随便取，或者uuid生成，https://1024tools.com/uuid
let BotToken = process.env.TGTOKEN || ''; //可以为空，或者@BotFather中输入/start，/newbot，并关注机器人
let ChatID = process.env.TGID || ''; //可以为空，或者@userinfobot中获取，/start
let TG = process.env.TG || 0; //小白勿动， 开发者专用，1 为推送所有的访问信息，0 为不推送订阅转换后端的访问信息与异常访问
let FileName = process.env.SUBNAME || 'CF-Workers-SUB';
let SUBUpdateTime = process.env.SUBUPTIME || 6; //自定义订阅更新时间，单位小时
let total = 99;//TB
let timestamp = 4102329600000;//2099-12-31

//节点链接 + 订阅链接
let MainData = process.env.LINK || `
https://cfxr.eu.org/getSub
`;

let urls = [];
let subConverter = process.env.SUBAPI || "SUBAPI.cmliussss.net"; //在线订阅转换后端，目前使用CM的订阅转换功能。支持自建psub 可自行搭建https://github.com/bulianglin/psub
let subConfig = process.env.SUBCONFIG || "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_MultiCountry.ini"; //订阅配置文件
let subProtocol = 'https';

// 解析环境变量中的链接
if (process.env.LINKSUB) {
    urls = ADD(process.env.LINKSUB);
}

// 中间件
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 主路由
app.get('*', async (req, res) => {
    await handleRequest(req, res);
});

app.post('*', async (req, res) => {
    await handleRequest(req, res);
});

async function handleRequest(req, res) {
    const userAgentHeader = req.headers['user-agent'];
    const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    // 处理环境变量
    mytoken = process.env.TOKEN || mytoken;
    BotToken = process.env.TGTOKEN || BotToken;
    ChatID = process.env.TGID || ChatID;
    TG = process.env.TG || TG;
    subConverter = process.env.SUBAPI || subConverter;
    
    if (subConverter.includes("http://")) {
        subConverter = subConverter.split("//")[1];
        subProtocol = 'http';
    } else {
        subConverter = subConverter.split("//")[1] || subConverter;
    }
    
    subConfig = process.env.SUBCONFIG || subConfig;
    FileName = process.env.SUBNAME || FileName;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const timeTemp = Math.ceil(currentDate.getTime() / 1000);
    const fakeToken = await MD5MD5(`${mytoken}${timeTemp}`);
    guestToken = process.env.GUESTTOKEN || process.env.GUEST || guestToken;
    if (!guestToken) guestToken = await MD5MD5(mytoken);
    const 访客订阅 = guestToken;

    let UD = Math.floor(((timestamp - Date.now()) / timestamp * total * 1099511627776) / 2);
    total = total * 1099511627776;
    let expire = Math.floor(timestamp / 1000);
    SUBUpdateTime = process.env.SUBUPTIME || SUBUpdateTime;

    if (!([mytoken, fakeToken, 访客订阅].includes(token) || url.pathname == ("/" + mytoken) || url.pathname.includes("/" + mytoken + "?"))) {
        if (TG == 1 && url.pathname !== "/" && url.pathname !== "/favicon.ico") {
            await sendMessage(`#异常访问 ${FileName}`, req.ip, `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
        }
        if (process.env.URL302) {
            return res.redirect(302, process.env.URL302);
        } else if (process.env.URL) {
            return await proxyURL(process.env.URL, url, res);
        } else {
            return res.status(200).type('text/html; charset=UTF-8').send(await nginx());
        }
    } else {
        let 重新汇总所有链接 = ADD(MainData + '\n' + urls.join('\n'));
        let 自建节点 = "";
        let 订阅链接 = "";
        for (let x of 重新汇总所有链接) {
            if (x.toLowerCase().startsWith('http')) {
                订阅链接 += x + '\n';
            } else {
                自建节点 += x + '\n';
            }
        }
        MainData = 自建节点;
        urls = ADD(订阅链接);
        await sendMessage(`#获取订阅 ${FileName}`, req.ip, `UA: ${userAgentHeader}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
        const isSubConverterRequest = req.headers['subconverter-request'] || req.headers['subconverter-version'] || userAgent.includes('subconverter');
        let 订阅格式 = 'base64';
        
        // 获取包含和排除节点的参数
        const includeNodes = url.searchParams.get('include') ? url.searchParams.get('include').split(',') : [];
        const excludeNodes = url.searchParams.get('exclude') ? url.searchParams.get('exclude').split(',') : [];
        
        if (!(userAgent.includes('null') || isSubConverterRequest || userAgent.includes('nekobox') || userAgent.includes(('CF-Workers-SUB').toLowerCase()))) {
            if (userAgent.includes('sing-box') || userAgent.includes('singbox') || url.searchParams.has('sb') || url.searchParams.has('singbox')) {
                订阅格式 = 'singbox';
            } else if (userAgent.includes('surge') || url.searchParams.has('surge')) {
                订阅格式 = 'surge';
            } else if (userAgent.includes('quantumult') || url.searchParams.has('quanx')) {
                订阅格式 = 'quanx';
            } else if (userAgent.includes('loon') || url.searchParams.has('loon')) {
                订阅格式 = 'loon';
            } else if (userAgent.includes('clash') || userAgent.includes('meta') || userAgent.includes('mihomo') || url.searchParams.has('clash')) {
                订阅格式 = 'clash';
            }
        }

        let subConverterUrl;
        let 订阅转换URL = `${url.origin}/${await MD5MD5(fakeToken)}?token=${fakeToken}`;
        let req_data = MainData;

        let 追加UA = 'v2rayn';
        if (url.searchParams.has('b64') || url.searchParams.has('base64')) 订阅格式 = 'base64';
        else if (url.searchParams.has('clash')) 追加UA = 'clash';
        else if (url.searchParams.has('singbox')) 追加UA = 'singbox';
        else if (url.searchParams.has('surge')) 追加UA = 'surge';
        else if (url.searchParams.has('quanx')) 追加UA = 'Quantumult%20X';
        else if (url.searchParams.has('loon')) 追加UA = 'Loon';

        const 订阅链接数组 = [...new Set(urls)].filter(item => item?.trim?.()); // 去重
        if (订阅链接数组.length > 0) {
            const 请求订阅响应内容 = await getSUB(订阅链接数组, req, 追加UA, userAgentHeader);
            console.log(请求订阅响应内容);
            req_data += 请求订阅响应内容[0].join('\n');
            订阅转换URL += "|" + 请求订阅响应内容[1];
            if (订阅格式 == 'base64' && !isSubConverterRequest && 请求订阅响应内容[1].includes('://')) {
                subConverterUrl = `${subProtocol}://${subConverter}/sub?target=mixed&url=${encodeURIComponent(请求订阅响应内容[1])}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
                try {
                    const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': 'v2rayN/CF-Workers-SUB  (https://github.com/cmliu/CF-Workers-SUB)' } });
                    if (subConverterResponse.ok) {
                        const subConverterContent = await subConverterResponse.text();
                        req_data += '\n' + atob(subConverterContent);
                    }
                } catch (error) {
                    console.log('订阅转换请回base64失败，检查订阅转换后端是否正常运行');
                }
            }
        }

        if (process.env.WARP) 订阅转换URL += "|" + (ADD(process.env.WARP)).join("|");
        //修复中文错误
        const utf8Encoder = new TextEncoder();
        const encodedData = utf8Encoder.encode(req_data);
        const utf8Decoder = new TextDecoder();
        const text = utf8Decoder.decode(encodedData);

        //去重
        const uniqueLines = new Set(text.split('\n'));
        let result = [...uniqueLines].join('\n');
        
        // 节点过滤
        if (includeNodes.length > 0 || excludeNodes.length > 0) {
            const lines = result.split('\n');
            const filteredLines = lines.filter(line => {
                if (!line) return false;
                
                // 检查是否在排除列表中
                const isExcluded = excludeNodes.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()));
                if (isExcluded) return false;
                
                // 检查是否在包含列表中（如果包含列表不为空）
                if (includeNodes.length > 0) {
                    return includeNodes.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()));
                }
                
                // 如果没有包含列表，则默认包含所有节点
                return true;
            });
            result = filteredLines.join('\n');
        }

        let base64Data;
        try {
            base64Data = btoa(result);
        } catch (e) {
            function encodeBase64(data) {
                const binary = new TextEncoder().encode(data);
                let base64 = '';
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

                for (let i = 0; i < binary.length; i += 3) {
                    const byte1 = binary[i];
                    const byte2 = binary[i + 1] || 0;
                    const byte3 = binary[i + 2] || 0;

                    base64 += chars[byte1 >> 2];
                    base64 += chars[((byte1 & 3) << 4) | (byte2 >> 4)];
                    base64 += chars[((byte2 & 15) << 2) | (byte3 >> 6)];
                    base64 += chars[byte3 & 63];
                }

                const padding = 3 - (binary.length % 3 || 3);
                return base64.slice(0, base64.length - padding) + '=='.slice(0, padding);
            }

            base64Data = encodeBase64(result);
        }

        // 构建响应头对象
        const responseHeaders = {
            "content-type": "text/plain; charset=utf-8",
            "Profile-Update-Interval": `${SUBUpdateTime}`,
            "Profile-web-page-url": req.url.includes('?') ? req.url.split('?')[0] : req.url,
        };

        if (订阅格式 == 'base64' || token == fakeToken) {
            return res.set(responseHeaders).send(base64Data);
        } else if (订阅格式 == 'clash') {
            subConverterUrl = `${subProtocol}://${subConverter}/sub?target=clash&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
        } else if (订阅格式 == 'singbox') {
            subConverterUrl = `${subProtocol}://${subConverter}/sub?target=singbox&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
        } else if (订阅格式 == 'surge') {
            subConverterUrl = `${subProtocol}://${subConverter}/sub?target=surge&ver=4&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&new_name=true`;
        } else if (订阅格式 == 'quanx') {
            subConverterUrl = `${subProtocol}://${subConverter}/sub?target=quanx&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false&udp=true`;
        } else if (订阅格式 == 'loon') {
            subConverterUrl = `${subProtocol}://${subConverter}/sub?target=loon&url=${encodeURIComponent(订阅转换URL)}&insert=false&config=${encodeURIComponent(subConfig)}&emoji=true&list=false&tfo=false&scv=true&fdn=false&sort=false`;
        }
        
        try {
            const subConverterResponse = await fetch(subConverterUrl, { headers: { 'User-Agent': userAgentHeader } });//订阅转换
            if (!subConverterResponse.ok) return res.set(responseHeaders).send(base64Data);
            let subConverterContent = await subConverterResponse.text();
            if (订阅格式 == 'clash') subConverterContent = await clashFix(subConverterContent);
            // 只有非浏览器订阅才会返回SUBNAME
            if (!userAgent.includes('mozilla')) responseHeaders["Content-Disposition"] = `attachment; filename*=utf-8''${encodeURIComponent(FileName)}`;
            return res.set(responseHeaders).send(subConverterContent);
        } catch (error) {
            return res.set(responseHeaders).send(base64Data);
        }
    }
}

function ADD(envadd) {
    var addtext = envadd.replace(/[\t"'|\r\n]+/g, '\n').replace(/\n+/g, '\n');
    if (addtext.charAt(0) == '\n') addtext = addtext.slice(1);
    if (addtext.charAt(addtext.length - 1) == '\n') addtext = addtext.slice(0, addtext.length - 1);
    const add = addtext.split('\n');
    return add;
}

async function nginx() {
    const text = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Welcome to nginx!</title>
    <style>
        body {
            width: 35em;
            margin: 0 auto;
            font-family: Tahoma, Verdana, Arial, sans-serif;
        }
    </style>
    </head>
    <body>
    <h1>Welcome to nginx!</h1>
    <p>If you see this page, the nginx web server is successfully installed and
    working. Further configuration is required.</p>
    
    <p>For online documentation and support please refer to
    <a href="http://nginx.org/">nginx.org</a>.<br/>
    Commercial support is available at
    <a href="http://nginx.com/">nginx.com</a>.</p>
    
    <p><em>Thank you for using nginx.</em></p>
    </body>
    </html>
    `
    return text;
}

async function sendMessage(type, ip, add_data = "") {
    if (BotToken !== '' && ChatID !== '') {
        let msg = "";
        try {
            const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
            if (response.status == 200) {
                const ipInfo = await response.json();
                msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
            } else {
                msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
            }
        } catch (error) {
            msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
        }

        let url = "https://api.telegram.org/bot" + BotToken + "/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
        return fetch(url, {
            method: 'get',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;',
                'Accept-Encoding': 'gzip, deflate, br',
                'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
            }
        });
    }
}

function base64Decode(str) {
    const bytes = Buffer.from(str, 'base64');
    return bytes.toString('utf-8');
}

async function MD5MD5(text) {
    const crypto = require('crypto');
    
    function md5(input) {
        return crypto.createHash('md5').update(input).digest('hex');
    }
    
    const firstPass = md5(text);
    const secondPass = md5(firstPass.slice(7, 27));
    
    return secondPass.toLowerCase();
}

function clashFix(content) {
    if (content.includes('wireguard') && !content.includes('remote-dns-resolve')) {
        let lines;
        if (content.includes('\r\n')) {
            lines = content.split('\r\n');
        } else {
            lines = content.split('\n');
        }

        let result = "";
        for (let line of lines) {
            if (line.includes('type: wireguard')) {
                const 备改内容 = `, mtu: 1280, udp: true`;
                const 正确内容 = `, mtu: 1280, remote-dns-resolve: true, udp: true`;
                result += line.replace(new RegExp(备改内容, 'g'), 正确内容) + '\n';
            } else {
                result += line + '\n';
            }
        }

        content = result;
    }
    return content;
}

async function proxyURL(proxyURL, url, res) {
    const URLs = ADD(proxyURL);
    const fullURL = URLs[Math.floor(Math.random() * URLs.length)];

    // 解析目标 URL
    let parsedURL = new URL(fullURL);
    console.log(parsedURL);
    // 提取并可能修改 URL 组件
    let URLProtocol = parsedURL.protocol.slice(0, -1) || 'https';
    let URLHostname = parsedURL.hostname;
    let URLPathname = parsedURL.pathname;
    let URLSearch = parsedURL.search;

    // 处理 pathname
    if (URLPathname.charAt(URLPathname.length - 1) == '/') {
        URLPathname = URLPathname.slice(0, -1);
    }
    URLPathname += url.pathname;

    // 构建新的 URL
    let newURL = `${URLProtocol}://${URLHostname}${URLPathname}${URLSearch}`;

    // 反向代理请求
    let response;
    try {
        response = await fetch(newURL);
    } catch (error) {
        return res.status(500).send('代理请求失败');
    }

    // 创建新的响应
    const newResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: await response.text()
    };

    // 添加自定义头部，包含 URL 信息
    res.set('X-New-URL', newURL);

    return res.status(newResponse.status).send(newResponse.body);
}

async function getSUB(api, request, 追加UA, userAgentHeader) {
    if (!api || api.length === 0) {
        return [];
    } else api = [...new Set(api)]; // 去重
    let newapi = "";
    let 订阅转换URLs = "";
    let 异常订阅 = "";

    try {
        // 使用Promise.allSettled等待所有API请求完成，无论成功或失败
        const responses = await Promise.allSettled(api.map(apiUrl => getUrl(request, apiUrl, 追加UA, userAgentHeader).then(response => response.ok ? response.text() : Promise.reject(response))));

        // 遍历所有响应
        const modifiedResponses = responses.map((response, index) => {
            // 检查是否请求成功
            if (response.status === 'rejected') {
                const reason = response.reason;
                console.error(`请求失败: ${api[index]}, 错误信息: ${reason.status} ${reason.statusText}`);
                return {
                    status: '请求失败',
                    value: null,
                    apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
                };
            }
            return {
                status: response.status,
                value: response.value,
                apiUrl: api[index] // 将原始的apiUrl添加到返回对象中
            };
        });

        console.log(modifiedResponses); // 输出修改后的响应数组

        for (const response of modifiedResponses) {
            // 检查响应状态是否为'fulfilled'
            if (response.status === 'fulfilled') {
                const content = await response.value || 'null'; // 获取响应的内容
                if (content.includes('proxies:')) {
                    //console.log('Clash订阅: ' + response.apiUrl);
                    订阅转换URLs += "|" + response.apiUrl; // Clash 配置
                } else if (content.includes('outbounds"') && content.includes('inbounds"')) {
                    //console.log('Singbox订阅: ' + response.apiUrl);
                    订阅转换URLs += "|" + response.apiUrl; // Singbox 配置
                } else if (content.includes('://')) {
                    //console.log('明文订阅: ' + response.apiUrl);
                    newapi += content + '\n'; // 追加内容
                } else if (isValidBase64(content)) {
                    //console.log('Base64订阅: ' + response.apiUrl);
                    newapi += base64Decode(content) + '\n'; // 解码并追加内容
                } else {
                    const 异常订阅LINK = `trojan://CMLiussss@127.0.0.1:8888?security=tls&allowInsecure=1&type=tcp&headerType=none#%E5%BC%82%E5%B8%B8%E8%AE%A2%E9%98%85%20${response.apiUrl.split('://')[1].split('/')[0]}`;
                    console.log('异常订阅: ' + 异常订阅LINK);
                    异常订阅 += `${异常订阅LINK}\n`;
                }
            }
        }
    } catch (error) {
        console.error(error); // 捕获并输出错误信息
    }

    const 订阅内容 = ADD(newapi + 异常订阅); // 将处理后的内容转换为数组
    // 返回处理后的结果
    return [订阅内容, 订阅转换URLs];
}

async function getUrl(request, targetUrl, 追加UA, userAgentHeader) {
    // 设置自定义 User-Agent
    const newHeaders = {
        "User-Agent": `${Buffer.from('djJyYXlOLzYuNDU=').toString('utf-8')} cmliu/CF-Workers-SUB ${追加UA}(${userAgentHeader})`
    };

    // 构建新的请求对象
    const options = {
        method: request.method,
        headers: newHeaders,
        redirect: "follow"
    };

    if (request.method !== "GET" && request.body) {
        options.body = request.body;
    }

    // 输出请求的详细信息
    console.log(`请求URL: ${targetUrl}`);
    console.log(`请求头: ${JSON.stringify(newHeaders)}`);
    console.log(`请求方法: ${request.method}`);

    // 发送请求并返回响应
    return fetch(targetUrl, options);
}

function isValidBase64(str) {
    // 先移除所有空白字符(空格、换行、回车等)
    const cleanStr = str.replace(/\s/g, '');
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(cleanStr);
}

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
