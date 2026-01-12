#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Фикс GetContact - автоматический повторный запрос
Проблема: "ещё не доступен" при первом запросе
Решение: Возврат на главную + повторный поиск
"""

import sys
import os
from datetime import datetime

# Исправленный метод _do_search с retry
NEW_DO_SEARCH = '''    async def _do_search(self, phone: str) -> GCSearchResult:
        if not self._page:
            raise Exception("Браузер не запущен")
        
        MAX_RETRIES = 2
        
        for attempt in range(MAX_RETRIES):
            try:
                # Всегда начинаем с главной страницы
                await self._page.goto(self.URL, wait_until='networkidle', timeout=30000)
                await self._close_cookie_banner()
                await asyncio.sleep(1)

                input_field = await self._find_input()
                if not input_field:
                    raise Exception("Поле ввода не найдено")

                # Очищаем и вводим номер
                await input_field.click()
                await input_field.fill('')
                for char in phone:
                    await input_field.type(char, delay=50)
                await input_field.press('Enter')
                await asyncio.sleep(3)

                # Проверяем капчу
                if await self._check_for_captcha():
                    logger.info("🔄 GetContact: обнаружена капча...")
                    if not self.capsolver_key:
                        return GCSearchResult(phone=phone, error="Капча! Установите CapSolver ключ")
                    solved = await self._solve_captcha_with_capsolver()
                    if not solved:
                        return GCSearchResult(phone=phone, error="Не удалось решить капчу")
                    await asyncio.sleep(3)

                # Проверяем "ещё не доступен" или "Требуется подтверждение"
                page_text = await self._page.inner_text('body')
                page_lower = page_text.lower()
                
                not_available_signs = [
                    'ещё не доступен',
                    'еще не доступен', 
                    'not available yet',
                    'требуется подтверждение',
                    'verification required',
                    'please try again',
                    'попробуйте позже',
                ]
                
                is_not_available = any(sign in page_lower for sign in not_available_signs)
                
                if is_not_available and attempt < MAX_RETRIES - 1:
                    logger.info(f"GetContact: 'не доступен', попытка {attempt + 2}/{MAX_RETRIES}...")
                    # Возвращаемся на главную и пробуем снова
                    await self._page.goto(self.URL, wait_until='networkidle', timeout=30000)
                    await asyncio.sleep(2)
                    continue
                
                # Парсим результаты
                return await self._parse_results(phone)
                
            except Exception as e:
                if attempt < MAX_RETRIES - 1:
                    logger.warning(f"GetContact attempt {attempt + 1} failed: {e}")
                    await asyncio.sleep(2)
                    continue
                raise
        
        return GCSearchResult(phone=phone, error="Все попытки исчерпаны")
'''

# Также обновим _parse_results чтобы обрабатывать "не доступен"
NEW_PARSE_RESULTS = '''    async def _parse_results(self, phone: str) -> GCSearchResult:
        if not self._page:
            return GCSearchResult(phone=phone, error="Страница недоступна")
        result = GCSearchResult(phone=phone)
        FILTER_WORDS = {'we use cookies', 'accept all', 'getcontact', 'search', 'поиск', 'назад', 'позвонить',
                        'блокировать', 'россия (+7)', 'главная', 'premium', 'войти', 'sign in', 'log in',
                        'subscribe', 'подписка', 'тариф', 'оплата', 'download', 'скачать', 'app store', 'google play'}
        
        def fix_mojibake(text: str) -> str:
            """Исправляет mojibake - UTF-8 прочитанный как Latin-1"""
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
            await asyncio.sleep(2)  # Увеличено время ожидания

            # Сначала пробуем получить данные из JSON в HTML
            html = await self._page.content()

            # Проверяем "не доступен"
            body_text = await self._page.inner_text('body')
            body_lower = body_text.lower()
            
            if 'ещё не доступен' in body_lower or 'еще не доступен' in body_lower or 'not available' in body_lower:
                result.display_name = "❌ Номер ещё не доступен"
                return result

            # Метод 1: Ищем displayName в JSON
            name_patterns = [
                r'"displayName"\\s*:\\s*"([^"]+)"',
                r'"name"\\s*:\\s*"([^"]+)"',
                r'"fullName"\\s*:\\s*"([^"]+)"',
                r'displayName["\\':]\\s*["\\'"]([^"\\'"]+)["\\'"]',
            ]

            for pattern in name_patterns:
                match = re.search(pattern, html)
                if match:
                    name = match.group(1)
                    # Декодируем unicode если нужно
                    try:
                        name = name.encode('utf-8').decode('unicode-escape')
                    except:
                        pass
                    name = fix_mojibake(name)
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
                                    tag = tag.encode('utf-8').decode('unicode-escape')
                                except:
                                    pass
                                tag = fix_mojibake(tag)
                                clean_tags.append(tag)
                        if clean_tags:
                            result.tags = clean_tags[:50]
                            result.tag_count = len(result.tags)
                            logger.info(f"GetContact: found {len(result.tags)} tags")
                        break

            # Оператор (carrier)
            carrier_patterns = [
                r'"carrier"\\s*:\\s*"([^"]+)"',
                r'"operator"\\s*:\\s*"([^"]+)"',
            ]
            for pattern in carrier_patterns:
                carrier_match = re.search(pattern, html)
                if carrier_match:
                    carrier = carrier_match.group(1)
                    try:
                        carrier = carrier.encode('utf-8').decode('unicode-escape')
                    except:
                        pass
                    carrier = fix_mojibake(carrier)
                    if carrier and carrier not in ('null', 'undefined', ''):
                        result.carrier = carrier
                        logger.info(f"GetContact: carrier = {carrier}")
                        break
            
            # Fallback для оператора
            if not result.carrier:
                operators = ['MegaFon', 'Мегафон', 'Tele2', 'Теле2', 'МТС', 'MTS', 'Билайн', 'Beeline', 'Yota']
                for op in operators:
                    if op.lower() in html.lower():
                        result.carrier = op
                        break

            # Метод 3: Парсим страницу если JSON не дал результат
            if not result.display_name:
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
                            text = fix_mojibake(text)
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

            # SPAM
            if '"isSpam":true' in html or '"isSpam": true' in html:
                result.is_spam = True

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
    
    # 1. Заменяем _do_search
    print("1️⃣ Заменяю _do_search (добавляю retry)...")
    do_search_start = content.find("    async def _do_search(self, phone")
    if do_search_start != -1:
        lines = content[do_search_start:].split('\n')
        method_end = do_search_start
        for i, line in enumerate(lines[1:], 1):
            if line.startswith('    async def ') or line.startswith('    def '):
                method_end = do_search_start + sum(len(l) + 1 for l in lines[:i])
                break
        
        if method_end > do_search_start:
            content = content[:do_search_start] + NEW_DO_SEARCH + '\n\n' + content[method_end:]
            changes += 1
            print("   ✅ _do_search заменён")
    else:
        print("   ⚠️ _do_search не найден")
    
    # 2. Заменяем _parse_results
    print("2️⃣ Заменяю _parse_results...")
    parse_start = content.find("    async def _parse_results(self, phone")
    if parse_start != -1:
        lines = content[parse_start:].split('\n')
        method_end = parse_start
        for i, line in enumerate(lines[1:], 1):
            if line.startswith('    async def ') or line.startswith('    def '):
                method_end = parse_start + sum(len(l) + 1 for l in lines[:i])
                break
            if line and not line.startswith(' ') and not line.startswith('\t') and line.strip():
                if line.startswith('class ') or line.startswith('def ') or line.startswith('#'):
                    method_end = parse_start + sum(len(l) + 1 for l in lines[:i])
                    break
        
        if method_end > parse_start:
            content = content[:parse_start] + NEW_PARSE_RESULTS + '\n\n' + content[method_end:]
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
    print("🔧 Фикс GetContact - автоматический повторный запрос")
    print("=" * 60)
    print("Проблема: 'ещё не доступен' при первом запросе")
    print("Решение:  Возврат на главную + автоматический retry")
    print("=" * 60)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}\n")
    
    if fix_getcontact(bot_path):
        print("\n" + "=" * 60)
        print("✅ ГОТОВО! Перезапустите бота")
        print("=" * 60)
        print("\nТеперь бот автоматически:")
        print("1. Делает первый запрос")
        print("2. Если 'не доступен' → возвращается на главную")
        print("3. Делает повторный запрос")
        print("4. Получает данные: Некрасов А. М")


if __name__ == "__main__":
    main()
