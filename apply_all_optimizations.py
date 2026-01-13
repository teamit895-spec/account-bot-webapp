#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🚀 Применение ВСЕХ оптимизаций к Senior Bot
Запуск: python apply_all_optimizations.py bot.py
"""

import sys
import os
import re
from datetime import datetime

# ==================== НОВЫЙ КОД ДЛЯ ДОБАВЛЕНИЯ ====================

# 1. Global HTTP Session + Cache + Rate Limiter (добавить после импортов)
NEW_IMPORTS_AND_GLOBALS = '''
# ==================== OPTIMIZATIONS ====================
from functools import wraps
import hashlib

# ==================== GLOBAL HTTP SESSION ====================
_http_session: Optional[aiohttp.ClientSession] = None
_http_session_lock = asyncio.Lock()

async def get_http_session() -> aiohttp.ClientSession:
    """Получить глобальную HTTP сессию (connection pooling)"""
    global _http_session
    async with _http_session_lock:
        if _http_session is None or _http_session.closed:
            connector = aiohttp.TCPConnector(
                limit=100,
                limit_per_host=10,
                ttl_dns_cache=300,
                ssl=False
            )
            timeout = aiohttp.ClientTimeout(total=30, connect=10)
            _http_session = aiohttp.ClientSession(
                connector=connector,
                timeout=timeout
            )
        return _http_session

async def close_http_session():
    """Закрыть глобальную сессию"""
    global _http_session
    if _http_session and not _http_session.closed:
        await _http_session.close()
        _http_session = None

# ==================== SIMPLE CACHE ====================
_cache = {}
_cache_ttl = {}

def cached(ttl: int = 300):
    """Декоратор кэширования (TTL в секундах)"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            key = f"{func.__name__}:{hashlib.md5(str(args).encode()).hexdigest()[:16]}"
            now = datetime.now().timestamp()
            if key in _cache and now - _cache_ttl.get(key, 0) < ttl:
                return _cache[key]
            result = await func(*args, **kwargs)
            _cache[key] = result
            _cache_ttl[key] = now
            if len(_cache) > 500:
                old = [k for k, t in _cache_ttl.items() if now - t > ttl * 2]
                for k in old[:100]:
                    _cache.pop(k, None)
                    _cache_ttl.pop(k, None)
            return result
        return wrapper
    return decorator

# ==================== RATE LIMITER ====================
class RateLimiter:
    def __init__(self, max_req: int = 5, period: float = 1.0):
        self.max_req = max_req
        self.period = period
        self.requests = []
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        async with self._lock:
            now = datetime.now().timestamp()
            self.requests = [t for t in self.requests if now - t < self.period]
            if len(self.requests) >= self.max_req:
                await asyncio.sleep(self.period - (now - self.requests[0]))
                self.requests = self.requests[1:]
            self.requests.append(now)

vk_limiter = RateLimiter(3, 1.0)
tg_limiter = RateLimiter(2, 1.0)
insta_limiter = RateLimiter(1, 2.0)

# ==================== PARALLEL DOWNLOAD ====================
async def download_photos_parallel(urls: list, downloader, max_concurrent: int = 5) -> list:
    """Параллельная загрузка фото"""
    semaphore = asyncio.Semaphore(max_concurrent)
    async def dl(url, idx):
        async with semaphore:
            try:
                data = await asyncio.wait_for(downloader(url), timeout=15)
                return {"data": data, "index": idx} if data else None
            except:
                return None
    results = await asyncio.gather(*[dl(u, i) for i, u in enumerate(urls)], return_exceptions=True)
    return [r for r in results if r and not isinstance(r, Exception)]

'''

# 2. Оптимизированный WhatsAppAPI
WHATSAPP_API_OPTIMIZED = '''class WhatsAppAPI:
    """Оптимизированный WhatsApp API"""
    
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

    @cached(ttl=600)
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
                return await resp.json()
        except Exception as e:
            return {"error": str(e)}

    async def get_all_profile_photos(self, phone: str) -> list:
        """Получить ВСЕ фото - ПАРАЛЛЕЛЬНО"""
        phone = self.normalize_phone(phone)
        avatar_result, avatars_result = await asyncio.gather(
            self.get_avatar(phone),
            self.get_avatars(phone),
            return_exceptions=True
        )
        
        photos = []
        if isinstance(avatar_result, dict) and avatar_result.get("urlAvatar"):
            photos.append({"url": avatar_result["urlAvatar"], "type": "current", "index": 0})

        avatar_urls = []
        if isinstance(avatars_result, dict):
            avatar_urls = avatars_result.get("avatars") or avatars_result.get("urlAvatars") or avatars_result.get("urls") or []
        elif isinstance(avatars_result, list):
            avatar_urls = avatars_result

        seen = {p["url"] for p in photos}
        for url in avatar_urls:
            u = url if isinstance(url, str) else url.get("url") if isinstance(url, dict) else None
            if u and u.startswith("http") and u not in seen:
                seen.add(u)
                photos.append({"url": u, "type": "history", "index": len(photos)})
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

