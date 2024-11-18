# BlockMesh Network AutoBot

欢迎使用 BlockMesh Network AutoBot！此工具旨在通过模拟带宽提交和任务处理，帮助用户自动化与 BlockMesh 网络的交互。

---

## 功能特点
- 自动登录 BlockMesh 网络
- 模拟带宽测试数据并提交
- 获取并提交任务结果
- 支持多代理运行
- 实时控制台反馈和日志输出

---

## 环境要求
请确保您的环境满足以下条件：
- **Python 版本**：3.8 或更高版本
- **依赖库**：`requests`, `colorama`, `websocket-client`

您可以通过以下命令安装所需依赖：
```bash
pip install -r requirements.txt
```

---

## 使用说明

### 1. 下载代码
```bash
git clone https://github.com/ziqing888/blockmesh-bot.git
cd blockmesh-bot
```

### 2. 配置代理
在项目目录下创建 `proxies.txt` 文件，并在文件中添加您的代理，每行一个，格式如下：
```
http://username:password@host:port
https://username:password@host:port
```

### 3. 运行脚本
执行以下命令启动脚本：
```bash
python3 bot.py
```

### 4. 登录账户
启动脚本后，按照提示输入您的 **邮箱** 和 **密码**，程序会自动登录并开始运行。

---

## 示例输出
启动后，您将看到如下输出：

```
╔════════════════════════════════════════════════════════════╗
║                    BlockMesh Network AutoBot               ║
║  电报频道： https://t.me/ksqxszq                          ║
║  注意：欢迎使用，本程序仅供学习，请自行承担相关风险！         ║
╚════════════════════════════════════════════════════════════╝

请先登录您的 BlockMesh 帐户。

请输入邮箱: user@example.com
请输入密码: ********

[12:34:56] [✓] 从 proxies.txt 加载了 5 个代理
[12:35:00] [✓] 带宽数据已提交: 123.45.67.89
[12:35:05] [✓] 获取任务成功: task_id_001
[12:35:10] [✓] 任务提交成功: task_id_001
```

---

## 注意事项
1. **代理设置**：建议使用稳定的代理服务器以确保脚本运行流畅。
2. **风险提示**：本程序仅供学习和研究使用，请勿用于非法用途。使用本程序造成的后果自行承担。

---

## 联系我们
- **电报频道**：[点击加入](https://t.me/ksqxszq)

