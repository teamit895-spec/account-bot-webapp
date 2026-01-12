#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Оптимизации для Senior Bot
Запуск: python bot_optimizations.py bot.py
"""

import sys
import os
from datetime import datetime

# ==================== 1. GLOBAL HTTP SESSION ====================
GLOBAL_SESSION_CODE = '''
# ==================== GLOBAL HTTP SESSION ====================
_http_session: Optional[aiohttp.ClientSession] = None
_http_session_lock = asyncio.Lock()

async def get_http_session() -> aiohttp.ClientSession:
    """Получить глобальную HTTP сессию (connection pooling)"""
    global _http_session
    async with _http_session_lock:
        if _http_session is None or _http_session.closed:
            connector = aiohttp.TCPConnector(
                limit=100,  # макс соединений
                limit_per_host=10,  # макс на хост
                ttl_dns_cache=300,  # кэш DNS
                ssl=False
            )
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            _http_session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"}
            )
        return _http_session

async def close_http_session():
    """Закрыть глобальную сессию при выходе"""
    global _http_session
    if _http_session and not _http_session.closed:
        await _http_session.close()
        _http_session = None
'''

# ==================== 2. CACHING DECORATOR ====================
CACHE_CODE = '''
# ==================== SIMPLE CACHE ====================
from functools import wraps
import hashlib

_cache = {}
_cache_ttl = {}
CACHE_DEFAULT_TTL = 300  # 5 минут

def cached(ttl: int = CACHE_DEFAULT_TTL):
    """Декоратор для кэширования результатов"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Создаём ключ из аргументов
            key = f"{func.__name__}:{hashlib.md5(str(args).encode() + str(kwargs).encode()).hexdigest()}"
            now = datetime.now().timestamp()
            
            # Проверяем кэш
            if key in _cache and key in _cache_ttl:
                if now - _cache_ttl[key] < ttl:
                    logger.debug(f"Cache hit: {func.__name__}")
                    return _cache[key]
            
            # Выполняем функцию
            result = await func(*args, **kwargs)
            
            # Сохраняем в кэш
            _cache[key] = result
            _cache_ttl[key] = now
            
            # Очистка старых записей (каждые 100 вызовов)
            if len(_cache) > 1000:
                old_keys = [k for k, t in _cache_ttl.items() if now - t > ttl * 2]
                for k in old_keys:
                    _cache.pop(k, None)
                    _cache_ttl.pop(k, None)
            
            return result
        return wrapper
    return decorator