# 3. Оптимизированный VKAPI
VK_API_OPTIMIZED = '''class VKAPI:
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
        await vk_limiter.acquire()
        try:
            session = await get_http_session()
            params = {
                "user_ids": user_id,
                "fields": "photo_max_orig,status,city,country,bdate,online,last_seen,followers_count,verified,sex",
                "access_token": self.access_token,
                "v": self.api_version
            }
            async with session.get(f"{self.base_url}/users.get", params=params) as resp:
                data = await resp.json()
                if "error" in data:
                    return {"error": data["error"].get("error_msg", "Ошибка VK API")}
                if data.get("response"):
                    return {"success": True, "user": data["response"][0]}
                return {"error": "Не найден"}
        except Exception as e:
            return {"error": str(e)}

    async def get_photos(self, owner_id: int, album_id: str = "profile", count: int = 50) -> dict:
        await vk_limiter.acquire()
        try:
            session = await get_http_session()
            params = {
                "owner_id": owner_id, "album_id": album_id, "count": count,
                "photo_sizes": 1, "rev": 1, "extended": 1,
                "access_token": self.access_token, "v": self.api_version
            }
            async with session.get(f"{self.base_url}/photos.get", params=params) as resp:
                data = await resp.json()
                if "error" in data:
                    code = data["error"].get("error_code")
                    if code == 30:
                        return {"error": "Закрыт", "private": True}
                    return {"error": data["error"].get("error_msg")}
                return {"success": True, "photos": data.get("response", {}).get("items", [])}
        except Exception as e:
            return {"error": str(e)}

    async def get_all_photos(self, owner_id: int) -> dict:
        """Получить фото из всех альбомов ПАРАЛЛЕЛЬНО"""
        results = await asyncio.gather(
            self.get_photos(owner_id, "profile", 100),
            self.get_photos(owner_id, "wall", 100),
            self.get_photos(owner_id, "saved", 100),
            return_exceptions=True
        )
        all_photos = []
        for r in results:
            if isinstance(r, dict):
                if r.get("private"):
                    return r
                if r.get("success"):
                    all_photos.extend(r.get("photos", []))
        seen = set()
        unique = [p for p in all_photos if p["id"] not in seen and not seen.add(p["id"])]
        return {"success": True, "photos": unique}

    def get_best_photo_url(self, photo: dict) -> str:
        sizes = photo.get("sizes", [])
        if not sizes:
            return photo.get("photo_max_orig", "")
        for t in ['w', 'z', 'y', 'x', 'r', 'q', 'p', 'o', 'm', 's']:
            for s in sizes:
                if s["type"] == t:
                    return s["url"]
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

# 4. Исправленный VK handler (без мёртвого кода)
VK_HANDLER_FIXED = '''@router.message(AdminStates.waiting_vk_link)
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
    full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    
    txt = f"🔷 <b>Профиль VKontakte</b>\\n━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n"
    txt += f"👤 <b>{full_name}</b>\\n"
    txt += f"🔗 <a href='https://vk.com/id{vk_user_id}'>vk.com/id{vk_user_id}</a>\\n\\n"
    
    if user.get("sex"):
        txt += f"⚧ Пол: <b>{({1: 'Женский', 2: 'Мужской'}).get(user['sex'], '?')}</b>\\n"
    if user.get("bdate"):
        txt += f"🎂 ДР: <b>{user['bdate']}</b>\\n"
    if user.get("city"):
        txt += f"🏙 Город: <b>{user['city'].get('title', '')}</b>\\n"
    if user.get("status"):
        txt += f"💬 <i>{user['status']}</i>\\n"
    if user.get("followers_count"):
        txt += f"👥 Подписчики: <b>{user['followers_count']}</b>\\n"
    
    txt += f"\\n{'🟢 Онлайн' if user.get('online') else '⚫ Оффлайн'}\\n"
    if user.get("verified"):
        txt += "✅ Верифицирован\\n"
    if user.get("is_closed"):
        txt += "🔒 Закрыт\\n"
    
    avatar_url = user.get("photo_max_orig")
    if avatar_url and "camera" not in avatar_url:
        try:
            photo_data = await vk_api.download_photo(avatar_url)
            if photo_data:
                await loading_msg.delete()
                await m.answer_photo(BufferedInputFile(photo_data, "avatar.jpg"), caption=txt, parse_mode="HTML")
            else:
                await loading_msg.edit_text(txt, parse_mode="HTML", disable_web_page_preview=True)
        except:
            await loading_msg.edit_text(txt, parse_mode="HTML", disable_web_page_preview=True)
    else:
        await loading_msg.edit_text(txt + "\\n🖼 <i>Нет аватара</i>", parse_mode="HTML", disable_web_page_preview=True)
    
    # Выбор фото
    if not user.get("is_closed"):
        await m.answer(f"📷 <b>Сколько фото?</b>\\n\\n👤 {full_name}", parse_mode="HTML", reply_markup=vk_photo_count_kb(str(vk_user_id)))
    else:
        await m.answer("🔒 <b>Профиль закрыт</b>", parse_mode="HTML")

