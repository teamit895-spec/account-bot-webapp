#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Фикс GetContact - авто-retry если "ещё не доступен"
"""

import sys
import os
from datetime import datetime

# Метод search с проверкой результата и retry
NEW_SEARCH_METHOD = '''    async def search(self, phone: str, max_retries: int = 3) -> GCSearchResult:
        phone_clean = re.sub(r'\\D', '', phone)
        if phone_clean.startswith('8') and len(phone_clean) == 11:
            phone_clean = '7' + phone_clean[1:]
        elif len(phone_clean) == 10:
            phone_clean = '7' + phone_clean

        if not self.token:
            return GCSearchResult(phone=phone_clean, error="Токен не установлен")

        for attempt in range(max_retries):
            try:
                if not self._started:
                    await self.start()
                
                # Всегда начинаем с главной страницы
                logger.info(f"GetContact: attempt {attempt + 1}/{max_retries}, going to home...")
                await self._page.goto(self.URL, wait_until='domcontentloaded', timeout=30000)
                await self._close_cookie_banner()
                await asyncio.sleep(1.5)
                
                result = await self._do_search(phone_clean)
                
                # Проверяем результат - если "не доступен", пробуем ещё раз
                if result.display_name:
                    name_lower = result.display_name.lower()
                    not_available = (
                        'не доступен' in name_lower or
                        'not available' in name_lower or
                        result.display_name.strip() in ('', '""', '"" ещё не доступен.', 'ещё не доступен', '""') or
                        result.display_name.startswith('""') or
                        result.display_name.startswith('"') and 'не доступен' in name_lower
                    )
                    
                    if not_available and attempt < max_retries - 1:
                        logger.info(f"GetContact: got 'не доступен', retrying...")
                        await asyncio.sleep(2)
                        continue
                
                return result
                
            except Exception as e:
                logger.warning(f"GetContact attempt {attempt + 1}/{max_retries} error: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                    await self.stop()
                else:
                    return GCSearchResult(phone=phone_clean, error=str(e))
        
        return GCSearchResult(phone=phone_clean, error="Все попытки исчерпаны")
'''

# Метод _do_search
NEW_DO_SEARCH = '''    async def _do_search(self, phone: str) -> GCSearchResult:
        if not self._page:
            raise Exception("Браузер не запущен")
        
        input_field = await self._find_input()
        if not input_field:
            raise Exception("Поле ввода не найдено")

        await input_field.click()
        await input_field.fill('')
        await asyncio.sleep(0.3)
        
        for char in phone:
            await input_field.type(char, delay=50)
        
        await asyncio.sleep(0.5)
        await input_field.press('Enter')
        
        logger.info(f"GetContact: searching {phone}...")
        await asyncio.sleep(3)

        if await self._check_for_captcha():
            logger.info("🔄 GetContact: капча...")
            if not self.capsolver_key:
                return GCSearchResult(phone=phone, error="Капча! Установите CapSolver")
            solved = await self._solve_captcha_with_capsolver()
            if not solved:
                return GCSearchResult(phone=phone, error="Не удалось решить капчу")
            await asyncio.sleep(3)

        return await self._parse_results(phone)
'''

# _parse_results который НЕ возвращает "не доступен" как ошибку, а как имя (чтобы search мог проверить)
NEW_PARSE_RESULTS = '''    async def _parse_results(self, phone: str) -> GCSearchResult:
        if not self._page:
            return GCSearchResult(phone=phone, error="Страница недоступна")
        result = GCSearchResult(phone=phone)
        FILTER_WORDS = {'we use cookies', 'accept all', 'getcontact', 'search', 'поиск', 'назад', 'позвонить',
                        'блокировать', 'россия (+7)', 'главная', 'premium', 'войти', 'sign in', 'log in',
                        'subscribe', 'подписка', 'тариф', 'оплата', 'download', 'скачать', 'app store', 'google play'}
        
        def fix_mojibake(text: str) -> str:
            if not text:
                return text
            has_cyrillic = any('\\u0400' <= c <= '\\u04FF' for c in text)
            if has_cyrillic:
                return text
            try:
                return text.encode('latin-1').decode('utf-8')
            except:
                pass
            try:
                return text.encode('cp1252').decode('utf-8')
            except:
                pass
            return text
        
        try:
            await asyncio.sleep(2)
            html = await self._page.content()
            body_text = await self._page.inner_text('body')
            body_lower = body_text.lower()
            
            # Проверяем "не доступен" - возвращаем как имя чтобы search мог сделать retry
            if 'ещё не доступен' in body_lower or 'еще не доступен' in body_lower or 'not available' in body_lower:
                result.display_name = '"" ещё не доступен.'
                logger.info("GetContact: номер ещё не доступен")
                return result

            # Ищем имя в JSON
            name_patterns = [
                r'"displayName"\\s*:\\s*"([^"]+)"',
                r'"name"\\s*:\\s*"([^"]+)"',
                r'"fullName"\\s*:\\s*"([^"]+)"',
            ]

            for pattern in name_patterns:
                match = re.search(pattern, html)
                if match:
                    name = match.group(1)
                    try:
                        name = name.encode('utf-8').decode('unicode-escape')
                    except:
                        pass
                    name = fix_mojibake(name)
                    if name and name not in ('null', 'undefined', '', 'Unknown') and len(name) > 1:
                        name_lower = name.lower()
                        if not any(fw in name_lower for fw in FILTER_WORDS):
                            result.display_name = name
                            logger.info(f"GetContact: name = {name}")
                            break

            # Оператор
            carrier_patterns = [r'"carrier"\\s*:\\s*"([^"]+)"', r'"operator"\\s*:\\s*"([^"]+)"']
            for pattern in carrier_patterns:
                match = re.search(pattern, html)
                if match:
                    carrier = match.group(1)
                    try:
                        carrier = carrier.encode('utf-8').decode('unicode-escape')
                    except:
                        pass
                    carrier = fix_mojibake(carrier)
                    if carrier and carrier not in ('null', 'undefined', ''):
                        result.carrier = carrier
                        break
            
            if not result.carrier:
                for op in ['MegaFon', 'Мегафон', 'Tele2', 'Теле2', 'МТС', 'Билайн', 'Beeline', 'Yota']:
                    if op.lower() in html.lower():
                        result.carrier = op
                        break

            # Теги
            tags_match = re.search(r'"tags"\\s*:\\s*\\[([^\\]]+)\\]', html)
            if tags_match:
                tag_items = re.findall(r'"tag"\\s*:\\s*"([^"]+)"', tags_match.group(1))
                if not tag_items:
                    tag_items = re.findall(r'"([^"]{2,50})"', tags_match.group(1))
                if tag_items:
                    clean_tags = []
                    for tag in tag_items:
                        try:
                            tag = tag.encode('utf-8').decode('unicode-escape')
                        except:
                            pass
                        tag = fix_mojibake(tag)
                        if not any(fw in tag.lower() for fw in FILTER_WORDS) and len(tag) > 1:
                            clean_tags.append(tag)
                    if clean_tags:
                        result.tags = clean_tags[:50]
                        result.tag_count = len(result.tags)

            # Страна
            if 'россия' in html.lower() or 'russia' in html.lower():
                result.country = 'Россия'

            # SPAM
            if '"isSpam":true' in html or '"isSpam": true' in html:
                result.is_spam = True

            # DOM fallback
            if not result.display_name:
                if any(s in body_lower for s in ['скрыл свой профиль', 'hidden profile']):
                    result.display_name = "🔒 Профиль скрыт"
                    return result
                if any(s in body_lower for s in ['not found', 'не найден']):
                    result.display_name = "❌ Не найден"
                    return result

                for selector in ['[class*="name"]', 'h1', 'h2']:
                    try:
                        els = await self._page.locator(selector).all()
                        for el in els:
                            if not await el.is_visible():
                                continue
                            text = fix_mojibake((await el.inner_text()).strip())
                            if not text or len(text) < 2 or len(text) > 100:
                                continue
                            if any(fw in text.lower() for fw in FILTER_WORDS):
                                continue
                            if text.startswith('+') or text.replace(' ', '').replace('-', '').isdigit():
                                continue
                            if any(c.isalpha() for c in text):
                                result.display_name = text
                                break
                        if result.display_name:
                            break
                    except:
                        pass

            if not result.display_name:
                result.display_name = "Информация недоступна"

        except Exception as e:
            logger.error(f"GetContact parse error: {e}")
            result.error = str(e)
        return result
'''


def fix_getcontact(bot_path: str):
    if not os.path.exists(bot_path):
        print(f"❌ Файл не найден: {bot_path}")
        return False
    
    with open(bot_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    backup_path = f"{bot_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Бэкап: {backup_path}")
    
    changes = 0
    
    # 1. search
    print("1️⃣ Заменяю search (с авто-retry)...")
    start = content.find("    async def search(self, phone: str")
    if start != -1:
        lines = content[start:].split('\n')
        end = start
        for i, line in enumerate(lines[1:], 1):
            if line.startswith('    async def ') or line.startswith('    def '):
                end = start + sum(len(l) + 1 for l in lines[:i])
                break
        if end > start:
            content = content[:start] + NEW_SEARCH_METHOD + '\n\n' + content[end:]
            changes += 1
            print("   ✅ search заменён")
    
    # 2. _do_search
    print("2️⃣ Заменяю _do_search...")
    start = content.find("    async def _do_search(self, phone")
    if start != -1:
        lines = content[start:].split('\n')
        end = start
        for i, line in enumerate(lines[1:], 1):
            if line.startswith('    async def ') or line.startswith('    def '):
                end = start + sum(len(l) + 1 for l in lines[:i])
                break
        if end > start:
            content = content[:start] + NEW_DO_SEARCH + '\n\n' + content[end:]
            changes += 1
            print("   ✅ _do_search заменён")
    
    # 3. _parse_results
    print("3️⃣ Заменяю _parse_results...")
    start = content.find("    async def _parse_results(self, phone")
    if start != -1:
        lines = content[start:].split('\n')
        end = start
        for i, line in enumerate(lines[1:], 1):
            if line.startswith('    async def ') or line.startswith('    def '):
                end = start + sum(len(l) + 1 for l in lines[:i])
                break
            if line and not line.startswith(' ') and not line.startswith('\t') and line.strip():
                if line.startswith('class ') or line.startswith('def ') or line.startswith('#'):
                    end = start + sum(len(l) + 1 for l in lines[:i])
                    break
        if end > start:
            content = content[:start] + NEW_PARSE_RESULTS + '\n\n' + content[end:]
            changes += 1
            print("   ✅ _parse_results заменён")
    
    with open(bot_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Изменений: {changes}")
    
    try:
        compile(content, bot_path, 'exec')
        print("✅ Синтаксис OK")
        return True
    except SyntaxError as e:
        print(f"❌ Ошибка: {e}")
        with open(bot_path, 'w', encoding='utf-8') as f:
            with open(backup_path, 'r', encoding='utf-8') as bf:
                f.write(bf.read())
        return False


def main():
    print("=" * 60)
    print("🔧 Фикс GetContact - авто-retry при 'не доступен'")
    print("=" * 60)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}\n")
    
    if fix_getcontact(bot_path):
        print("\n" + "=" * 60)
        print("✅ ГОТОВО!")
        print("=" * 60)
        print("\nТеперь если бот получает '\"\" ещё не доступен':")
        print("→ Автоматически возвращается на главную")
        print("→ Делает повторный запрос")
        print("→ Выдаёт правильный результат: Михаил Иванович")


if __name__ == "__main__":
    main()