'''

# ==================== 3. OPTIMIZED WHATSAPP API ====================
WHATSAPP_OPTIMIZED = '''
class WhatsAppAPI:
    """Оптимизированный WhatsApp API с connection pooling"""
    
    def __init__(self, instance_id: str, api_token: str):
        self.instance_id = instance_id
        self.api_token = api_token
        self.base_url = f"https://api.green-api.com/waInstance{instance_id}"

    def normalize_phone(self, phone: str) -> str:
        phone = ''.join(c for c in phone if c.isdigit())
        if phone.startswith('8') and len(phone) == 11:
            phone = '7' + phone[1:]
        if len(phone) == 10:
            phone = '7' + phone
        return phone

    @cached(ttl=600)  # Кэш 10 минут
    async def check_whatsapp(self, phone: str) -> dict:
        phone = self.normalize_phone(phone)
        try:
            session = await get_http_session()
            url = f"{self.base_url}/checkWhatsapp/{self.api_token}"
            async with session.post(url, json={"phoneNumber": int(phone)}) as resp:
                return await resp.json()
        except Exception as e:
            return {"error": str(e)}

    @cached(ttl=300)
    async def get_avatar(self, phone: str) -> dict:
        phone = self.normalize_phone(phone)
        try:
            session = await get_http_session()
            url = f"{self.base_url}/getAvatar/{self.api_token}"
            async with session.post(url, json={"chatId": f"{phone}@c.us"}) as resp:
                return await resp.json()
        except Exception as e:
            return {"error": str(e)}

    @cached(ttl=300)
    async def get_contact_info(self, phone: str) -> dict:
        phone = self.normalize_phone(phone)
        try:
            session = await get_http_session()
            url = f"{self.base_url}/getContactInfo/{self.api_token}"
            async with session.post(url, json={"chatId": f"{phone}@c.us"}) as resp:
                return await resp.json()
        except Exception as e:
            return {"error": str(e)}

    async def get_avatars(self, phone: str) -> dict:
        phone = self.normalize_phone(phone)
        try:
            session = await get_http_session()
            url = f"{self.base_url}/getAvatars/{self.api_token}"
            async with session.post(url, json={"chatId": f"{phone}@c.us"}) as resp:
                data = await resp.json()
                logger.info(f"WhatsApp getAvatars: {len(str(data))} chars")
                return data
        except Exception as e:
            logger.error(f"WhatsApp getAvatars error: {e}")
            return {"error": str(e)}

    async def get_all_profile_photos(self, phone: str) -> list:
        """Получить ВСЕ фото профиля WhatsApp - ПАРАЛЛЕЛЬНО"""
        phone = self.normalize_phone(phone)
        
        # Параллельные запросы
        avatar_task = asyncio.create_task(self.get_avatar(phone))
        avatars_task = asyncio.create_task(self.get_avatars(phone))
        
        avatar_result, avatars_result = await asyncio.gather(
            avatar_task, avatars_task, return_exceptions=True
        )
        
        photos = []
        
        # Текущий аватар
        if isinstance(avatar_result, dict) and avatar_result.get("urlAvatar"):
            photos.append({"url": avatar_result["urlAvatar"], "type": "current", "index": 0})

        # История
        if isinstance(avatars_result, dict):
            avatar_urls = (
                avatars_result.get("avatars", []) or
                avatars_result.get("urlAvatars", []) or
                avatars_result.get("urls", [])
            )
        elif isinstance(avatars_result, list):
            avatar_urls = avatars_result
        else:
            avatar_urls = []

        seen_urls = {p["url"] for p in photos}
        for url in avatar_urls:
            photo_url = url if isinstance(url, str) else url.get("url") if isinstance(url, dict) else None
            if photo_url and photo_url.startswith("http") and photo_url not in seen_urls:
                seen_urls.add(photo_url)
                photos.append({"url": photo_url, "type": "history", "index": len(photos)})

        return photos

    async def download_avatar(self, url: str) -> Optional[bytes]:
        try:
            session = await get_http_session()
            async with session.get(url) as resp:
                if resp.status == 200:
                    return await resp.read()
        except:
            pass
        return None
