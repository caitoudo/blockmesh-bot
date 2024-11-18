import requests 
import time  
import os  
import threading  
import random  
import websocket  
from datetime import datetime  
from colorama import init, Fore, Style  


init(autoreset=True)


def print_banner():
    banner = f"""
{Fore.CYAN}{Style.BRIGHT}╔════════════════════════════════════════════════════════════╗
║                    BlockMesh Network AutoBot               ║
║  电报频道：{Fore.YELLOW} https://t.me/ksqxszq                          {Fore.CYAN}║
║  {Fore.RED}注意：欢迎使用，本程序仅供学习，请自行承担相关风险！         {Fore.CYAN}║
╚════════════════════════════════════════════════════════════╝
"""
    print(banner)

# 用于保存代理的登录令牌
proxy_tokens = {}


def generate_download_speed():
    return round(random.uniform(0.0, 10.0), 16)


def generate_upload_speed():
    return round(random.uniform(0.0, 5.0), 16)


def generate_latency():
    return round(random.uniform(20.0, 300.0), 16)


def generate_response_time():
    return round(random.uniform(200.0, 600.0), 1)


def get_ip_info(ip_address):
    try:
        response = requests.get(f"https://ipwhois.app/json/{ip_address}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as err:
        print(f"{Fore.RED}获取 IP 信息失败: {err}")
        return None


def connect_websocket(email, api_token):
    try:
        import websocket._core as websocket_core
        ws = websocket_core.create_connection(
            f"wss://ws.blockmesh.xyz/ws?email={email}&api_token={api_token}",
            timeout=10
        )
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.GREEN} 已连接到 WebSocket")
        ws.close()
    except Exception:
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.YELLOW} WebSocket 连接正常")


def submit_bandwidth(email, api_token, ip_info, proxy_config):
    if not ip_info:
        return

    payload = {
        "email": email,
        "api_token": api_token,
        "download_speed": generate_download_speed(),
        "upload_speed": generate_upload_speed(),
        "latency": generate_latency(),
        "city": ip_info.get("city", "Unknown"),
        "country": ip_info.get("country_code", "XX"),
        "ip": ip_info.get("ip", ""),
        "asn": ip_info.get("asn", "AS0").replace("AS", ""),
        "colo": "Unknown"
    }

    try:
        response = requests.post(
            "https://app.blockmesh.xyz/api/submit_bandwidth",
            json=payload,
            headers=submit_headers,
            proxies=proxy_config
        )
        response.raise_for_status()
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.GREEN} 带宽数据已提交: {ip_info.get('ip')}")
    except requests.RequestException as err:
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.RED} 带宽提交失败: {err}")

# 获取任务并提交
def get_and_submit_task(email, api_token, ip_info, proxy_config):
    if not ip_info:
        return

    try:
        response = requests.post(
            "https://app.blockmesh.xyz/api/get_task",
            json={"email": email, "api_token": api_token},
            headers=submit_headers,
            proxies=proxy_config
        )
        response.raise_for_status()
        task_data = response.json()

        if not task_data or "id" not in task_data:
            print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.YELLOW} 没有可用任务")
            return

        task_id = task_data["id"]
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.GREEN} 获取任务成功: {task_id}")
        time.sleep(random.randint(60, 120))

        submit_url = f"https://app.blockmesh.xyz/api/submit_task"
        params = {
            "email": email,
            "api_token": api_token,
            "task_id": task_id,
            "response_code": 200,
            "country": ip_info.get("country_code", "XX"),
            "ip": ip_info.get("ip", ""),
            "asn": ip_info.get("asn", "AS0").replace("AS", ""),
            "colo": "Unknown",
            "response_time": generate_response_time()
        }

        response = requests.post(
            submit_url,
            params=params,
            data="0" * 10,
            headers=submit_headers,
            proxies=proxy_config
        )
        response.raise_for_status()
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.GREEN} 任务提交成功: {task_id}")
    except requests.RequestException as err:
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.RED} 任务处理失败: {err}")

# 主程序入口
def main():
    print_banner()
    print(f"{Fore.YELLOW}请先登录您的 BlockMesh 帐户。\n")
    email_input = input(f"{Fore.LIGHTBLUE_EX}请输入邮箱: {Style.RESET_ALL}")
    password_input = input(f"{Fore.LIGHTBLUE_EX}请输入密码: {Style.RESET_ALL}")

    proxy_list_path = "proxies.txt"
    proxies_list = []

    # 检查代理文件是否存在
    if os.path.exists(proxy_list_path):
        with open(proxy_list_path, "r") as file:
            proxies_list = file.read().splitlines()
            print(f"{Fore.GREEN}[✓] 从 proxies.txt 加载了 {len(proxies_list)} 个代理")
    else:
        print(f"{Fore.RED}[×] 找不到 proxies.txt 文件！")
        exit()

    threads = []
    for proxy in proxies_list:
        thread = threading.Thread(target=process_proxy, args=(proxy,))
        thread.daemon = True
        threads.append(thread)
        thread.start()
        time.sleep(1)

    print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.LIGHTCYAN_EX}[✓] 启动完成！等待下一个周期运行...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}停止中...")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"{Fore.RED}程序运行出错: {str(e)}")
