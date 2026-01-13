#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Автопатч - ВСЕ исправления
1. Kaspersky - через User-Agent (без Playwright)
2. GetContact - SPAM + оператор (Tele2)
3. VK - выбор фото 10/20/30/50
4. WhatsApp - ВСЕ фото профиля
"""

import sys
import os
import re
from datetime import datetime

# ==================== НОВЫЙ КОД ====================

# 1. KASPERSKY - через User-Agent (без Playwright)
NEW_KASPERSKY_CLASS = '''
# ==================== KASPERSKY WHO CALLS API ====================
class KasperskyWhoCalls:
    """API для проверки номеров через Kaspersky Who Calls (без Playwright)"""

    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ]
        self.current_ua_index = 0

    def _get_user_agent(self) -> str:
        ua = self.user_agents[self.current_ua_index]
        self.current_ua_index = (self.current_ua_index + 1) % len(self.user_agents)
        return ua

    def normalize_phone(self, phone: str) -> str:
        phone = ''.join(c for c in phone if c.isdigit())
        if phone.startswith('8') and len(phone) == 11:
            phone = '7' + phone[1:]
        if len(phone) == 10:
            phone = '7' + phone
        return phone

    async def check_phone(self, phone: str) -> dict:
        """Проверить номер через HTTP запрос"""
        phone = self.normalize_phone(phone)

        result = {
            "success": False,
            "phone": phone,
            "name": None,
            "category": None,
            "is_spam": False,
            "spam_count": 0,
            "region": None,
            "operator": None,
        }

        headers = {
            "User-Agent": self._get_user_agent(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
        }

        try:
            connector = aiohttp.TCPConnector(ssl=False)
            timeout = aiohttp.ClientTimeout(total=15)

            async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
                page_url = f"https://whocalls.kaspersky.ru/search?request=%2B7{phone[1:]}"

                async with session.get(page_url, headers=headers) as resp:
                    if resp.status == 200:
                        html = await resp.text()
                        result["success"] = True

                        # Парсим название
                        name_match = re.search(r'class="[^"]*phone-name[^"]*"[^>]*>([^<]+)<', html)
                        if name_match:
                            result["name"] = name_match.group(1).strip()

                        # Категория
                        cat_match = re.search(r'class="[^"]*category[^"]*"[^>]*>([^<]+)<', html)
                        if cat_match:
                            result["category"] = cat_match.group(1).strip()
                            if "спам" in result["category"].lower() or "мошен" in result["category"].lower():
                                result["is_spam"] = True

                        # Жалобы
                        complaints_match = re.search(r'(\\d+)\\s*(?:жалоб|отзыв)', html, re.IGNORECASE)
                        if complaints_match:
                            result["spam_count"] = int(complaints_match.group(1))
                            if result["spam_count"] > 0:
                                result["is_spam"] = True

                        # Регион
                        region_match = re.search(r'"region"\\s*:\\s*"([^"]+)"', html)
                        if region_match:
                            result["region"] = region_match.group(1)

                        # Оператор
                        operator_match = re.search(r'"operator"\\s*:\\s*"([^"]+)"', html)
                        if operator_match:
                            result["operator"] = operator_match.group(1)

                        return result

                result["success"] = True
                return result

        except asyncio.TimeoutError:
            result["error"] = "Таймаут запроса"
        except Exception as e:
            result["error"] = str(e)[:100]

        return result
'''

# 2. GETCONTACT - улучшенный парсинг (_parse_results)
NEW_GETCONTACT_PARSE = '''
    async def _parse_results(self, phone: str) -> GCSearchResult:
        if not self._page:
            return GCSearchResult(phone=phone, error="Страница недоступна")
        result = GCSearchResult(phone=phone)
        FILTER_WORDS = {'we use cookies', 'accept all', 'getcontact', 'search', 'поиск', 'назад', 'позвонить',
                        'блокировать', 'россия (+7)', 'главная', 'premium', 'войти', 'sign in', 'log in',
                        'subscribe', 'подписка', 'тариф', 'оплата', 'download', 'скачать', 'app store', 'google play'}
        try:
            await asyncio.sleep(2)  # Увеличено время ожидания

            # Сначала пробуем получить данные из JSON в HTML
            html = await self._page.content()

            # Метод 1: Ищем displayName в JSON
            name_patterns = [
                r'"displayName"\\s*:\\s*"([^"]+)"',
                r'"name"\\s*:\\s*"([^"]+)"',
                r'"fullName"\\s*:\\s*"([^"]+)"',
                r'displayName["\\\':]\\s*["\\'\\"]([^"\\'\\"]+)["\\'\\"]',
            ]

            for pattern in name_patterns:
                match = re.search(pattern, html)
                if match:
                    name = match.group(1)
                    # Декодируем unicode если нужно
                    try:
                        name = name.encode().decode('unicode-escape')
                    except:
                        pass
                    if name and name not in ('null', 'undefined', '', 'Unknown') and len(name) > 1:
                        # Фильтруем системные строки
                        name_lower = name.lower()
                        if not any(fw in name_lower for fw in FILTER_WORDS):
                            result.display_name = name
                            logger.info(f"GetContact: found name via JSON: {name}")
                            break

            # Метод 2: Ищем теги
            tags_patterns = [
                r'"tags"\\s*:\\s*\\[([^\\]]+)\\]',
                r'"tagList"\\s*:\\s*\\[([^\\]]+)\\]',
            ]
            for pattern in tags_patterns:
                tags_match = re.search(pattern, html)
                if tags_match:
                    tag_items = re.findall(r'"tag"\\s*:\\s*"([^"]+)"', tags_match.group(1))
                    if not tag_items:
                        tag_items = re.findall(r'"([^"]{2,50})"', tags_match.group(1))
                    if tag_items:
                        # Фильтруем теги
                        clean_tags = []
                        for tag in tag_items:
                            tag_lower = tag.lower()
                            if not any(fw in tag_lower for fw in FILTER_WORDS) and len(tag) > 1:
                                try:
                                    tag = tag.encode().decode('unicode-escape')
                                except:
                                    pass
                                clean_tags.append(tag)
                        if clean_tags:
                            result.tags = clean_tags[:50]
                            result.tag_count = len(result.tags)
                            logger.info(f"GetContact: found {len(result.tags)} tags")
                        break

            # Метод 3: Парсим страницу если JSON не дал результат
            if not result.display_name:
                body_text = await self._page.inner_text('body')
                body_lower = body_text.lower()

                hidden_signs = ['не можем показать результат', 'отказался быть видимым', 'скрыл свой профиль',
                                'hidden profile', 'profile is hidden']
                if any(sign in body_lower for sign in hidden_signs):
                    result.display_name = "🔒 Профиль скрыт"
                    return result

                not_found_signs = ['not found', 'не найден', 'no results', 'no information']
                if any(sign in body_lower for sign in not_found_signs):
                    result.display_name = "❌ Не найден в базе"
                    return result

                # Ищем имя в DOM элементах
                name_selectors = [
                    '[class*="name"]',
                    '[class*="title"]',
                    '[class*="profile"]',
                    '[class*="result"]',
                    '[class*="card"]',
                    'h1', 'h2', 'h3',
                ]

                for selector in name_selectors:
                    try:
                        elements = await self._page.locator(selector).all()
                        for el in elements:
                            if not await el.is_visible():
                                continue
                            text = (await el.inner_text()).strip()
                            if not text or len(text) < 2 or len(text) > 100:
                                continue
                            text_lower = text.lower()
                            if any(fw in text_lower for fw in FILTER_WORDS):
                                continue
                            # Пропускаем номера телефонов
                            if text.startswith('+') or text.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').isdigit():
                                continue
                            if any(x in text_lower for x in ['captcha', 'cookie', 'recaptcha', 'robot', 'verify']):
                                continue
                            # Должны быть буквы
                            if any(c.isalpha() for c in text):
                                result.display_name = text
                                logger.info(f"GetContact: found name via DOM: {text}")
                                break
                        if result.display_name:
                            break
                    except:
                        pass

            # Определяем страну
            if 'россия' in html.lower() or 'russia' in html.lower():
                result.country = 'Россия'
            elif 'украина' in html.lower() or 'ukraine' in html.lower():
                result.country = 'Украина'
            elif 'беларусь' in html.lower() or 'belarus' in html.lower():
                result.country = 'Беларусь'
            elif 'казахстан' in html.lower() or 'kazakhstan' in html.lower():
                result.country = 'Казахстан'

            # Ищем оператора
            operator_match = re.search(r'"carrier"\\s*:\\s*"([^"]+)"', html)
            if operator_match:
                result.carrier = operator_match.group(1)

            # Ищем SPAM
            if '"isSpam":true' in html or '"isSpam": true' in html or '"spam":true' in html:
                result.is_spam = True
            spam_match = re.search(r'"spamCount"\\s*:\\s*(\\d+)', html)
            if spam_match:
                result.spam_count = int(spam_match.group(1))
                if result.spam_count > 0:
                    result.is_spam = True

            # Проверяем SPAM badge в HTML
            if 'spam' in html.lower() and ('badge' in html.lower() or 'label' in html.lower() or 'tag' in html.lower()):
                result.is_spam = True

            if not result.display_name:
                result.display_name = "Информация недоступна"

        except Exception as e:
            logger.error(f"GetContact parse error: {e}")
            result.error = str(e)
        return result
'''

# 3. GETCONTACT - улучшенное форматирование
NEW_FORMAT_GC_RESULT = '''
def format_gc_result(result: GCSearchResult) -> str:
    """Форматировать результат GetContact."""
    phone = result.phone
    if len(phone) == 11 and phone.startswith('7'):
        pf = f"+{phone[0]} ({phone[1:4]}) {phone[4:7]}-{phone[7:9]}-{phone[9:11]}"
    else:
        pf = f"+{phone}"

    lines = ["━━━━━━━━━━━━━━━━━━━━", f"📱 <b>{pf}</b>", "━━━━━━━━━━━━━━━━━━━━"]

    if result.display_name:
        lines.append(f"\\n👤 <b>{result.display_name}</b>")

    # SPAM badge
    if result.is_spam:
        spam = "\\n⚠️ <b>SPAM</b>"
        if result.spam_count:
            spam += f" ({result.spam_count} жалоб)"
        lines.append(spam)

    # Оператор и страна
    carrier_country = []
    if result.carrier:
        carrier_country.append(result.carrier)
    if result.country:
        carrier_country.append(result.country)
    if carrier_country:
        lines.append(f"\\n📡 {' - '.join(carrier_country)}")

    # Теги
    if result.tags:
        cnt = result.tag_count or len(result.tags)
        lines.append(f"\\n🏷 <b>Записан как ({cnt}):</b>")
        for i, tag in enumerate(result.tags[:30], 1):
            lines.append(f"  {i}. {tag}")
        if len(result.tags) > 30:
            lines.append(f"  <i>...ещё {len(result.tags) - 30}</i>")
    else:
        lines.append("\\n📋 <i>Нет тегов</i>")

    lines.append("\\n━━━━━━━━━━━━━━━━━━━━")
    return "\\n".join(lines)
'''

# 4. VK - клавиатура выбора фото
NEW_VK_PHOTO_KB = '''
def vk_photo_count_kb(user_id: str):
    """Клавиатура выбора количества фото VK"""
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📷 10 фото", callback_data=f"vk_photos_{user_id}_10"),
            InlineKeyboardButton(text="📷 20 фото", callback_data=f"vk_photos_{user_id}_20"),
        ],
        [
            InlineKeyboardButton(text="📷 30 фото", callback_data=f"vk_photos_{user_id}_30"),
            InlineKeyboardButton(text="📷 50 фото", callback_data=f"vk_photos_{user_id}_50"),
        ],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="cancel_vk")]
    ])
'''

# 5. VK - handler для загрузки фото
NEW_VK_PHOTOS_HANDLER = '''
@router.callback_query(F.data.startswith("vk_photos_"))
async def cb_vk_photos(c: CallbackQuery):
    """Загрузка выбранного количества фото VK"""
    parts = c.data.split("_")
    vk_user_id = int(parts[2])
    photo_count = int(parts[3])

    await c.message.edit_text(f"⏳ <b>Загружаю {photo_count} фото...</b>", parse_mode="HTML")

    photos_result = await vk_api.get_all_photos(vk_user_id)

    if photos_result.get("private"):
        await c.message.edit_text("🔒 <b>Профиль закрыт</b>", parse_mode="HTML")
        return

    if photos_result.get("error"):
        await c.message.edit_text(f"⚠️ {photos_result.get('error')}", parse_mode="HTML")
        return

    photos = photos_result.get("photos", [])[:photo_count]

    if not photos:
        await c.message.edit_text("📷 <b>Фотографий не найдено</b>", parse_mode="HTML")
        return

    await c.message.edit_text(f"📷 <b>Отправляю {len(photos)} фото...</b>", parse_mode="HTML")

    sent_count = 0
    for i, photo in enumerate(photos):
        try:
            photo_url = vk_api.get_best_photo_url(photo)
            if not photo_url:
                continue

            photo_data = await vk_api.download_photo(photo_url)
            if not photo_data:
                continue

            caption = f"📷 <b>Фото {i + 1}/{len(photos)}</b>\\n"

            photo_timestamp = photo.get("date")
            if photo_timestamp:
                photo_date = datetime.fromtimestamp(photo_timestamp)
                caption += f"📅 {photo_date.strftime('%d.%m.%Y %H:%M')}\\n"

            likes = photo.get("likes", {}).get("count", 0)
            if likes:
                caption += f"❤️ {likes}"

            photo_file = BufferedInputFile(photo_data, filename=f"photo_{i + 1}.jpg")
            await c.message.answer_photo(photo=photo_file, caption=caption, parse_mode="HTML")
            sent_count += 1

            await asyncio.sleep(0.3)
        except Exception as e:
            logger.error(f"VK photo error {i}: {e}")
            continue

    if sent_count > 0:
        await c.message.answer(f"✅ <b>Готово!</b> Загружено: {sent_count}", parse_mode="HTML")
'''

# 6. WHATSAPP - метод получения всех фото
NEW_WHATSAPP_GET_ALL_PHOTOS = '''
    async def get_avatars(self, phone: str) -> dict:
        """Получить ВСЕ аватары профиля (историю)"""
        phone = self.normalize_phone(phone)
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/getAvatars/{self.api_token}"
                async with session.post(url, json={"chatId": f"{phone}@c.us"}) as resp:
                    data = await resp.json()
                    logger.info(f"WhatsApp getAvatars: {data}")
                    return data
        except Exception as e:
            logger.error(f"WhatsApp getAvatars error: {e}")
            return {"error": str(e)}

    async def get_all_profile_photos(self, phone: str) -> list:
        """Получить ВСЕ фото профиля WhatsApp"""
        phone = self.normalize_phone(phone)
        photos = []

        # 1. Текущий аватар
        avatar_result = await self.get_avatar(phone)
        if avatar_result.get("urlAvatar"):
            photos.append({
                "url": avatar_result["urlAvatar"],
                "type": "current",
                "index": 0
            })

        # 2. История аватаров
        avatars_result = await self.get_avatars(phone)

        avatar_urls = []
        if isinstance(avatars_result, dict):
            avatar_urls = (
                avatars_result.get("avatars", []) or
                avatars_result.get("urlAvatars", []) or
                avatars_result.get("urls", [])
            )
        elif isinstance(avatars_result, list):
            avatar_urls = avatars_result

        for url in avatar_urls:
            if isinstance(url, str) and url.startswith("http"):
                is_duplicate = any(p["url"] == url for p in photos)
                if not is_duplicate:
                    photos.append({
                        "url": url,
                        "type": "history",
                        "index": len(photos)
                    })
            elif isinstance(url, dict) and url.get("url"):
                photo_url = url["url"]
                is_duplicate = any(p["url"] == photo_url for p in photos)
                if not is_duplicate:
                    photos.append({
                        "url": photo_url,
                        "type": "history",
                        "index": len(photos)
                    })

        logger.info(f"WhatsApp: found {len(photos)} total photos for {phone}")
        return photos
'''

def patch_bot(bot_path: str):
    """Применить все патчи к боту"""
    
    if not os.path.exists(bot_path):
        print(f"❌ Файл не найден: {bot_path}")
        return False
    
    # Создаём бэкап
    backup_path = f"{bot_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(bot_path, 'r', encoding='utf-8') as f:
        original_content = f.read()
    
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(original_content)
    print(f"✅ Бэкап: {backup_path}")
    
    content = original_content
    changes = 0
    
    # 1. KASPERSKY - замена класса
    print("1️⃣ Kaspersky - замена на User-Agent версию...")
    kaspersky_start = content.find("class KasperskyWhoCalls:")
    if kaspersky_start != -1:
        # Ищем конец класса (следующий class или def на том же уровне)
        kaspersky_end = kaspersky_start
        lines = content[kaspersky_start:].split('\n')
        in_class = True
        for i, line in enumerate(lines[1:], 1):
            if line and not line.startswith(' ') and not line.startswith('\t') and line.strip():
                if line.startswith('class ') or line.startswith('def ') or line.startswith('@') or line.startswith('#'):
                    kaspersky_end = kaspersky_start + sum(len(l) + 1 for l in lines[:i])
                    break
        
        if kaspersky_end > kaspersky_start:
            content = content[:kaspersky_start] + NEW_KASPERSKY_CLASS + '\n\n' + content[kaspersky_end:]
            changes += 1
            print("   ✅ Kaspersky класс заменён")
    else:
        # Добавляем новый класс перед инициализацией
        init_pos = content.find("kaspersky_api = KasperskyWhoCalls()")
        if init_pos == -1:
            init_pos = content.find("# ==================== ИНИЦИАЛИЗАЦИЯ")
        if init_pos != -1:
            content = content[:init_pos] + NEW_KASPERSKY_CLASS + '\n\n' + content[init_pos:]
            changes += 1
            print("   ✅ Kaspersky класс добавлен")
    
    # 2. GETCONTACT _parse_results
    print("2️⃣ GetContact - улучшение _parse_results...")
    parse_start = content.find("async def _parse_results(self, phone")
    if parse_start != -1:
        # Ищем конец метода
        lines = content[parse_start:].split('\n')
        method_indent = len(lines[0]) - len(lines[0].lstrip())
        method_end = parse_start
        for i, line in enumerate(lines[1:], 1):
            stripped = line.lstrip()
            if stripped and not line.startswith(' ' * (method_indent + 1)) and not line.startswith('\t'):
                if stripped.startswith('async def ') or stripped.startswith('def ') or stripped.startswith('class '):
                    method_end = parse_start + sum(len(l) + 1 for l in lines[:i])
                    break
        
        if method_end > parse_start:
            content = content[:parse_start] + NEW_GETCONTACT_PARSE.strip() + '\n\n' + content[method_end:]
            changes += 1
            print("   ✅ _parse_results заменён")
    
    # 3. GETCONTACT format_gc_result
    print("3️⃣ GetContact - улучшение format_gc_result...")
    format_start = content.find("def format_gc_result(result")
    if format_start != -1:
        # Ищем конец функции
        lines = content[format_start:].split('\n')
        func_end = format_start
        for i, line in enumerate(lines[1:], 1):
            if line and not line.startswith(' ') and not line.startswith('\t'):
                if line.startswith('def ') or line.startswith('class ') or line.startswith('@') or line.startswith('#'):
                    func_end = format_start + sum(len(l) + 1 for l in lines[:i])
                    break
        
        if func_end > format_start:
            content = content[:format_start] + NEW_FORMAT_GC_RESULT.strip() + '\n\n' + content[func_end:]
            changes += 1
            print("   ✅ format_gc_result заменён")
    
    # 4. VK - добавляем клавиатуру выбора фото
    print("4️⃣ VK - добавление выбора количества фото...")
    if "def vk_photo_count_kb" not in content:
        # Добавляем после других клавиатур
        kb_pos = content.find("def quantity_kb(")
        if kb_pos != -1:
            # Ищем конец функции
            lines = content[kb_pos:].split('\n')
            for i, line in enumerate(lines[1:], 1):
                if line and not line.startswith(' ') and not line.startswith('\t'):
                    insert_pos = kb_pos + sum(len(l) + 1 for l in lines[:i])
                    content = content[:insert_pos] + '\n' + NEW_VK_PHOTO_KB.strip() + '\n\n' + content[insert_pos:]
                    changes += 1
                    print("   ✅ vk_photo_count_kb добавлена")
                    break
    
    # 5. VK - добавляем handler для фото
    if '@router.callback_query(F.data.startswith("vk_photos_"))' not in content:
        # Добавляем после VK handler'ов
        vk_handler_pos = content.find('@router.message(AdminStates.waiting_vk_link)')
        if vk_handler_pos != -1:
            # Ищем конец handler'а
            lines = content[vk_handler_pos:].split('\n')
            for i, line in enumerate(lines[1:], 1):
                if line.startswith('@router.') or line.startswith('# =='):
                    insert_pos = vk_handler_pos + sum(len(l) + 1 for l in lines[:i])
                    content = content[:insert_pos] + '\n' + NEW_VK_PHOTOS_HANDLER.strip() + '\n\n' + content[insert_pos:]
                    changes += 1
                    print("   ✅ VK photos handler добавлен")
                    break
    
    # 6. WhatsApp - добавляем методы для всех фото
    print("5️⃣ WhatsApp - добавление загрузки всех фото...")
    if "async def get_all_profile_photos" not in content:
        # Ищем класс WhatsAppAPI и добавляем методы
        wa_class_pos = content.find("class WhatsAppAPI:")
        if wa_class_pos != -1:
            # Ищем метод download_avatar
            download_pos = content.find("async def download_avatar(self, url", wa_class_pos)
            if download_pos != -1:
                # Вставляем перед download_avatar
                content = content[:download_pos] + NEW_WHATSAPP_GET_ALL_PHOTOS.strip() + '\n\n    ' + content[download_pos:]
                changes += 1
                print("   ✅ WhatsApp методы добавлены")
    
    # Сохраняем
    with open(bot_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Файл обновлён! Изменений: {changes}")
    
    # Проверяем синтаксис
    try:
        compile(content, bot_path, 'exec')
        print("✅ Синтаксис Python OK")
    except SyntaxError as e:
        print(f"⚠️ Ошибка синтаксиса: {e}")
        print("   Восстанавливаю бэкап...")
        with open(bot_path, 'w', encoding='utf-8') as f:
            f.write(original_content)
        return False
    
    return True


def main():
    print("=" * 60)
    print("🔧 Автопатч - ВСЕ исправления")
    print("=" * 60)
    print("1. Kaspersky - через User-Agent (без Playwright)")
    print("2. GetContact - SPAM + оператор (Tele2)")
    print("3. VK - выбор фото 10/20/30/50")
    print("4. WhatsApp - ВСЕ фото профиля")
    print("=" * 60)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}")
    
    confirm = input("Применить патч? [y/N]: ").strip().lower()
    if confirm != 'y':
        print("❌ Отменено")
        return
    
    if patch_bot(bot_path):
        print("\n" + "=" * 60)
        print("🎉 ГОТОВО! Перезапустите бота")
        print("=" * 60)


if __name__ == "__main__":
    main()
