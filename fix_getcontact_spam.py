#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Фикс GetContact - определение SPAM
"""

import sys
import os
from datetime import datetime

# Улучшенный _parse_results с определением SPAM
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
            html_lower = html.lower()
            
            # Проверяем "не доступен"
            if 'ещё не доступен' in body_lower or 'еще не доступен' in body_lower or 'not available' in body_lower:
                result.display_name = '"" ещё не доступен.'
                logger.info("GetContact: номер ещё не доступен")
                return result

            # === ОПРЕДЕЛЕНИЕ SPAM ===
            # 1. Ищем в JSON
            if '"isSpam":true' in html or '"isSpam": true' in html or '"is_spam":true' in html:
                result.is_spam = True
                logger.info("GetContact: SPAM detected (JSON)")
            
            # 2. Ищем табличку SPAM в HTML/DOM
            spam_indicators = [
                'class="spam"',
                'class=\\'spam\\'',
                '>spam<',
                '>SPAM<',
                'badge-spam',
                'spam-badge',
                'is-spam',
                'spam-label',
                'spammer',
            ]
            for indicator in spam_indicators:
                if indicator.lower() in html_lower:
                    result.is_spam = True
                    logger.info(f"GetContact: SPAM detected ({indicator})")
                    break
            
            # 3. Ищем элемент с текстом SPAM на странице
            if not result.is_spam:
                try:
                    spam_els = await self._page.locator('text=SPAM').all()
                    for el in spam_els:
                        if await el.is_visible():
                            result.is_spam = True
                            logger.info("GetContact: SPAM detected (visible text)")
                            break
                except:
                    pass
            
            # 4. Ищем по классам содержащим spam
            if not result.is_spam:
                try:
                    spam_by_class = await self._page.locator('[class*="spam"]').all()
                    for el in spam_by_class:
                        if await el.is_visible():
                            result.is_spam = True
                            logger.info("GetContact: SPAM detected (class)")
                            break
                except:
                    pass

            # === ИМЯ ===
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

            # === ОПЕРАТОР ===
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
                for op in ['MegaFon', 'Мегафон', 'Tele2', 'Теле2', 'МТС', 'MTS', 'Билайн', 'Beeline', 'Yota', 'Йота']:
                    if op.lower() in html_lower:
                        result.carrier = op
                        break

            # === ТЕГИ ===
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

            # === СТРАНА ===
            if 'россия' in html_lower or 'russia' in html_lower:
                result.country = 'Россия'

            # === DOM FALLBACK для имени ===
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
            
            logger.info(f"GetContact result: name={result.display_name}, spam={result.is_spam}, carrier={result.carrier}")

        except Exception as e:
            logger.error(f"GetContact parse error: {e}")
            result.error = str(e)
        return result
'''

# Улучшенный format_gc_result с SPAM
NEW_FORMAT_GC_RESULT = '''def format_gc_result(result: GCSearchResult) -> str:
    phone = result.phone
    if len(phone) == 11 and phone.startswith('7'):
        phone = f"+7 ({phone[1:4]}) {phone[4:7]}-{phone[7:9]}-{phone[9:11]}"
    
    lines = [
        "━━━━━━━━━━━━━━━━━━━━",
        f"📱 {phone}",
        "━━━━━━━━━━━━━━━━━━━━",
    ]
    
    if result.error:
        lines.append(f"❌ {result.error}")
    else:
        if result.display_name:
            lines.append(f"👤 {result.display_name}")
        
        # SPAM индикатор
        if result.is_spam:
            lines.append("⚠️ SPAM")
        
        if result.carrier:
            lines.append(f"📡 {result.carrier}")
        
        if result.country:
            lines.append(f"🌍 {result.country}")
        
        if result.tags:
            lines.append(f"🏷 Теги: {', '.join(result.tags[:5])}")
            if len(result.tags) > 5:
                lines.append(f"   ...и ещё {len(result.tags) - 5}")
        else:
            lines.append("📋 Нет тегов")
    
    lines.append("━━━━━━━━━━━━━━━━━━━━")
    return "\\n".join(lines)
'''


def fix_getcontact_spam(bot_path: str):
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
    
    # 1. _parse_results
    print("1️⃣ Заменяю _parse_results (с детекцией SPAM)...")
    start = content.find("    async def _parse_results(self, phone")
    if start != -1:
        lines = content[start:].split('\n')
        end = start
        depth = 0
        for i, line in enumerate(lines):
            if i == 0:
                depth = 1
                continue
            stripped = line.lstrip()
            if stripped.startswith('async def ') or stripped.startswith('def '):
                if len(line) - len(stripped) <= 4:  # метод класса (4 пробела)
                    end = start + sum(len(l) + 1 for l in lines[:i])
                    break
        if end > start:
            content = content[:start] + NEW_PARSE_RESULTS + '\n\n' + content[end:]
            changes += 1
            print("   ✅ _parse_results заменён")
    
    # 2. format_gc_result
    print("2️⃣ Заменяю format_gc_result...")
    start = content.find("def format_gc_result(result")
    if start != -1:
        lines = content[start:].split('\n')
        end = start
        for i, line in enumerate(lines[1:], 1):
            if line and not line.startswith(' ') and not line.startswith('\t'):
                if line.startswith('def ') or line.startswith('class ') or line.startswith('@') or line.startswith('#'):
                    end = start + sum(len(l) + 1 for l in lines[:i])
                    break
        if end > start:
            content = content[:start] + NEW_FORMAT_GC_RESULT + '\n\n' + content[end:]
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
    print("=" * 60)
    print("🔧 Фикс GetContact - определение SPAM")
    print("=" * 60)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}\n")
    
    if fix_getcontact_spam(bot_path):
        print("\n" + "=" * 60)
        print("✅ ГОТОВО!")
        print("=" * 60)
        print("\nТеперь бот определяет SPAM:")
        print("• Ищет в JSON: isSpam")
        print("• Ищет табличку SPAM на странице")
        print("• Ищет class='spam' в HTML")
        print("\nРезультат:")
        print("👤 Надежда Михайловна Клиентка Окр")
        print("⚠️ SPAM")
        print("🌍 Россия")


if __name__ == "__main__":
    main()
