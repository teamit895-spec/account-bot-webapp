#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 Быстрый Instagram API через HTTP (без Selenium)
~2-3 секунды вместо 24

Запуск: python instagram_fast_api.py bot.py
"""

import sys
import os
from datetime import datetime

# Новый быстрый Instagram API
INSTAGRAM_FAST_API = '''
# ==================== INSTAGRAM FAST API (HTTP) ====================
class InstagramFastAPI:
    """Быстрый Instagram через HTTP запросы (без Selenium)"""
    
    GRAPHQL_URL = "https://www.instagram.com/api/v1/users/web_profile_info/"
    
    def __init__(self):
        self.accounts = []
        self.current_index = 0
        self.account_errors = {}
        self._parse_accounts()
    
    def _parse_accounts(self):
        """Парсинг аккаунтов"""
        for acc_str in INSTAGRAM_ACCOUNTS:
            try:
                parts = acc_str.split("|")
                if len(parts) < 3:
                    continue
                
                login_pass = parts[0].split(":")
                username = login_pass[0]
                user_agent = parts[1]
                cookies_str = parts[2]
                
                cookies = {}
                for cookie in cookies_str.split(";"):
                    if "=" in cookie:
                        key, value = cookie.strip().split("=", 1)
                        cookies[key] = value
                
                if cookies.get("sessionid"):
                    self.accounts.append({
                        "username": username,
                        "user_agent": user_agent,
                        "cookies": cookies,
                        "sessionid": cookies.get("sessionid"),
                        "ds_user_id": cookies.get("ds_user_id"),
                    })
                    logger.info(f"Instagram HTTP: account {username} loaded")
            except Exception as e:
                logger.error(f"Instagram parse error: {e}")
        
        logger.info(f"Instagram HTTP: {len(self.accounts)} accounts ready")
    
    def _get_account(self) -> Optional[dict]:
        """Получить доступный аккаунт"""
        if not self.accounts:
            return None
        
        now = datetime.now()
        for i in range(len(self.accounts)):
            idx = (self.current_index + i) % len(self.accounts)
            acc = self.accounts[idx]
            
            error_time = self.account_errors.get(acc["username"])
            if error_time and (now - error_time).total_seconds() < 300:
                continue
            
            self.current_index = (idx + 1) % len(self.accounts)
            return acc
        
        return None
    
    def parse_instagram_link(self, text: str) -> Optional[str]:
        """Парсит username из ссылки"""
        text = text.strip().rstrip('/').replace('www.', '')
        patterns = [
            r'instagram\\.com/([a-zA-Z0-9_.]+)',
            r'instagr\\.am/([a-zA-Z0-9_.]+)',
            r'^@?([a-zA-Z0-9_.]+)$'
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                username = match.group(1)
                if username not in ['p', 'tv', 'reel', 'reels', 'stories', 'direct', 'explore']:
                    return username
        return None
    
    async def get_profile_info(self, username: str, retry_count: int = 0) -> dict:
        """Получить профиль через HTTP API"""
        if retry_count >= len(self.accounts):
            return {"error": "Все аккаунты заблокированы"}
        
        acc = self._get_account()
        if not acc:
            return {"error": "Нет доступных аккаунтов"}
        
        logger.info(f"Instagram HTTP: {acc['username']} -> {username}")
        
        try:
            session = await get_http_session()
            
            headers = {
                "User-Agent": acc["user_agent"],
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
                "Accept-Encoding": "gzip, deflate, br",
                "X-IG-App-ID": "936619743392459",
                "X-ASBD-ID": "129477",
                "X-IG-WWW-Claim": "0",
                "X-Requested-With": "XMLHttpRequest",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Referer": f"https://www.instagram.com/{username}/",
                "Origin": "https://www.instagram.com",
            }
            
            cookies = {
                "sessionid": acc["sessionid"],
                "ds_user_id": acc["ds_user_id"],
                "ig_did": acc["cookies"].get("ig_did", ""),
                "mid": acc["cookies"].get("mid", ""),
                "csrftoken": acc["cookies"].get("csrftoken", ""),
                "rur": acc["cookies"].get("rur", ""),
            }
            
            # Метод 1: GraphQL API
            url = f"{self.GRAPHQL_URL}?username={username}"
            
            async with session.get(url, headers=headers, cookies=cookies) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    user_data = data.get("data", {}).get("user")
                    
                    if user_data:
                        return self._parse_graphql_response(user_data, username)
                
                elif resp.status in [401, 403]:
                    logger.warning(f"Instagram HTTP: {acc['username']} blocked")
                    self.account_errors[acc["username"]] = datetime.now()
                    return await self.get_profile_info(username, retry_count + 1)
                
                elif resp.status == 404:
                    return {"error": "Профиль не найден"}
            
            # Метод 2: Fallback на HTML парсинг
            return await self._fallback_html(username, acc, session)
            
        except Exception as e:
            logger.error(f"Instagram HTTP error: {e}")
            return {"error": str(e)[:100]}
    
    def _parse_graphql_response(self, user: dict, username: str) -> dict:
        """Парсинг GraphQL ответа"""
        profile = {
            "username": username,
            "full_name": user.get("full_name", ""),
            "biography": user.get("biography", ""),
            "followers": user.get("edge_followed_by", {}).get("count", 0),
            "following": user.get("edge_follow", {}).get("count", 0),
            "posts_count": user.get("edge_owner_to_timeline_media", {}).get("count", 0),
            "is_private": user.get("is_private", False),
            "is_verified": user.get("is_verified", False),
            "profile_pic_url": user.get("profile_pic_url_hd") or user.get("profile_pic_url", ""),
            "photos": []
        }
        
        # Получаем фото
        media = user.get("edge_owner_to_timeline_media", {}).get("edges", [])
        for item in media[:12]:
            node = item.get("node", {})
            photo_url = node.get("display_url")
            if photo_url:
                profile["photos"].append({
                    "url": photo_url,
                    "timestamp": node.get("taken_at_timestamp"),
                    "likes": node.get("edge_liked_by", {}).get("count", 0),
                    "comments": node.get("edge_media_to_comment", {}).get("count", 0),
                })
        
        return {"success": True, "profile": profile}
    
    async def _fallback_html(self, username: str, acc: dict, session) -> dict:
        """Fallback: парсинг HTML страницы"""
        headers = {
            "User-Agent": acc["user_agent"],
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        }
        
        cookies = {k: v for k, v in acc["cookies"].items()}
        
        url = f"https://www.instagram.com/{username}/"
        
        async with session.get(url, headers=headers, cookies=cookies) as resp:
            if resp.status != 200:
                return {"error": f"HTTP {resp.status}"}
            
            html = await resp.text()
            
            # Проверяем login redirect
            if "/accounts/login" in str(resp.url):
                self.account_errors[acc["username"]] = datetime.now()
                return {"error": "login_required"}
            
            profile = {
                "username": username,
                "full_name": "",
                "biography": "",
                "followers": 0,
                "following": 0,
                "posts_count": 0,
                "is_private": False,
                "is_verified": False,
                "profile_pic_url": "",
                "photos": []
            }
            
            # Парсим og:description
            og_match = re.search(r'<meta[^>]*property="og:description"[^>]*content="([^"]*)"', html)
            if og_match:
                desc = og_match.group(1)
                f_match = re.search(r'([\\d,\\.]+[KkMm]?)\\s*[Ff]ollowers', desc)
                if f_match:
                    profile["followers"] = self._parse_count(f_match.group(1))
                f_match = re.search(r'([\\d,\\.]+[KkMm]?)\\s*[Ff]ollowing', desc)
                if f_match:
                    profile["following"] = self._parse_count(f_match.group(1))
                f_match = re.search(r'([\\d,\\.]+[KkMm]?)\\s*[Pp]osts', desc)
                if f_match:
                    profile["posts_count"] = self._parse_count(f_match.group(1))
            
            # Парсим title
            title_match = re.search(r'<title>([^<]+)</title>', html)
            if title_match:
                title = title_match.group(1)
                name_m = re.search(r'^([^(@•]+?)(?:\\s*\\(@|\\s*•)', title)
                if name_m:
                    profile["full_name"] = name_m.group(1).strip()
            
            # JSON данные
            for pattern in [r'"full_name"\\s*:\\s*"([^"]*)"', r'"biography"\\s*:\\s*"([^"]*)"']:
                match = re.search(pattern, html)
                if match:
                    key = "full_name" if "full_name" in pattern else "biography"
                    try:
                        profile[key] = match.group(1).encode().decode('unicode-escape')
                    except:
                        profile[key] = match.group(1)
            
            if '"is_private":true' in html:
                profile["is_private"] = True
            if '"is_verified":true' in html:
                profile["is_verified"] = True
            
            # Аватар
            av_match = re.search(r'"profile_pic_url(?:_hd)?"\\s*:\\s*"([^"]+)"', html)
            if av_match:
                profile["profile_pic_url"] = av_match.group(1).replace('\\\\u0026', '&').replace('\\\\/', '/')
            
            # Фото
            urls = re.findall(r'"display_url"\\s*:\\s*"([^"]+)"', html)
            timestamps = re.findall(r'"taken_at_timestamp"\\s*:\\s*(\\d+)', html)
            
            for i, url in enumerate(urls[:12]):
                clean_url = url.replace('\\\\u0026', '&').replace('\\\\/', '/')
                ts = int(timestamps[i]) if i < len(timestamps) else None
                profile["photos"].append({"url": clean_url, "timestamp": ts})
            
            return {"success": True, "profile": profile}
    
    def _parse_count(self, text: str) -> int:
        """Парсит 1.5K, 2.3M"""
        text = text.replace(',', '').strip()
        mult = 1
        if text.endswith(('K', 'k')):
            mult = 1000
            text = text[:-1]
        elif text.endswith(('M', 'm')):
            mult = 1000000
            text = text[:-1]
        try:
            return int(float(text) * mult)
        except:
            return 0
    
    async def download_photo(self, url: str) -> Optional[bytes]:
        """Скачать фото"""
        url = url.replace('\\\\u0026', '&').replace('\\\\/', '/')
        try:
            session = await get_http_session()
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                "Referer": "https://www.instagram.com/",
            }
            async with session.get(url, headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.read()
                    if len(data) > 1000:
                        return data
        except Exception as e:
            logger.error(f"Instagram download error: {e}")
        return None

'''

# Патч для замены старого InstagramAPI
def apply_patch(bot_path: str):
    if not os.path.exists(bot_path):
        print(f"❌ Файл не найден: {bot_path}")
        return False
    
    with open(bot_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Бэкап
    backup = f"{bot_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Бэкап: {backup}")
    
    # 1. Находим и заменяем класс InstagramAPI
    print("\n🔄 Заменяю InstagramAPI на быструю HTTP версию...")
    
    # Ищем начало класса
    insta_start = content.find("class InstagramAPI:")
    if insta_start == -1:
        print("❌ Класс InstagramAPI не найден")
        return False
    
    # Ищем конец класса
    lines = content[insta_start:].split('\n')
    insta_end = insta_start
    for i, line in enumerate(lines[1:], 1):
        if line and not line.startswith(' ') and not line.startswith('\t'):
            if line.startswith('class ') or line.startswith('# =='):
                insta_end = insta_start + sum(len(l) + 1 for l in lines[:i])
                break
    
    if insta_end <= insta_start:
        print("❌ Не удалось найти конец класса")
        return False
    
    # Заменяем
    content = content[:insta_start] + INSTAGRAM_FAST_API + "\n\n# Алиас для совместимости\nInstagramAPI = InstagramFastAPI\n\n" + content[insta_end:]
    
    print("✅ InstagramAPI заменён на InstagramFastAPI")
    
    # Сохраняем
    with open(bot_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Проверяем синтаксис
    try:
        compile(content, bot_path, 'exec')
        print("✅ Синтаксис OK")
        return True
    except SyntaxError as e:
        print(f"❌ Ошибка: {e}")
        with open(backup, 'r', encoding='utf-8') as f:
            with open(bot_path, 'w', encoding='utf-8') as bf:
                bf.write(f.read())
        print("🔄 Восстановлено из бэкапа")
        return False


def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║     🚀 БЫСТРЫЙ INSTAGRAM API (HTTP вместо Selenium)        ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  БЫЛО (Selenium):                                          ║
║  ├─ Запуск браузера: ~5 сек                                ║
║  ├─ Загрузка страницы: ~10 сек                             ║
║  ├─ Парсинг: ~5 сек                                        ║
║  └─ ИТОГО: ~20-25 секунд                                   ║
║                                                            ║
║  СТАЛО (HTTP):                                             ║
║  ├─ API запрос: ~1 сек                                     ║
║  ├─ Парсинг: ~0.1 сек                                      ║
║  └─ ИТОГО: ~2-3 секунды                                    ║
║                                                            ║
║  Ускорение: 10x 🔥                                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
""")
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}\n")
    
    if apply_patch(bot_path):
        print("""
╔════════════════════════════════════════════════════════════╗
║                    ✅ ГОТОВО!                              ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  Instagram теперь работает через HTTP API:                 ║
║                                                            ║
║  • GraphQL API (основной метод)                            ║
║  • HTML парсинг (fallback)                                 ║
║  • Автоматическая смена аккаунтов                          ║
║  • Кэширование через get_http_session()                    ║
║                                                            ║
║  Скорость: ~2-3 сек вместо ~24 сек                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
""")


if __name__ == "__main__":
    main()
