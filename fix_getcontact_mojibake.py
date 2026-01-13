#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Фикс GetContact - исправление кодировки (mojibake)
Проблема: UTF-8 текст читается как Latin-1
ÐÐ°ÑÐ¸Ð½Ð° → Марина
"""

import sys
import os
from datetime import datetime

# Исправленный метод _parse_results с правильным декодированием
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
            # Проверяем есть ли кириллица
            has_cyrillic = any('\\u0400' <= c <= '\\u04FF' for c in text)
            if has_cyrillic:
                return text  # Уже нормальный текст
            # Пробуем исправить mojibake
            try:
                # Latin-1 -> bytes -> UTF-8
                fixed = text.encode('latin-1').decode('utf-8')
                return fixed
            except (UnicodeDecodeError, UnicodeEncodeError):
                pass
            # Пробуем cp1252
            try:
                fixed = text.encode('cp1252').decode('utf-8')
                return fixed
            except (UnicodeDecodeError, UnicodeEncodeError):
                pass
            return text
        
        try:
            await asyncio.sleep(2)

            html = await self._page.content()

            # Метод 1: Ищем displayName в JSON
            name_patterns = [
                r'"displayName"\\s*:\\s*"([^"]+)"',
                r'"name"\\s*:\\s*"([^"]+)"',
                r'"fullName"\\s*:\\s*"([^"]+)"',
            ]

            for pattern in name_patterns:
                match = re.search(pattern, html)
                if match:
                    name = match.group(1)
                    
                    # 1. Сначала пробуем unicode-escape (для \\uXXXX)
                    try:
                        name = name.encode('utf-8').decode('unicode-escape')
                    except:
                        pass
                    
                    # 2. Исправляем mojibake
                    name = fix_mojibake(name)
                    
                    if name and name not in ('null', 'undefined', '', 'Unknown') and len(name) > 1:
                        name_lower = name.lower()
                        if not any(fw in name_lower for fw in FILTER_WORDS):
                            result.display_name = name
                            logger.info(f"GetContact: found name: {name}")
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
                        clean_tags = []
                        for tag in tag_items:
                            try:
                                tag = tag.encode('utf-8').decode('unicode-escape')
                            except:
                                pass
                            tag = fix_mojibake(tag)
                            tag_lower = tag.lower()
                            if not any(fw in tag_lower for fw in FILTER_WORDS) and len(tag) > 1:
                                clean_tags.append(tag)
                        if clean_tags:
                            result.tags = clean_tags[:50]
                            result.tag_count = len(result.tags)
                        break

            # Метод 3: DOM парсинг
            if not result.display_name:
                body_text = await self._page.inner_text('body')
                body_lower = body_text.lower()

                if any(s in body_lower for s in ['не можем показать', 'скрыл свой профиль', 'hidden profile']):
                    result.display_name = "🔒 Профиль скрыт"
                    return result

                if any(s in body_lower for s in ['not found', 'не найден', 'no results']):
                    result.display_name = "❌ Не найден"
                    return result

                for selector in ['[class*="name"]', '[class*="title"]', 'h1', 'h2', 'h3']:
                    try:
                        elements = await self._page.locator(selector).all()
                        for el in elements:
                            if not await el.is_visible():
                                continue
                            text = (await el.inner_text()).strip()
                            text = fix_mojibake(text)
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

            # Страна
            if 'россия' in html.lower() or 'russia' in html.lower():
                result.country = 'Россия'

            # Оператор
            carrier_match = re.search(r'"carrier"\\s*:\\s*"([^"]+)"', html)
            if carrier_match:
                carrier = carrier_match.group(1)
                carrier = fix_mojibake(carrier)
                result.carrier = carrier

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
    
    # Бэкап
    backup_path = f"{bot_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Бэкап: {backup_path}")
    
    # Заменяем _parse_results
    print("🔧 Заменяю _parse_results с fix_mojibake...")
    
    parse_start = content.find("    async def _parse_results(self, phone")
    if parse_start == -1:
        print("❌ _parse_results не найден")
        return False
    
    # Ищем конец метода
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
        print("✅ _parse_results заменён")
    else:
        print("❌ Не нашёл конец метода")
        return False
    
    # Сохраняем
    with open(bot_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Проверяем синтаксис
    try:
        compile(content, bot_path, 'exec')
        print("✅ Синтаксис OK")
        return True
    except SyntaxError as e:
        print(f"❌ Ошибка синтаксиса: {e}")
        with open(bot_path, 'w', encoding='utf-8') as f:
            with open(backup_path, 'r', encoding='utf-8') as bf:
                f.write(bf.read())
        print("   Восстановлен бэкап")
        return False


def main():
    print("=" * 55)
    print("🔧 Фикс GetContact - исправление кодировки (mojibake)")
    print("=" * 55)
    print("Проблема: ÐÐ°ÑÐ¸Ð½Ð° вместо Марина")
    print("Решение:  fix_mojibake() - Latin-1 → UTF-8")
    print("=" * 55)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}\n")
    
    if fix_getcontact(bot_path):
        print("\n" + "=" * 55)
        print("✅ ГОТОВО! Перезапустите бота")
        print("=" * 55)
        print("\nОжидаемый результат:")
        print("━━━━━━━━━━━━━━━━━━━━")
        print("📱 +7 (921) 652-43-42")
        print("━━━━━━━━━━━━━━━━━━━━")
        print("👤 Марина Львовна Левая")
        print("🌍 MegaFon - Россия")
        print("━━━━━━━━━━━━━━━━━━━━")


if __name__ == "__main__":
    main()
