#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Фикс GetContact - добавление оператора (MegaFon, Tele2, МТС...)
"""

import sys
import os
from datetime import datetime

# Исправленный метод с правильным парсингом carrier
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
                fixed = text.encode('latin-1').decode('utf-8')
                return fixed
            except:
                pass
            try:
                fixed = text.encode('cp1252').decode('utf-8')
                return fixed
            except:
                pass
            return text
        
        try:
            await asyncio.sleep(2)

            html = await self._page.content()
            
            # Логируем часть HTML для отладки
            logger.info(f"GetContact HTML length: {len(html)}")

            # ===== ИМЯ =====
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

            # ===== ОПЕРАТОР (carrier) =====
            carrier_patterns = [
                r'"carrier"\\s*:\\s*"([^"]+)"',
                r'"operator"\\s*:\\s*"([^"]+)"',
                r'"provider"\\s*:\\s*"([^"]+)"',
                r'carrier["\\':]\\s*["\\'"]([^"\\'"]+)["\\'"]',
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
            
            # Если не нашли в JSON, ищем в тексте страницы
            if not result.carrier:
                # Известные операторы
                operators = ['MegaFon', 'Мегафон', 'Tele2', 'Теле2', 'МТС', 'MTS', 'Билайн', 'Beeline', 
                            'Yota', 'Йота', 'Ростелеком', 'Rostelecom', 'МГТС', 'Мотив']
                for op in operators:
                    if op.lower() in html.lower():
                        result.carrier = op
                        logger.info(f"GetContact: carrier from text = {op}")
                        break

            # ===== ТЕГИ =====
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
                            logger.info(f"GetContact: tags = {len(result.tags)}")
                        break

            # ===== СТРАНА =====
            country_patterns = [
                r'"country"\\s*:\\s*"([^"]+)"',
                r'"countryName"\\s*:\\s*"([^"]+)"',
            ]
            for pattern in country_patterns:
                country_match = re.search(pattern, html)
                if country_match:
                    country = country_match.group(1)
                    try:
                        country = country.encode('utf-8').decode('unicode-escape')
                    except:
                        pass
                    country = fix_mojibake(country)
                    if country and country not in ('null', 'undefined', ''):
                        result.country = country
                        logger.info(f"GetContact: country = {country}")
                        break
            
            # Fallback для страны
            if not result.country:
                if 'россия' in html.lower() or 'russia' in html.lower():
                    result.country = 'Россия'

            # ===== SPAM =====
            if '"isSpam":true' in html or '"isSpam": true' in html:
                result.is_spam = True
                logger.info("GetContact: SPAM detected")

            # ===== DOM FALLBACK =====
            if not result.display_name:
                body_text = await self._page.inner_text('body')
                body_lower = body_text.lower()

                if any(s in body_lower for s in ['не можем показать', 'скрыл свой профиль', 'hidden profile']):
                    result.display_name = "🔒 Профиль скрыт"
                    return result

                if any(s in body_lower for s in ['not found', 'не найден', 'no results']):
                    result.display_name = "❌ Не найден"
                    return result

                for selector in ['[class*="name"]', '[class*="title"]', 'h1', 'h2']:
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

            if not result.display_name:
                result.display_name = "Информация недоступна"

        except Exception as e:
            logger.error(f"GetContact parse error: {e}")
            result.error = str(e)
        return result
'''

# Исправленное форматирование с оператором
NEW_FORMAT_GC_RESULT = '''def format_gc_result(result: GCSearchResult) -> str:
    """Форматировать результат GetContact."""
    phone = result.phone
    if len(phone) == 11 and phone.startswith('7'):
        pf = f"+{phone[0]} ({phone[1:4]}) {phone[4:7]}-{phone[7:9]}-{phone[9:11]}"
    else:
        pf = f"+{phone}"

    lines = ["━━━━━━━━━━━━━━━━━━━━", f"📱 <b>{pf}</b>", "━━━━━━━━━━━━━━━━━━━━"]

    if result.display_name:
        lines.append(f"\\n👤 <b>{result.display_name}</b>")

    if result.is_spam:
        spam = "\\n⚠️ <b>SPAM</b>"
        if result.spam_count:
            spam += f" ({result.spam_count})"
        lines.append(spam)

    # Оператор и страна в одну строку
    if result.carrier or result.country:
        parts = []
        if result.carrier:
            parts.append(result.carrier)
        if result.country:
            parts.append(result.country)
        lines.append(f"\\n🌍 {' - '.join(parts)}")

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
    
    # 1. Заменяем _parse_results
    print("1️⃣ Заменяю _parse_results...")
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
    
    # 2. Заменяем format_gc_result
    print("2️⃣ Заменяю format_gc_result...")
    format_start = content.find("def format_gc_result(result")
    if format_start != -1:
        lines = content[format_start:].split('\n')
        func_end = format_start
        for i, line in enumerate(lines[1:], 1):
            if line and not line.startswith(' ') and not line.startswith('\t'):
                if line.startswith('def ') or line.startswith('class ') or line.startswith('@') or line.startswith('#'):
                    func_end = format_start + sum(len(l) + 1 for l in lines[:i])
                    break
        
        if func_end > format_start:
            content = content[:format_start] + NEW_FORMAT_GC_RESULT + '\n\n' + content[func_end:]
            changes += 1
            print("   ✅ format_gc_result заменён")
    
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
    print("=" * 55)
    print("🔧 Фикс GetContact - добавление оператора")
    print("=" * 55)
    print("Проблема: Не показывает MegaFon, Tele2, МТС...")
    print("Решение:  Улучшенный парсинг carrier")
    print("=" * 55)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}\n")
    
    if fix_getcontact(bot_path):
        print("\n" + "=" * 55)
        print("✅ ГОТОВО! Перезапустите бота")
        print("=" * 55)
        print("\nОжидаемый результат:")
        print("━━━━━━━━━━━━━━━━━━━━")
        print("📱 +7 (928) 157-33-34")
        print("━━━━━━━━━━━━━━━━━━━━")
        print("👤 Михаил Иванович")
        print("🌍 MegaFon - Россия")  # <-- ТЕПЕРЬ С ОПЕРАТОРОМ
        print("📋 Нет тегов")
        print("━━━━━━━━━━━━━━━━━━━━")


if __name__ == "__main__":
    main()