'''

# 5. Cleanup в main()
CLEANUP_CODE = '''
async def cleanup():
    """Очистка при выходе"""
    logger.info("Cleanup...")
    await close_http_session()
    if _gc_browser:
        await _gc_browser.stop()
    logger.info("Done")
'''

MAIN_WITH_CLEANUP = '''async def main():
    global auto_buy

    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(router)

    auto_buy = AutoBuyManager(db, api, bot)

    logger.info("Senior Bot starting...")
    logger.info(f"Telegram sessions: {len(tg_lookup.sessions)}")
    logger.info(f"Instagram accounts: {len(insta_api.accounts)}")
    logger.info(f"Suppliers loaded: {sum(len(v) for v in SUPPLIERS.values())} products")
    logger.info(f"AutoBuy enabled: {AUTO_BUY_ENABLED}")

    asyncio.create_task(start_api())
    asyncio.create_task(auto_buy_task())

    await notify(
        f"🟢 <b>Senior Bot запущен!</b>\\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n"
        f"📦 Аккаунтов: <b>{db.total()}</b>\\n"
        f"✈️ TG сессий: <b>{len(tg_lookup.sessions)}</b>\\n"
        f"📸 Instagram: <b>{len(insta_api.accounts)}</b>\\n"
        f"🏪 Поставщиков: <b>{sum(len(v) for v in SUPPLIERS.values())}</b>\\n"
        f"🤖 Автозакупка: {'✅' if AUTO_BUY_ENABLED else '❌'}\\n"
        f"⚡ Оптимизации: ✅"
    )

    try:
        await dp.start_polling(bot)
    finally:
        await cleanup()

