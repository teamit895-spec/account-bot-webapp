#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Фикс GetContact - всегда начинать с главной страницы
"""

import sys
import os
from datetime import datetime

# Метод search - всегда начинает с главной
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
                
                # ВСЕГДА возвращаемся на главную перед поиском
                logger.info(f"GetContact: going to home page before search...")
                await self._page.goto(self.URL, wait_until='domcontentloaded', timeout=30000)
                await self._close_cookie_banner()
                await asyncio.sleep(1.5)
                
                return await self._do_search(phone_clean)
            except Exception as e:
                logger.warning(f"GetContact попытка {attempt + 1}/{max_retries}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2)
                    # Перезапускаем браузер при ошибке
                    await self.stop()
                else:
                    return GCSearchResult(phone=phone_clean, error=str(e))
        return GCSearchResult(phone=phone_clean, error="Все попытки исчерпаны")
'''

# Метод _do_search - без goto, просто ищет
NEW_DO_SEARCH = '''    async def _do_search(self, phone: str) -> GCSearchResult:
        if not self._page:
            raise Exception("Браузер не запущен")
        
        # Ищем поле ввода (уже на главной странице)
        input_field = await self._find_input()
        if not input_field:
            raise Exception("Поле ввода не найдено")

        # Очищаем и вводим номер
        await input_field.click()
        await input_field.fill('')
        await asyncio.sleep(0.3)
        
        # Вводим номер посимвольно
        for char in phone:
            await input_field.type(char, delay=50)
        
        await asyncio.sleep(0.5)
        await input_field.press('Enter')
        
        logger.info(f"GetContact: searching for {phone}...")
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

        return await self._parse_results(phone)
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
    
    # 1. Заменяем search
    print("1️⃣ Заменяю search (всегда с главной)...")
    search_start = content.find("    async def search(self, phone: str")
    if search_start != -1:
        lines = content[search_start:].split('\n')
        method_end = search_start
        for i, line in enumerate(lines[1:], 1):
            if line.startswith('    async def ') or line.startswith('    def '):
                method_end = search_start + sum(len(l) + 1 for l in lines[:i])
                break
        
        if method_end > search_start:
            content = content[:search_start] + NEW_SEARCH_METHOD + '\n\n' + content[method_end:]
            changes += 1
            print("   ✅ search заменён")
    
    # 2. Заменяем _do_search
    print("2️⃣ Заменяю _do_search...")
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
    print("🔧 Фикс GetContact - всегда с главной страницы")
    print("=" * 55)
    print("Логика: Главная → Ввод номера → Результат")
    print("=" * 55)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}\n")
    
    if fix_getcontact(bot_path):
        print("\n" + "=" * 55)
        print("✅ ГОТОВО! Перезапустите бота")
        print("=" * 55)
        print("\nТеперь каждый пробив:")
        print("1. Переходит на главную web.getcontact.com")
        print("2. Вводит номер в поле поиска")
        print("3. Нажимает Enter")
        print("4. Получает результат")


if __name__ == "__main__":
    main()