'''

# ==================== 4. OPTIMIZED VK API ====================
VK_OPTIMIZED = '''
class VKAPI:
    """Оптимизированный VK API"""
    
    def __init__(self, access_token: str, api_version: str = "5.199"):
        self.access_token = access_token
        self.api_version = api_version
        self.base_url = "https://api.vk.com/method"

    def parse_vk_link(self, text: str) -> Optional[str]:
        text = text.strip()
        patterns = [r'vk\\.com/id(\\d+)', r'vk\\.com/([a-zA-Z0-9_.]+)', r'm\\.vk\\.com/id(\\d+)',
                    r'm\\.vk\\.com/([a-zA-Z0-9_.]+)', r'^id(\\d+)$', r'^(\\d+)$', r'^([a-zA-Z][a-zA-Z0-9_.]+)$']
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        return None

    @cached(ttl=300)
    async def get_user_info(self, user_id: str) -> dict:
        try:
            session = await get_http_session()
            url = f"{self.base_url}/users.get"
            params = {
                "user_ids": user_id,
                "fields": "photo_max_orig,status,city,country,bdate,online,last_seen,followers_count,verified,sex",
                "access_token": self.access_token,
                "v": self.api_version
            }
            async with session.get(url, params=params) as resp:
                data = await resp.json()
                if "error" in data:
                    return {"error": data["error"].get("error_msg", "Ошибка VK API")}
                if data.get("response") and len(data["response"]) > 0:
                    return {"success": True, "user": data["response"][0]}
                return {"error": "Пользователь не найден"}
        except Exception as e:
            return {"error": str(e)}

    async def get_photos(self, owner_id: int, album_id: str = "profile", count: int = 50) -> dict:
        try:
            session = await get_http_session()
            url = f"{self.base_url}/photos.get"
            params = {
                "owner_id": owner_id,
                "album_id": album_id,
                "count": count,
                "photo_sizes": 1,
                "rev": 1,
                "extended": 1,
                "access_token": self.access_token,
                "v": self.api_version
            }
            async with session.get(url, params=params) as resp:
                data = await resp.json()
                if "error" in data:
                    error_code = data["error"].get("error_code")
                    if error_code == 30:
                        return {"error": "Профиль закрыт", "private": True}
                    elif error_code == 200:
                        return {"error": "Нет доступа к альбому", "no_access": True}
                    return {"error": data["error"].get("error_msg", "Ошибка VK API")}
                return {"success": True, "photos": data.get("response", {}).get("items", [])}
        except Exception as e:
            return {"error": str(e)}

    async def get_all_photos(self, owner_id: int) -> dict:
        """Получить фото из всех альбомов ПАРАЛЛЕЛЬНО"""
        tasks = [
            self.get_photos(owner_id, "profile", 100),
            self.get_photos(owner_id, "wall", 100),
            self.get_photos(owner_id, "saved", 100),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_photos = []
        for result in results:
            if isinstance(result, dict) and result.get("success"):
                all_photos.extend(result.get("photos", []))
            elif isinstance(result, dict) and result.get("private"):
                return result
        
        # Убираем дубликаты
        seen_ids = set()
        unique_photos = []
        for photo in all_photos:
            if photo["id"] not in seen_ids:
                seen_ids.add(photo["id"])
                unique_photos.append(photo)
        
        return {"success": True, "photos": unique_photos}

    def get_best_photo_url(self, photo: dict) -> str:
        sizes = photo.get("sizes", [])
        if not sizes:
            return photo.get("photo_max_orig", "")
        size_priority = ['w', 'z', 'y', 'x', 'r', 'q', 'p', 'o', 'm', 's']
        size_dict = {s["type"]: s["url"] for s in sizes}
        for size_type in size_priority:
            if size_type in size_dict:
                return size_dict[size_type]
        return sizes[-1].get("url", "")

    async def download_photo(self, url: str) -> Optional[bytes]:
        try:
            session = await get_http_session()
            async with session.get(url) as resp:
                if resp.status == 200:
                    return await resp.read()
        except:
            pass
        return None
'''

# ==================== 5. SELENIUM SINGLETON ====================
SELENIUM_SINGLETON = '''
# ==================== SELENIUM SINGLETON ====================
class SeleniumManager:
    """Менеджер Selenium - один драйвер для всех запросов"""
    _instance = None
    _lock = asyncio.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._driver = None
            cls._instance._last_used = None
            cls._instance._idle_timeout = 300  # 5 минут
        return cls._instance
    
    async def get_driver(self, user_agent: str = None):
        """Получить драйвер (создать если нужно)"""
        async with self._lock:
            if self._driver is None:
                self._driver = self._create_driver(user_agent)
            self._last_used = datetime.now()
            return self._driver
    
    def _create_driver(self, user_agent: str = None):
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        
        chrome_options = Options()
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--page-load-strategy=eager")
        
        if user_agent:
            chrome_options.add_argument(f"user-agent={user_agent}")
        
        try:
            from webdriver_manager.chrome import ChromeDriverManager
            from selenium.webdriver.chrome.service import Service
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
        except:
            driver = webdriver.Chrome(options=chrome_options)
        
        driver.set_page_load_timeout(30)
        return driver
    
    async def close(self):
        """Закрыть драйвер"""
        async with self._lock:
            if self._driver:
                try:
                    self._driver.quit()
                except:
                    pass
                self._driver = None
    
    async def cleanup_idle(self):
        """Закрыть драйвер если давно не использовался"""
        if self._driver and self._last_used:
            if (datetime.now() - self._last_used).total_seconds() > self._idle_timeout:
                await self.close()

selenium_manager = SeleniumManager()
'''

# ==================== 6. PARALLEL PHOTO DOWNLOAD ====================
PARALLEL_DOWNLOAD = '''
async def download_photos_parallel(urls: list, downloader, max_concurrent: int = 5) -> list:
    """Параллельная загрузка фото с ограничением"""
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def download_one(url, idx):
        async with semaphore:
            try:
                data = await asyncio.wait_for(downloader(url), timeout=10)
                return {"data": data, "index": idx, "url": url}
            except:
                return None
    
    tasks = [download_one(url, i) for i, url in enumerate(urls)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    return [r for r in results if r and not isinstance(r, Exception)]
'''

# ==================== 7. RATE LIMITER ====================
RATE_LIMITER = '''
# ==================== RATE LIMITER ====================
class RateLimiter:
    """Ограничитель частоты запросов"""
    def __init__(self, max_requests: int = 10, period: float = 1.0):
        self.max_requests = max_requests
        self.period = period
        self.requests = []
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        async with self._lock:
            now = datetime.now().timestamp()
            # Удаляем старые запросы
            self.requests = [t for t in self.requests if now - t < self.period]
            
            if len(self.requests) >= self.max_requests:
                # Ждём
                sleep_time = self.period - (now - self.requests[0])
                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)
                self.requests = self.requests[1:]
            
            self.requests.append(now)

# Глобальные лимитеры
vk_limiter = RateLimiter(max_requests=3, period=1.0)  # VK: 3 req/sec
telegram_limiter = RateLimiter(max_requests=1, period=0.5)  # TG: 2 req/sec
instagram_limiter = RateLimiter(max_requests=1, period=2.0)  # Insta: 1 req/2sec
'''

# ==================== 8. IMPROVED ERROR HANDLING ====================
ERROR_HANDLING = '''
# ==================== ERROR HANDLING ====================
class BotError(Exception):
    """Базовое исключение бота"""
    def __init__(self, message: str, user_message: str = None):
        self.message = message
        self.user_message = user_message or message
        super().__init__(message)

class APIError(BotError):
    """Ошибка внешнего API"""
    pass

class RateLimitError(BotError):
    """Превышен лимит запросов"""
    pass

class NotFoundError(BotError):
    """Не найдено"""
    pass

def handle_errors(func):
    """Декоратор для обработки ошибок в хендлерах"""
    @wraps(func)
    async def wrapper(message_or_callback, *args, **kwargs):
        try:
            return await func(message_or_callback, *args, **kwargs)
        except BotError as e:
            logger.warning(f"BotError in {func.__name__}: {e.message}")
            if hasattr(message_or_callback, 'answer'):
                await message_or_callback.answer(f"⚠️ {e.user_message}", parse_mode="HTML")
        except asyncio.TimeoutError:
            logger.error(f"Timeout in {func.__name__}")
            if hasattr(message_or_callback, 'answer'):
                await message_or_callback.answer("⏰ <b>Таймаут</b>\\n\\nПопробуйте позже", parse_mode="HTML")
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {e}")
            if hasattr(message_or_callback, 'answer'):
                await message_or_callback.answer("❌ <b>Ошибка</b>\\n\\nПопробуйте позже", parse_mode="HTML")
    return wrapper
'''

# ==================== 9. CLEANUP ON EXIT ====================
CLEANUP_CODE = '''
# ==================== CLEANUP ====================
async def cleanup():
    """Очистка ресурсов при выходе"""
    logger.info("Cleaning up resources...")
    
    # Закрываем HTTP сессию
    await close_http_session()
    
    # Закрываем GetContact браузер
    if _gc_browser:
        await _gc_browser.stop()
    
    # Закрываем Selenium
    await selenium_manager.close()
    
    logger.info("Cleanup complete")

# Регистрируем cleanup
import atexit
import signal

def sync_cleanup():
    loop = asyncio.new_event_loop()
    loop.run_until_complete(cleanup())
    loop.close()

atexit.register(sync_cleanup)
'''

# ==================== 10. FIXED VK HANDLER ====================
VK_HANDLER_FIX = '''
@router.message(AdminStates.waiting_vk_link)
async def process_vk_link(m: Message, state: FSMContext):
    await state.clear()
    text = m.text.strip()
    user_id = vk_api.parse_vk_link(text)
    if not user_id:
        await m.answer("❌ <b>Неверный формат ссылки</b>", parse_mode="HTML")
        return
    
    loading_msg = await m.answer("⏳ <b>Загружаю информацию...</b>", parse_mode="HTML")
    user_result = await vk_api.get_user_info(user_id)
    
    if user_result.get("error"):
        await loading_msg.edit_text(f"❌ <b>Ошибка</b>\\n\\n<code>{user_result.get('error')}</code>", parse_mode="HTML")
        return
    
    user = user_result.get("user", {})
    vk_user_id = user.get("id")
    first_name = user.get("first_name", "")
    last_name = user.get("last_name", "")
    full_name = f"{first_name} {last_name}".strip()
    
    # Формируем текст профиля
    txt = f"🔷 <b>Профиль VKontakte</b>\\n━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n"
    txt += f"👤 <b>{full_name}</b>\\n"
    txt += f"🔗 <a href='https://vk.com/id{vk_user_id}'>vk.com/id{vk_user_id}</a>\\n\\n"
    
    sex_map = {1: "Женский", 2: "Мужской"}
    if user.get("sex"):
        txt += f"⚧ Пол: <b>{sex_map.get(user['sex'], 'Не указан')}</b>\\n"
    if user.get("bdate"):
        txt += f"🎂 Дата рождения: <b>{user['bdate']}</b>\\n"
    if user.get("city"):
        txt += f"🏙 Город: <b>{user['city'].get('title', '')}</b>\\n"
    if user.get("country"):
        txt += f"🌍 Страна: <b>{user['country'].get('title', '')}</b>\\n"
    if user.get("status"):
        txt += f"💬 Статус: <i>{user['status']}</i>\\n"
    if user.get("followers_count"):
        txt += f"👥 Подписчики: <b>{user['followers_count']}</b>\\n"
    
    online_status = "🟢 Онлайн" if user.get("online") else "⚫ Оффлайн"
    txt += f"\\n{online_status}\\n"
    if user.get("verified"):
        txt += "✅ Верифицирован\\n"
    if user.get("is_closed"):
        txt += "🔒 Профиль закрыт\\n"
    
    # Отправляем аватар
    avatar_url = user.get("photo_max_orig")
    if avatar_url and "camera" not in avatar_url:
        try:
            photo_data = await vk_api.download_photo(avatar_url)
            if photo_data:
                await loading_msg.delete()
                photo_file = BufferedInputFile(photo_data, filename="avatar.jpg")
                await m.answer_photo(photo=photo_file, caption=txt, parse_mode="HTML")
            else:
                await loading_msg.edit_text(txt, parse_mode="HTML", disable_web_page_preview=True)
        except:
            await loading_msg.edit_text(txt, parse_mode="HTML", disable_web_page_preview=True)
    else:
        await loading_msg.edit_text(txt + "\\n🖼 Аватар: <i>не установлен</i>", parse_mode="HTML", disable_web_page_preview=True)
    
    # Показываем выбор количества фото (УБРАН МЁРТВЫЙ КОД)
    if not user.get("is_closed"):
        await m.answer(
            f"📷 <b>Сколько фото загрузить?</b>\\n\\n👤 Профиль: <b>{full_name}</b>",
            parse_mode="HTML",
            reply_markup=vk_photo_count_kb(str(vk_user_id))
        )
    else:
        await m.answer("🔒 <b>Профиль закрыт</b>\\n\\nФотографии недоступны", parse_mode="HTML")
'''


def print_summary():
    print("""
╔════════════════════════════════════════════════════════════════╗
║           🔧 ОПТИМИЗАЦИИ ДЛЯ SENIOR BOT                       ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. 🌐 GLOBAL HTTP SESSION                                     ║
║     - Connection pooling (100 соединений)                      ║
║     - DNS кэш (300 сек)                                        ║
║     - Единый timeout                                           ║
║                                                                ║
║  2. 💾 CACHING                                                 ║
║     - Кэш результатов пробива (5-10 мин)                       ║
║     - Автоочистка старых записей                               ║
║                                                                ║
║  3. ⚡ PARALLEL REQUESTS                                       ║
║     - WhatsApp: avatar + avatars параллельно                   ║
║     - VK: все альбомы параллельно                              ║
║     - Instagram: batch download (5 потоков)                    ║
║                                                                ║
║  4. 🚦 RATE LIMITING                                           ║
║     - VK: 3 req/sec                                            ║
║     - Telegram: 2 req/sec                                      ║
║     - Instagram: 1 req/2sec                                    ║
║                                                                ║
║  5. 🧹 CLEANUP                                                 ║
║     - Автозакрытие HTTP сессий                                 ║
║     - Закрытие Selenium при простое                            ║
║     - Cleanup при выходе                                       ║
║                                                                ║
║  6. 🐛 ИСПРАВЛЕННЫЕ БАГИ                                       ║
║     - VK: убран мёртвый код после return                       ║
║     - WhatsApp: закрытие сессий                                ║
║     - Selenium: правильное закрытие драйвера                   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

📝 Чтобы применить оптимизации:

1. Добавь в начало bot.py после импортов:
   - GLOBAL_SESSION_CODE
   - CACHE_CODE
   - RATE_LIMITER
   - ERROR_HANDLING

2. Замени классы:
   - WhatsAppAPI → WHATSAPP_OPTIMIZED
   - VKAPI → VK_OPTIMIZED

3. Замени хендлер:
   - process_vk_link → VK_HANDLER_FIX

4. Добавь в конец main():
   - await cleanup()

""")


def main():
    print_summary()
    
    # Сохраняем код оптимизаций в файлы
    optimizations = {
        "01_global_session.py": GLOBAL_SESSION_CODE,
        "02_cache.py": CACHE_CODE,
        "03_whatsapp_optimized.py": WHATSAPP_OPTIMIZED,
        "04_vk_optimized.py": VK_OPTIMIZED,
        "05_selenium_singleton.py": SELENIUM_SINGLETON,
        "06_parallel_download.py": PARALLEL_DOWNLOAD,
        "07_rate_limiter.py": RATE_LIMITER,
        "08_error_handling.py": ERROR_HANDLING,
        "09_cleanup.py": CLEANUP_CODE,
        "10_vk_handler_fix.py": VK_HANDLER_FIX,
    }
    
    os.makedirs("optimizations", exist_ok=True)
    
    for filename, code in optimizations.items():
        filepath = f"optimizations/{filename}"
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code.strip())
        print(f"✅ Сохранено: {filepath}")
    
    print("\n📁 Все оптимизации сохранены в папку 'optimizations/'")


if __name__ == "__main__":
    main()