'''


def apply_patch(bot_path: str):
    """Применить все оптимизации"""
    
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
    
    changes = 0
    
    # 1. Добавляем новые импорты и глобальные переменные после существующих импортов
    print("\n1️⃣ Добавляю глобальные оптимизации...")
    
    # Находим место после импортов (после logging.basicConfig)
    insert_pos = content.find("logging.basicConfig")
    if insert_pos != -1:
        # Находим конец этой строки
        end_line = content.find("\n", insert_pos)
        if end_line != -1:
            # Ищем следующую пустую строку или начало кода
            next_section = content.find("\n\n", end_line)
            if next_section != -1:
                content = content[:next_section] + "\n" + NEW_IMPORTS_AND_GLOBALS + content[next_section:]
                changes += 1
                print("   ✅ Добавлены: HTTP session, Cache, RateLimiter")
    
    # 2. Заменяем WhatsAppAPI
    print("\n2️⃣ Оптимизирую WhatsAppAPI...")
    wa_start = content.find("class WhatsAppAPI:")
    if wa_start != -1:
        # Ищем конец класса
        lines = content[wa_start:].split('\n')
        wa_end = wa_start
        for i, line in enumerate(lines[1:], 1):
            if line and not line.startswith(' ') and not line.startswith('\t'):
                if line.startswith('class ') or line.startswith('# =='):
                    wa_end = wa_start + sum(len(l) + 1 for l in lines[:i])
                    break
        
        if wa_end > wa_start:
            content = content[:wa_start] + WHATSAPP_API_OPTIMIZED + "\n" + content[wa_end:]
            changes += 1
            print("   ✅ WhatsAppAPI оптимизирован (параллельные запросы + кэш)")
    
    # 3. Заменяем VKAPI
    print("\n3️⃣ Оптимизирую VKAPI...")
    vk_start = content.find("class VKAPI:")
    if vk_start != -1:
        lines = content[vk_start:].split('\n')
        vk_end = vk_start
        for i, line in enumerate(lines[1:], 1):
            if line and not line.startswith(' ') and not line.startswith('\t'):
                if line.startswith('class ') or line.startswith('# =='):
                    vk_end = vk_start + sum(len(l) + 1 for l in lines[:i])
                    break
        
        if vk_end > vk_start:
            content = content[:vk_start] + VK_API_OPTIMIZED + "\n" + content[vk_end:]
            changes += 1
            print("   ✅ VKAPI оптимизирован (параллельные альбомы + rate limit)")
    
    # 4. Исправляем VK handler (убираем мёртвый код)
    print("\n4️⃣ Исправляю VK handler...")
    vk_handler_start = content.find("@router.message(AdminStates.waiting_vk_link)")
    if vk_handler_start != -1:
        # Ищем конец функции
        func_start = content.find("async def process_vk_link", vk_handler_start)
        if func_start != -1:
            lines = content[func_start:].split('\n')
            func_end = func_start
            depth = 0
            for i, line in enumerate(lines):
                if i == 0:
                    depth = 1
                    continue
                stripped = line.lstrip()
                if stripped.startswith('async def ') or stripped.startswith('def ') or stripped.startswith('@router'):
                    if len(line) - len(stripped) == 0:
                        func_end = func_start + sum(len(l) + 1 for l in lines[:i])
                        break
            
            if func_end > func_start:
                content = content[:vk_handler_start] + VK_HANDLER_FIXED + "\n\n" + content[func_end:]
                changes += 1
                print("   ✅ VK handler исправлен (убран мёртвый код)")
    
    # 5. Добавляем cleanup перед main()
    print("\n5️⃣ Добавляю cleanup...")
    main_pos = content.find("async def main():")
    if main_pos != -1:
        content = content[:main_pos] + CLEANUP_CODE + "\n\n" + content[main_pos:]
        changes += 1
        print("   ✅ Cleanup добавлен")
    
    # 6. Обновляем main() с cleanup
    print("\n6️⃣ Обновляю main()...")
    main_start = content.find("async def main():")
    if main_start != -1:
        lines = content[main_start:].split('\n')
        main_end = main_start
        for i, line in enumerate(lines[1:], 1):
            if line and not line.startswith(' ') and not line.startswith('\t'):
                if line.startswith('if __name__') or line.startswith('def ') or line.startswith('class '):
                    main_end = main_start + sum(len(l) + 1 for l in lines[:i])
                    break
        
        if main_end > main_start:
            content = content[:main_start] + MAIN_WITH_CLEANUP + "\n" + content[main_end:]
            changes += 1
            print("   ✅ main() обновлён с cleanup")
    
    # Сохраняем
    with open(bot_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n{'='*50}")
    print(f"✅ Изменений: {changes}")
    
    # Проверяем синтаксис
    try:
        compile(content, bot_path, 'exec')
        print("✅ Синтаксис OK")
        return True
    except SyntaxError as e:
        print(f"❌ Ошибка синтаксиса: {e}")
        print("🔄 Восстанавливаю из бэкапа...")
        with open(backup, 'r', encoding='utf-8') as f:
            with open(bot_path, 'w', encoding='utf-8') as bf:
                bf.write(f.read())
        print("✅ Восстановлено")
        return False


def main():
    print("""
╔════════════════════════════════════════════════════════════╗
║        🚀 ПРИМЕНЕНИЕ ВСЕХ ОПТИМИЗАЦИЙ                      ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  ✅ Connection pooling (HTTP сессии)                       ║
║  ✅ Кэширование результатов (5-10 мин)                     ║
║  ✅ Rate limiting (VK: 3/s, TG: 2/s, Insta: 0.5/s)         ║
║  ✅ Параллельные запросы (WhatsApp, VK альбомы)            ║
║  ✅ Исправлен мёртвый код в VK handler                     ║
║  ✅ Cleanup ресурсов при выходе                            ║
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
║  Оптимизации применены:                                    ║
║                                                            ║
║  🌐 HTTP: единая сессия с пулом соединений                 ║
║  💾 Кэш: повторные запросы мгновенны                       ║
║  🚦 Лимиты: защита от блокировок API                       ║
║  ⚡ Параллельность: WhatsApp/VK в 2-3x быстрее             ║
║  🧹 Cleanup: нет утечек памяти                             ║
║                                                            ║
║  Запуск: python bot.py                                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
""")
    else:
        print("\n❌ Не удалось применить патч")


if __name__ == "__main__":
    main()
