#!/usr/bin/env python3
"""
Патч: Гибридный Instagram API (HTTP + Selenium fallback)
- Сначала пробует HTTP (2-3 сек)
- Если нет фото - fallback на Selenium (15-20 сек)
"""

import re
import shutil
from datetime import datetime

BOT_FILE = "bot.py"

# Новый гибридный класс Instagram
NEW_INSTAGRAM_CLASS = '''
# ==================== INSTAGRAM API (HYBRID: HTTP + Selenium) ====================
class InstagramAPI:
    """Гибридный Instagram API: сначала HTTP, потом Selenium если нужно"""

    GRAPHQL_URL = "https://www.instagram.com/api/v1/users/web_profile_info/"

    def __init__(self):
        self.accounts = []
        self.current_index = 0
        self.account_errors = {}
        self.error_cooldown = 300
        self._parse_accounts()

    def _parse_accounts(self):
        """Парсинг аккаунтов из конфига"""
        for acc_str in INSTAGRAM_ACCOUNTS:
            try:
                parts = acc_str.split("|")
                if len(parts) < 3:
                    continue

                login_pass = parts[0].split(":")
                username = login_pass[0]
                password = login_pass[1] if len(login_pass) > 1 else ""
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
                        "password": password,
                        "user_agent": user_agent,
                        "cookies": cookies
                    })
                    logger.info(f"Instagram: account {username} loaded")
            except Exception as e:
                logger.error(f"Instagram parse error: {e}")

        logger.info(f"Instagram: {len(self.accounts)} accounts ready")

    def _get_available_account(self) -> Optional[dict]:
        """Получить доступный аккаунт"""
        if not self.accounts:
            return None

        now = datetime.now()
        for i in range(len(self.accounts)):
            idx = (self.current_index + i) % len(self.accounts)
            acc = self.accounts[idx]

            error_time = self.account_errors.get(acc["username"])
            if error_time and (now - error_time).total_seconds() < self.error_cooldown:
                continue

            self.current_index = (idx + 1) % len(self.accounts)
            return acc

        return None

    def parse_instagram_link(self, text: str) -> Optional[str]:
        """Парсит ссылку Instagram"""
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
        """Получить информацию о профиле - сначала HTTP, потом Selenium"""
        if retry_count >= len(self.accounts):
            return {"error": "Все аккаунты заблокированы"}

        acc = self._get_available_account()
        if not acc:
            return {"error": "Нет доступных аккаунтов"}

        # 1. Пробуем HTTP (быстро)
        logger.info(f"Instagram HTTP: {acc['username']} -> {username}")
        result = await self._http_get_profile(username, acc)

        if result.get("success"):
            profile = result.get("profile", {})
            # Если HTTP нашёл профиль но без фото - пробуем Selenium
            if not profile.get("photos") and not profile.get("is_private"):
                logger.info(f"Instagram: HTTP got profile but no photos, trying Selenium...")
                selenium_result = await self._selenium_get_profile(username, acc)
                if selenium_result.get("success"):
                    selenium_profile = selenium_result.get("profile", {})
                    # Берём фото из Selenium, остальное из HTTP
                    if selenium_profile.get("photos"):
                        profile["photos"] = selenium_profile["photos"]
                        logger.info(f"Instagram: Got {len(profile['photos'])} photos from Selenium")
                    # Обновляем аватар если HTTP не нашёл
                    if not profile.get("profile_pic_url") and selenium_profile.get("profile_pic_url"):
                        profile["profile_pic_url"] = selenium_profile["profile_pic_url"]
                return {"success": True, "profile": profile}
            return result

        # 2. HTTP не сработал - используем Selenium
        logger.info(f"Instagram: HTTP failed, using Selenium for {username}")
        return await self._selenium_get_profile(username, acc, retry_count)

    async def _http_get_profile(self, username: str, acc: dict) -> dict:
        """HTTP метод получения профиля"""
        try:
            session = await get_http_session()

            # Desktop User-Agent для HTTP
            desktop_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

            headers = {
                "User-Agent": desktop_ua,
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
                "X-IG-App-ID": "936619743392459",
                "X-Requested-With": "XMLHttpRequest",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin",
                "Referer": f"https://www.instagram.com/{username}/",
            }

            cookies = {
                "sessionid": acc["cookies"].get("sessionid", ""),
                "ds_user_id": acc["cookies"].get("ds_user_id", ""),
                "ig_did": acc["cookies"].get("ig_did", ""),
                "mid": acc["cookies"].get("mid", ""),
                "csrftoken": acc["cookies"].get("csrftoken", ""),
                "rur": acc["cookies"].get("rur", ""),
            }

            url = f"{self.GRAPHQL_URL}?username={username}"

            async with session.get(url, headers=headers, cookies=cookies, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    user_data = data.get("data", {}).get("user")
                    if user_data:
                        return self._parse_graphql_response(user_data, username)
                elif resp.status in [401, 403]:
                    self.account_errors[acc["username"]] = datetime.now()
                    return {"error": "login_required"}
                elif resp.status == 404:
                    return {"error": "Профиль не найден"}

            # Fallback: парсим HTML страницу
            return await self._http_parse_html(username, acc, session)

        except Exception as e:
            logger.warning(f"Instagram HTTP error: {e}")
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

        # Получаем фото из GraphQL
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

    async def _http_parse_html(self, username: str, acc: dict, session) -> dict:
        """Fallback: парсинг HTML страницы через HTTP"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
                "Accept": "text/html,application/xhtml+xml",
            }
            cookies = acc["cookies"]

            url = f"https://www.instagram.com/{username}/"
            async with session.get(url, headers=headers, cookies=cookies) as resp:
                if resp.status != 200:
                    return {"error": f"HTTP {resp.status}"}

                html = await resp.text()

                if "/accounts/login" in str(resp.url):
                    self.account_errors[acc["username"]] = datetime.now()
                    return {"error": "login_required"}

                return self._parse_html_content(html, username)

        except Exception as e:
            return {"error": str(e)[:100]}

    def _parse_html_content(self, html: str, username: str) -> dict:
        """Парсинг HTML контента"""
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

        # og:description
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

        seen = set()
        for i, url in enumerate(urls[:12]):
            clean = url.replace('\\\\u0026', '&').replace('\\\\/', '/')
            if clean in seen or 's150x150' in clean or 's320x320' in clean:
                continue
            seen.add(clean)
            ts = int(timestamps[i]) if i < len(timestamps) else None
            profile["photos"].append({"url": clean, "timestamp": ts})

        return {"success": True, "profile": profile}

    async def _selenium_get_profile(self, username: str, acc: dict, retry_count: int = 0) -> dict:
        """Selenium метод получения профиля (надёжный, но медленный)"""
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._selenium_worker, username, acc)

            error_msg = str(result.get("error", "")).lower()
            if result.get("error") and ("login" in error_msg or "block" in error_msg):
                self.account_errors[acc["username"]] = datetime.now()
                if retry_count < len(self.accounts) - 1:
                    next_acc = self._get_available_account()
                    if next_acc:
                        return await self._selenium_get_profile(username, next_acc, retry_count + 1)

            return result
        except Exception as e:
            logger.error(f"Instagram Selenium error: {e}")
            return {"error": str(e)[:100]}

    def _selenium_worker(self, username: str, acc: dict) -> dict:
        """Selenium worker (запускается в executor)"""
        driver = None
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support.ui import WebDriverWait
            from selenium.webdriver.support import expected_conditions as EC
            import time

            url = f"https://www.instagram.com/{username}/"

            chrome_options = Options()
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument("--page-load-strategy=eager")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])

            ua = acc.get("user_agent") or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0"
            chrome_options.add_argument(f"user-agent={ua}")

            try:
                from webdriver_manager.chrome import ChromeDriverManager
                from selenium.webdriver.chrome.service import Service
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=chrome_options)
            except:
                driver = webdriver.Chrome(options=chrome_options)

            driver.set_page_load_timeout(20)
            driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            # Устанавливаем cookies через CDP
            logger.info("Instagram Selenium: setting cookies via CDP")
            try:
                driver.execute_cdp_cmd("Network.enable", {})
                for name, value in acc["cookies"].items():
                    try:
                        driver.execute_cdp_cmd("Network.setCookie", {
                            "name": name,
                            "value": value,
                            "domain": ".instagram.com",
                            "path": "/",
                            "secure": True,
                            "httpOnly": name in ["sessionid", "ds_user_id"],
                            "sameSite": "None"
                        })
                    except:
                        pass
            except Exception as e:
                logger.warning(f"CDP failed: {e}, using standard cookies")
                driver.get("https://www.instagram.com/")
                time.sleep(1)
                for name, value in acc["cookies"].items():
                    try:
                        driver.add_cookie({'name': name, 'value': value, 'domain': '.instagram.com', 'path': '/'})
                    except:
                        pass
                driver.refresh()
                time.sleep(1)

            logger.info(f"Instagram Selenium: loading {url}")
            try:
                driver.get(url)
            except:
                pass

            time.sleep(2)

            current_url = driver.current_url
            if "/accounts/login" in current_url:
                driver.quit()
                return {"error": "login_required"}

            try:
                WebDriverWait(driver, 8).until(EC.presence_of_element_located((By.TAG_NAME, "article")))
            except:
                try:
                    WebDriverWait(driver, 3).until(EC.presence_of_element_located((By.TAG_NAME, "main")))
                except:
                    pass

            # Скролл для загрузки фото
            try:
                driver.execute_script("window.scrollTo(0, 800);")
                time.sleep(0.5)
                driver.execute_script("window.scrollTo(0, 0);")
            except:
                pass

            time.sleep(1)
            page_source = driver.page_source

            # Парсинг
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

            # og:description
            og_match = re.search(r'<meta[^>]*property="og:description"[^>]*content="([^"]*)"', page_source)
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

            # JSON данные в скриптах
            json_blocks = re.findall(r'<script[^>]*type="application/json"[^>]*>([^<]+)</script>', page_source)
            all_scripts = re.findall(r'<script[^>]*>([^<]{1000,})</script>', page_source)
            for script in all_scripts:
                if '"display_url"' in script or '"taken_at_timestamp"' in script:
                    json_blocks.append(script)

            for jb in json_blocks:
                if len(jb) < 100:
                    continue

                # Имя и био
                fn = re.search(r'"full_name"\\s*:\\s*"([^"]*)"', jb)
                if fn and fn.group(1) and not profile["full_name"]:
                    try:
                        profile["full_name"] = fn.group(1).encode().decode('unicode-escape', errors='ignore')
                    except:
                        profile["full_name"] = fn.group(1)

                bio = re.search(r'"biography"\\s*:\\s*"([^"]*)"', jb)
                if bio and bio.group(1) and not profile["biography"]:
                    try:
                        profile["biography"] = bio.group(1).encode().decode('unicode-escape', errors='ignore').replace('\\\\n', '\\n')
                    except:
                        profile["biography"] = bio.group(1)

                # Счётчики
                if profile["followers"] == 0:
                    for p in [r'"edge_followed_by"\\s*:\\s*\\{\\s*"count"\\s*:\\s*(\\d+)', r'"follower_count"\\s*:\\s*(\\d+)']:
                        m = re.search(p, jb)
                        if m:
                            profile["followers"] = int(m.group(1))
                            break

                if profile["following"] == 0:
                    for p in [r'"edge_follow"\\s*:\\s*\\{\\s*"count"\\s*:\\s*(\\d+)', r'"following_count"\\s*:\\s*(\\d+)']:
                        m = re.search(p, jb)
                        if m:
                            profile["following"] = int(m.group(1))
                            break

                if profile["posts_count"] == 0:
                    for p in [r'"edge_owner_to_timeline_media"\\s*:\\s*\\{\\s*"count"\\s*:\\s*(\\d+)', r'"media_count"\\s*:\\s*(\\d+)']:
                        m = re.search(p, jb)
                        if m:
                            profile["posts_count"] = int(m.group(1))
                            break

                if '"is_private":true' in jb:
                    profile["is_private"] = True
                if '"is_verified":true' in jb:
                    profile["is_verified"] = True

                # Аватар
                if not profile["profile_pic_url"]:
                    av = re.search(r'"profile_pic_url(?:_hd)?"\\s*:\\s*"([^"]+)"', jb)
                    if av:
                        profile["profile_pic_url"] = av.group(1).replace('\\\\u0026', '&').replace('\\\\/', '/')

                # ФОТО
                if not profile["photos"] and not profile["is_private"]:
                    urls = re.findall(r'"display_url"\\s*:\\s*"([^"]+)"', jb)
                    timestamps = re.findall(r'"taken_at_timestamp"\\s*:\\s*(\\d+)', jb)

                    if urls:
                        logger.info(f"Instagram Selenium: found {len(urls)} display_urls")
                        seen = set()
                        for i, u in enumerate(urls):
                            if len(profile["photos"]) >= 12:
                                break
                            clean = u.replace('\\\\u0026', '&').replace('\\\\/', '/')
                            if clean in seen or 's150x150' in clean or 's320x320' in clean or 's240x240' in clean:
                                continue
                            seen.add(clean)
                            ts = int(timestamps[i]) if i < len(timestamps) else None
                            profile["photos"].append({"url": clean, "timestamp": ts})

            # Fallback: img теги
            if not profile["photos"] and not profile["is_private"]:
                logger.info("Instagram Selenium: fallback to img parsing")
                imgs = re.findall(r'<img[^>]*src="(https://[^"]+)"[^>]*>', page_source)
                seen = set()
                for img in imgs:
                    if len(profile["photos"]) >= 12:
                        break
                    clean = img.replace('&amp;', '&')
                    if not is_valid_instagram_photo(clean):
                        continue
                    if clean in seen:
                        continue
                    seen.add(clean)
                    profile["photos"].append({"url": clean, "timestamp": None})

            logger.info(f"Instagram Selenium: {profile['full_name']}, {len(profile['photos'])} photos")
            driver.quit()
            return {"success": True, "profile": profile}

        except ImportError:
            if driver:
                driver.quit()
            return {"error": "Selenium не установлен"}
        except Exception as e:
            if driver:
                try:
                    driver.quit()
                except:
                    pass
            logger.error(f"Instagram Selenium error: {e}")
            return {"error": str(e)[:100]}

    def _parse_count(self, text: str) -> int:
        """Парсит 1.5K, 2.3M"""
        text = text.replace(',', '').replace(' ', '').strip()
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
        if not url:
            return None
        url = url.replace('\\\\u0026', '&').replace('\\\\/', '/').replace('&amp;', '&')
        try:
            acc = self._get_available_account()
            headers = {
                "User-Agent": acc["user_agent"] if acc else "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
                "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                "Referer": "https://www.instagram.com/",
            }
            connector = aiohttp.TCPConnector(ssl=False)
            timeout = aiohttp.ClientTimeout(total=30)
            async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
                cookies = acc["cookies"] if acc else {}
                async with session.get(url, headers=headers, cookies=cookies, allow_redirects=True) as resp:
                    if resp.status == 200:
                        data = await resp.read()
                        if len(data) > 1000:
                            return data
        except Exception as e:
            logger.error(f"Instagram download error: {e}")
        return None
'''

