#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Фикс GetContact - кодировка + оператор + SPAM
"""

import sys
import os
from datetime import datetime

# Исправленный метод _parse_results
NEW_PARSE_RESULTS = '''    async def _parse_results(self, phone: str) -> GCSearchResult:
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
                r'displayName["\\':]\\s*["\\'"]([^"\\'"]+)["\\'"]',
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

            if not result.display_name:
                result.display_name = "Информация недоступна"

        except Exception as e:
            logger.error(f"GetContact parse error: {e}")
            result.error = str(e)
        return result
'''

# Исправленное форматирование результата
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

    if result.carrier or result.country:
        lines.append(f"\\n🌍 {' - '.join(filter(None, [result.carrier, result.country]))}")

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
    
    # Бэкап
    backup_path = f"{bot_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Бэкап: {backup_path}")
    
    changes = 0
    
    # 1. Заменяем _parse_results
    print("1️⃣ Заменяю _parse_results...")
    parse_start = content.find("    async def _parse_results(self, phone")
    if parse_start != -1:
        # Ищем конец метода (следующий метод класса с тем же отступом)
        lines = content[parse_start:].split('\n')
        method_end = parse_start
        for i, line in enumerate(lines[1:], 1):
            # Ищем следующий метод (начинается с 4 пробелов + async def или def)
            if line.startswith('    async def ') or line.startswith('    def '):
                method_end = parse_start + sum(len(l) + 1 for l in lines[:i])
                break
            # Или конец класса
            if line and not line.startswith(' ') and not line.startswith('\t') and line.strip():
                if line.startswith('class ') or line.startswith('def ') or line.startswith('#'):
                    method_end = parse_start + sum(len(l) + 1 for l in lines[:i])
                    break
        
        if method_end > parse_start:
            content = content[:parse_start] + NEW_PARSE_RESULTS + '\n\n' + content[method_end:]
            changes += 1
            print("   ✅ _parse_results заменён")
        else:
            print("   ⚠️ Не нашёл конец метода")
    else:
        print("   ⚠️ _parse_results не найден")
    
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
    else:
        print("   ⚠️ format_gc_result не найден")
    
    # Сохраняем
    with open(bot_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Изменений: {changes}")
    
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
    print("=" * 50)
    print("🔧 Фикс GetContact - кодировка + оператор")
    print("=" * 50)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}")
    
    if fix_getcontact(bot_path):
        print("\n" + "=" * 50)
        print("✅ ГОТОВО! Перезапустите бота")
        print("=" * 50)
        print("\nОжидаемый результат:")
        print("━━━━━━━━━━━━━━━━━━━━")
        print("📱 +7 (921) 652-43-42")
        print("━━━━━━━━━━━━━━━━━━━━")
        print("👤 Марина Львовна Левая")
        print("🌍 MegaFon - Россия")
        print("📋 Нет тегов")
        print("━━━━━━━━━━━━━━━━━━━━")


if __name__ == "__main__":
    main()
