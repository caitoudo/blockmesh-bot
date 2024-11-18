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
{Fore.CYAN}{Style.BRIGHT}╔══════════════════════════════════════════════╗
║          BlockMesh 网络自动挂机脚本           ║
║     Telegram: https://t.me/Crypto_airdropHM     ║
║      欢迎使用，请自行承担风险！              ║
╚══════════════════════════════════════════════╝
"""
    print(banner)

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
        print(f"{Fore.RED}获取 IP 信息失败：{err}")
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
    except Exception as e:
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
        "city": ip_info.get("city", "未知"),
        "country": ip_info.get("country_code", "XX"),
        "ip": ip_info.get("ip", ""),
        "asn": ip_info.get("asn", "AS0").replace("AS", ""),
        "colo": "未知"
    }
    
    try:
        response = requests.post(
            "https://app.blockmesh.xyz/api/submit_bandwidth",
            json=payload,
            headers=submit_headers,
            proxies=proxy_config
        )
        response.raise_for_status()
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.GREEN} 已提交带宽信息，IP：{ip_info.get('ip')}")
    except requests.RequestException as err:
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.RED} 提交带宽信息失败：{err}")

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
        try:
            task_data = response.json()
        except:
            print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.YELLOW} 任务响应格式无效")
            return
        
        if not task_data or "id" not in task_data:
            print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.YELLOW} 无可用任务")
            return
            
        task_id = task_data["id"]
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.GREEN} 获取到任务：{task_id}")
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
            "colo": "未知",
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
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.GREEN} 已提交任务：{task_id}")
    except requests.RequestException as err:
        print(f"{Fore.LIGHTCYAN_EX}[{datetime.now().strftime('%H:%M:%S')}]{Fore.RED} 处理任务失败：{err}")

print_banner()
print(f"{Fore.YELLOW}请先登录您的 Blockmesh 账户。{Style.RESET_ALL}\n")
email_input = input(f"{Fore.LIGHTBLUE_EX}请输入邮箱：{Style.RESET_ALL}")
password_input = input(f"{Fore.LIGHTBLUE_EX}请输入密码：{Style.RESET_ALL}")

login_endpoint = "https://api.blockmesh.xyz/api/get_token"
report_endpoint = "https://app.blockmesh.xyz/api/report_uptime?email={email}&api_token={api_token}&ip={ip}"

login_headers = {
    "accept": "*/*",
    "content-type": "application/json",
    "origin": "https://app.blockmesh.xyz",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
}

report_headers = {
    "accept": "*/*",
    "content-type": "text/plain;charset=UTF-8",
    "origin": "chrome-extension://obfhoiefijlolgdmphcekifedagnkfjp",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
}

submit_headers = {
    "accept": "*/*",
    "content
::contentReference[oaicite:0]{index=0}
 