def patch_bot():
    """Применить патч к bot.py"""
    print("=" * 60)
    print("🔄 Патч: Гибридный Instagram (HTTP + Selenium)")
    print("=" * 60)

    # Читаем файл
    try:
        with open(BOT_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Файл {BOT_FILE} не найден")
        return False

    # Бэкап
    backup_name = f"{BOT_FILE}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy(BOT_FILE, backup_name)
    print(f"✅ Бэкап: {backup_name}")

    # Ищем старый класс InstagramAPI или InstagramFastAPI
    patterns = [
        (r'class InstagramFastAPI:.*?(?=\n# =====|\nclass [A-Z]|\n# ----)', 'InstagramFastAPI'),
        (r'class InstagramAPI:.*?(?=\n# =====|\nclass [A-Z]|\n# ----)', 'InstagramAPI'),
    ]

    found = False
    for pattern, name in patterns:
        match = re.search(pattern, content, re.DOTALL)
        if match:
            print(f"✅ Найден класс {name}")
            # Заменяем
            content = content[:match.start()] + NEW_INSTAGRAM_CLASS + content[match.end():]
            found = True
            break

    if not found:
        print("❌ Класс Instagram не найден")
        return False

    # Удаляем старый алиас если есть
    content = re.sub(r'\n# Алиас для совместимости\nInstagramAPI = InstagramFastAPI\n?', '\n', content)
    content = re.sub(r'\nInstagramAPI = InstagramFastAPI\n?', '\n', content)

    # Сохраняем
    with open(BOT_FILE, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ Класс InstagramAPI заменён на гибридную версию")
    print()
    print("📋 Что изменилось:")
    print("   1. Сначала пробует HTTP API (~2-3 сек)")
    print("   2. Если нет фото → Selenium fallback (~15-20 сек)")
    print("   3. Комбинирует результаты для лучшего покрытия")
    print()
    print("🚀 Запустите бота: python bot.py")

    return True


if __name__ == "__main__":
    patch_bot()
