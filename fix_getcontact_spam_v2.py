#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Фикс GetContact - определение SPAM v2
Ищет: spamDegree, badge, img SPAM
"""

import sys
import os
from datetime import datetime

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

            # ========== ОПРЕДЕЛЕНИЕ SPAM ==========
            
            # 1. spamDegree: 'red' или 'yellow' = SPAM
            spam_degree_match = re.search(r"spamDegree['\"]?\\s*[=:]\\s*['\"]?(red|yellow|orange)", html_lower)
            if spam_degree_match:
                result.is_spam = True
                logger.info(f"GetContact: SPAM (spamDegree={spam_degree_match.group(1)})")
            
            # 2. badge: 'spam' или содержит spam
            badge_match = re.search(r"badge['\"]?\\s*[=:]\\s*['\"]([^'\"]*spam[^'\"]*)['\"]", html_lower)
            if badge_match:
                result.is_spam = True
                logger.info(f"GetContact: SPAM (badge={badge_match.group(1)})")
            
            # 3. Ищем картинку SPAM (img с alt/src содержащим spam)
            if not result.is_spam:
                try:
                    spam_imgs = await self._page.locator('img[alt*="spam" i], img[alt*="SPAM"], img[src*="spam" i], img[src*="badge" i]').all()
                    for img in spam_imgs:
                        if await img.is_visible():
                            # Проверяем что это именно SPAM badge, а не что-то другое
                            alt = await img.get_attribute('alt') or ''
                            src = await img.get_attribute('src') or ''
                            if 'spam' in alt.lower() or 'spam' in src.lower():
                                result.is_spam = True
                                logger.info("GetContact: SPAM (img found)")
                                break
                except Exception as e:
                    logger.debug(f"Error checking spam img: {e}")
            
            # 4. Ищем элемент с классом содержащим spam/badge-spam
            if not result.is_spam:
                try:
                    spam_els = await self._page.locator('[class*="spam"], [class*="badge"]').all()
                    for el in spam_els:
                        if await el.is_visible():
                            text = await el.inner_text()
                            cls = await el.get_attribute('class') or ''
                            if 'spam' in text.lower() or 'spam' in cls.lower():
                                result.is_spam = True
                                logger.info("GetContact: SPAM (element class)")
                                break
                except:
                    pass
            
            # 5. Ищем текст SPAM на странице (не в меню)
            if not result.is_spam:
                # Ищем SPAM как отдельное слово рядом с именем
                if re.search(r'\\bSPAM\\b', html) or re.search(r'\\bСПАМ\\b', html, re.IGNORECASE):
                    result.is_spam = True
                    logger.info("GetContact: SPAM (text in HTML)")
            
            # 6. JSON isSpam
            if not result.is_spam:
                if '"isSpam":true' in html or '"isSpam": true' in html or '"is_spam":true' in html:
                    result.is_spam = True
                    logger.info("GetContact: SPAM (JSON isSpam)")

            # ========== ИМЯ ==========
            name_patterns = [
                r"displayName['\"]?\\s*[=:]\\s*['\"]([^'\"]+)['\"]",
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

            # ========== ОПЕРАТОР ==========
            carrier_patterns = [
                r"['\"]?carrier['\"]?\\s*[=:]\\s*['\"]([^'\"]+)['\"]",
                r"['\"]?operator['\"]?\\s*[=:]\\s*['\"]([^'\"]+)['\"]",
            ]
            for pattern in carrier_patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    carrier = match.group(1)
                    try:
                        carrier = carrier.encode('utf-8').decode('unicode-escape')
                    except:
                        pass
                    carrier = fix_mojibake(carrier)
                    if carrier and carrier not in ('null', 'undefined', '', 'Unknown'):
                        result.carrier = carrier
                        break
            
            if not result.carrier:
                for op in ['MegaFon', 'Мегафон', 'Tele2', 'Теле2', 'МТС', 'MTS', 'Билайн', 'Beeline', 'Yota', 'Йота']:
                    if op.lower() in html_lower:
                        result.carrier = op
                        break

            # ========== ТЕГИ ==========
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

            # ========== СТРАНА ==========
            if 'россия' in html_lower or 'russia' in html_lower:
                result.country = 'Россия'

            # ========== DOM FALLBACK ==========
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
            
            logger.info(f"GetContact FINAL: name={result.display_name}, spam={result.is_spam}, carrier={result.carrier}")

        except Exception as e:
            logger.error(f"GetContact parse error: {e}")
            result.error = str(e)
        return result
'''


def apply_patch(bot_path: str):
    if not os.path.exists(bot_path):
        print(f"❌ Файл не найден: {bot_path}")
        return False
    
    with open(bot_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    backup_path = f"{bot_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Бэкап: {backup_path}")
    
    # Заменяем _parse_results
    print("🔄 Заменяю _parse_results...")
    start = content.find("    async def _parse_results(self, phone")
    if start == -1:
        print("❌ _parse_results не найден")
        return False
    
    lines = content[start:].split('\n')
    end = start
    for i, line in enumerate(lines[1:], 1):
        stripped = line.lstrip()
        if stripped.startswith('async def ') or stripped.startswith('def '):
            indent = len(line) - len(stripped)
            if indent <= 4:
                end = start + sum(len(l) + 1 for l in lines[:i])
                break
    
    if end > start:
        content = content[:start] + NEW_PARSE_RESULTS + '\n\n' + content[end:]
        print("✅ _parse_results заменён")
    
    with open(bot_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    try:
        compile(content, bot_path, 'exec')
        print("✅ Синтаксис OK")
        return True
    except SyntaxError as e:
        print(f"❌ Ошибка: {e}")
        with open(backup_path, 'r', encoding='utf-8') as bf:
            with open(bot_path, 'w', encoding='utf-8') as f:
                f.write(bf.read())
        return False


def main():
    print("=" * 60)
    print("🔧 Фикс GetContact SPAM v2")
    print("=" * 60)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}\n")
    
    if apply_patch(bot_path):
        print("\n" + "=" * 60)
        print("✅ ГОТОВО!")
        print("=" * 60)
        print("\nТеперь ищет SPAM по:")
        print("• spamDegree: red/yellow/orange")
        print("• badge: 'spam'")
        print("• img с alt/src содержащим 'spam'")
        print("• Элементы с class*='spam'")
        print("• Текст SPAM в HTML")
        print("• JSON isSpam: true")


if __name__ == "__main__":
    main()
